const express = require('express');
const jwt = require('jsonwebtoken'); // Importáljuk a JWT-t a token kezeléséhez
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Class = require('../models/Class');
const openai = require('../services/openai');
const router = express.Router();
const authenticateTeacher = require('../middleware/authenticateTeacher');
const authenticateStudent = require('../middleware/authenticateStudent');

// Feladatsor generálása, csak tanároknak
router.post('/teacher/generate', authenticateTeacher, async (req, res) => {
  try {
    const { title, subject, difficulty, className, questionCount } = req.body;

    // Hiányzó mezők ellenőrzése
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!subject) missingFields.push('subject');
    if (!difficulty) missingFields.push('difficulty');
    if (!className) missingFields.push('className');
    if (!questionCount) missingFields.push('questionCount');

    // Ha vannak hiányzó mezők, visszaadjuk őket egy részletes hibaüzenetben
    if (missingFields.length > 0) {
      return res.status(400).json({ message: `A következő mezők megadása kötelező: ${missingFields.join(', ')}.` });
    }

    const numQuestions = Number.isInteger(questionCount) && questionCount > 0 ? questionCount : 5;

    // Osztály ID lekérdezése a megadott osztály név alapján
    const classData = await Class.findOne({ name: className });
    if (!classData) {
      return res.status(400).json({ message: 'Az adott osztály nem található.' });
    }

    // Osztály diákjainak lekérdezése
    const students = await User.find({ role: 'student', className: classData.name }).select('_id');
    if (students.length === 0) {
      return res.status(400).json({ message: 'Nincs diák az adott osztályban.' });
    }

    const studentIds = students.map(student => student._id);

    // Prompt a kérdések generálásához
    const prompt = `Készíts ${numQuestions} darab ${difficulty} nehézségű ${subject} kérdést a következő témában: "${title}". Minden kérdéshez add meg a helyes választ is. Példa formátum: "1. Kérdés: ... Helyes válasz: ...".`;
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500 * numQuestions,
      temperature: 0.7,
    });

    const responseText = response.choices[0].message.content.trim();
    const questionArray = responseText.split(/\d+\.\s+Kérdés:\s+/).filter(Boolean);

    // Kérdések létrehozása
    const questions = questionArray.slice(0, numQuestions).map((q) => {
      const [questionText, correctAnswer] = q.split('Helyes válasz:').map((s) => s.trim());
      return {
        questionText: questionText,
        correctAnswer: correctAnswer || null,
        points: 1, // Minden kérdéshez 1 pontot állítunk be alapértelmezésként
        studentAnswer: null,
        score: 0,
      };
    });

    // Teljes pontszám kiszámítása
    const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

    const assignment = new Assignment({
      teacherId: req.userId,
      title,
      subject,
      difficulty,
      questions,
      studentIds,
      totalPoints, // Maximális pontszám beállítása
      achievedPoints: 0, // Kezdetben nincs elért pontszám
      createdAt: new Date(),
    });

    await assignment.save();

    res.status(201).json({ message: 'Feladatsor sikeresen generálva és hozzárendelve a kiválasztott osztály diákjaihoz', assignment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hiba történt a feladatsor generálása közben.' });
  }
});

// Új végpont a tanár dolgozatainak lekérdezéséhez
router.get('/teacher/list', authenticateTeacher, async (req, res) => {
  try {
    const teacherId = req.userId; // A tanár azonosítója a tokenből

    // Az adatbázisból lekérjük azokat a dolgozatokat, amelyek a tanárhoz tartoznak
    const assignments = await Assignment.find({ teacherId });

    res.status(200).json({ message: 'Tanár dolgozatai sikeresen lekérve', assignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hiba történt a dolgozatok lekérdezése során' });
  }
});

// Dolgozat törlése tanár által
router.delete('/teacher/delete-assignment/:assignmentId', authenticateTeacher, async (req, res) => {
  try {
    const teacherId = req.userId; // Tanár azonosítója
    const { assignmentId } = req.params;

    // Ellenőrizzük, hogy a dolgozat a tanárhoz tartozik-e
    const assignment = await Assignment.findOne({ _id: assignmentId, teacherId });
    if (!assignment) {
      return res.status(404).json({ message: 'A dolgozat nem található vagy nincs jogosultsága törölni.' });
    }

    // Töröljük a diákok válaszait a dolgozatról
    await User.updateMany(
      { 'assignments.assignmentId': assignmentId },
      { $pull: { assignments: { assignmentId } } } // A hozzátartozó válaszokat töröljük
    );

    // Töröljük magát a dolgozatot
    await Assignment.findByIdAndDelete(assignmentId);

    res.status(200).json({ message: 'A dolgozat és a hozzá kapcsolódó diák válaszok sikeresen törölve.' });
  } catch (error) {
    console.error('Hiba történt a dolgozat törlése során:', error);
    res.status(500).json({ message: 'Hiba történt a dolgozat törlése során.' });
  }
});

// Statisztikai adatok visszaadása a tanár számára
router.get('/teacher/statistics', authenticateTeacher, async (req, res) => {
  try {
    const teacherId = req.userId;

    // Összes generált dolgozat száma
    const totalAssignments = await Assignment.countDocuments({ teacherId });

    // Teljesített dolgozatok száma és teljesítési arány
    const completedAssignments = await Assignment.aggregate([
      { $match: { teacherId } },
      { $unwind: "$studentIds" },
      {
        $lookup: {
          from: "users",
          localField: "studentIds",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      { $match: { "student.assignments.assignmentId": { $exists: true } } },
      {
        $group: {
          _id: "$_id",
          completedCount: { $sum: 1 }
        }
      }
    ]);

    const completedAssignmentCount = completedAssignments.length;
    const completionRate = totalAssignments > 0 ? (completedAssignmentCount / totalAssignments) * 100 : 0;

    // Átlagos százalékos pontszám dolgozatonként
    const assignmentsWithScores = await Assignment.aggregate([
      { $match: { teacherId } },
      { $unwind: "$studentIds" },
      {
        $lookup: {
          from: "users",
          localField: "studentIds",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      { $unwind: "$student.assignments" }, // Unwind to access each assignment separately
      { $match: { "student.assignments.assignmentId": { $exists: true } } },
      {
        $match: {
          $expr: {
            $eq: ["$student.assignments.assignmentId", "$_id"] // Ensure we're comparing assignments accurately
          }
        }
      },
      {
        $project: {
          assignmentId: "$_id",
          achievedPoints: "$student.assignments.achievedPoints",
          totalPoints: "$totalPoints"
        }
      },
      {
        $group: {
          _id: "$assignmentId",
          totalAchievedPoints: { $sum: "$achievedPoints" },
          maxScore: { $first: "$totalPoints" },
          count: { $sum: 1 } // Count how many students completed this assignment
        }
      }
    ]);

    // Átlagos százalékos pontszám kiszámítása
    const totalPercentageScores = assignmentsWithScores.reduce((sum, assignment) => {
      const averageScore = assignment.count > 0 ? assignment.totalAchievedPoints / assignment.count : 0;
      const percentageScore = assignment.maxScore > 0 ? (averageScore / assignment.maxScore) * 100 : 0;
      return sum + percentageScore;
    }, 0);

    const avgScorePercentagePerAssignment = assignmentsWithScores.length > 0 ? totalPercentageScores / assignmentsWithScores.length : 0;

    res.status(200).json({
      totalAssignments,
      completedAssignments: completedAssignmentCount,
      completionRate: completionRate.toFixed(2),
      avgScorePercentagePerAssignment: avgScorePercentagePerAssignment.toFixed(2) // Return as percentage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hiba történt a statisztikai adatok lekérdezése során.' });
  }
});

// Új végpont a diákok számára elérhető dolgozatok lekérdezéséhez
router.get('/student/list', authenticateStudent, async (req, res) => {
  try {
    const studentId = req.userId; // A diák azonosítója a tokenből származik

    // Lekérjük a diákhoz tartozó dolgozatokat
    const assignments = await Assignment.find({
      studentIds: studentId,
    });

    res.status(200).json({ message: 'Elérhető dolgozatok sikeresen lekérve', assignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hiba történt az elérhető dolgozatok lekérdezése során' });
  }
});

// Elérhető dolgozatok lekérdezése
router.get('/student/available-assignments', authenticateStudent, async (req, res) => {
  try {
    const studentId = req.userId;

    // A diák által már megírt dolgozatok ID-jainak lekérdezése
    const student = await User.findById(studentId).select('assignments');
    const completedAssignmentIds = student.assignments.map(assignment => assignment.assignmentId);

    // Azoknak a dolgozatoknak a lekérdezése, amelyek elérhetők a diák számára (nincs benne a completedAssignmentIds-ben)
    const availableAssignments = await Assignment.find({
      studentIds: studentId,
      _id: { $nin: completedAssignmentIds }
    }).select('-questions.correctAnswer'); // A helyes válasz mező kihagyása

    res.status(200).json({ message: 'Elérhető dolgozatok sikeresen lekérve', assignments: availableAssignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hiba történt az elérhető dolgozatok lekérdezése során.' });
  }
});

// Megírt dolgozatok lekérdezése
router.get('/student/completed-assignments', authenticateStudent, async (req, res) => {
  try {
    const studentId = req.userId;

    // A diák által megírt dolgozatok lekérdezése a `User` modellből
    const student = await User.findById(studentId)
      .populate({
        path: 'assignments.assignmentId', // Kitöltött dolgozat ID-jának kibővítése a részletekkel
        select: 'title subject totalPoints questions' // Csak a szükséges mezőket adja vissza a dolgozatból
      })
      .select('assignments');

    // A megírt dolgozatokból egy egyszerűsített struktúrát készítünk
    const completedAssignments = student.assignments.map(assignment => ({
      assignmentId: assignment.assignmentId._id,
      title: assignment.assignmentId.title,
      subject: assignment.assignmentId.subject,
      achievedPoints: assignment.achievedPoints,
      totalPoints: assignment.assignmentId.totalPoints,
      completedAt: assignment.completedAt,
      answers: assignment.answers.map(answer => {
        // Megkeresi a kérdés szövegét az eredeti kérdések között
        const question = assignment.assignmentId.questions.find(q => q._id.equals(answer.questionId));
        return {
          questionId: answer.questionId,
          questionText: question ? question.questionText : null,
          studentAnswer: answer.studentAnswer,
          correctAnswer: question ? question.correctAnswer : null,
          score: answer.score
        };
      })
    }));

    res.status(200).json({ message: 'Megírt dolgozatok sikeresen lekérve', assignments: completedAssignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hiba történt a megírt dolgozatok lekérdezése során.' });
  }
});

// Dolgozat kitöltése a diák által
router.post('/student/submit/:assignmentId', authenticateStudent, async (req, res) => {
  try {
    const studentId = req.userId;
    const { assignmentId } = req.params;
    const { answers } = req.body;

    // Ellenőrizzük a hiányzó mezőket
    const missingFields = [];
    if (!answers || Object.keys(answers).length === 0) missingFields.push('answers');
    if (missingFields.length > 0) {
      return res.status(400).json({ message: `A következő mezők megadása kötelező: ${missingFields.join(', ')}.` });
    }

    // Dolgozat lekérdezése
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Dolgozat nem található.' });
    }

    // Ellenőrizzük, hogy a diák már kitöltötte-e a dolgozatot
    const student = await User.findOne({ _id: studentId, "assignments.assignmentId": assignmentId });
    if (student) {
      return res.status(400).json({ message: 'Már kitöltötte ezt a dolgozatot.' });
    }

    // Get all question IDs in the assignment for validation
    const validQuestionIds = assignment.questions.map(q => q._id.toString());

    // Ellenőrizzük, hogy minden answer kérdés ID érvényes
    const invalidQuestionDetails = Object.keys(answers)
      .filter(questionId => !validQuestionIds.includes(questionId))
      .map(invalidId => {
        const question = assignment.questions.find(q => q._id.toString() === invalidId);
        return {
          questionId: invalidId,
          correctAnswer: question ? question.correctAnswer : "N/A"
        };
      });

    if (invalidQuestionDetails.length > 0) {
      return res.status(400).json({ 
        message: 'Érvénytelen kérdés azonosítók.',
        invalidQuestions: invalidQuestionDetails
      });
    }

    // Válaszok feldolgozása és pontszám számítása
    let achievedPoints = 0;
    const answerData = [];

    // Loop through each question and evaluate the answer using GPT
    for (const question of assignment.questions) {
      const studentAnswer = answers[question._id];
      let score = 0;

      if (studentAnswer) {
        // Use GPT to check if the student's answer matches the correct answer
        const prompt = `Is the following answer correct based on the provided correct answer? Please answer "yes" or "no".
        
        Question: ${question.questionText}
        Correct Answer: ${question.correctAnswer}
        Student's Answer: ${studentAnswer}`;
        
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 10,
          temperature: 0.5,
        });

        const gptResponse = response.choices[0].message.content.trim().toLowerCase();

        // If GPT considers the answer correct, grant full points for the question
        if (gptResponse === 'yes') {
          score = question.points;
          achievedPoints += question.points;
        }

        answerData.push({
          questionId: question._id,
          studentAnswer,
          score
        });
      } else {
        // Ha egy kérdéshez nincs válasz, ezt is jelzi
        answerData.push({
          questionId: question._id,
          studentAnswer: null,
          score: 0
        });
      }
    }

    // A diák adatainak frissítése a kitöltött dolgozattal
    await User.findByIdAndUpdate(studentId, {
      $push: {
        assignments: {
          assignmentId,
          answers: answerData,
          achievedPoints,
          completedAt: new Date()
        }
      }
    });

    // Dolgozat completedCount növelése
    assignment.completedCount = (assignment.completedCount || 0) + 1;
    await assignment.save();

    res.status(200).json({
      message: 'Dolgozat sikeresen beküldve.',
      achievedPoints,
      totalPoints: assignment.totalPoints
    });
  } catch (error) {
    console.error(error);

    // Ha mongoose vagy bármilyen más validációs hiba történik
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: `Érvénytelen adatok: ${errorMessages.join(', ')}` });
    }

    res.status(500).json({ message: 'Hiba történt a dolgozat beküldése során.' });
  }
});

// Diák statisztikai adatok lekérése
router.get('/student/statistics', authenticateStudent, async (req, res) => {
  try {
    const studentId = req.userId;

    // Diák adatainak lekérdezése az assignments mezővel
    const student = await User.findById(studentId).populate('assignments.assignmentId', 'title totalPoints');

    if (!student) {
      return res.status(404).json({ message: 'Diák nem található.' });
    }

    // Megírt dolgozatok száma
    const completedAssignmentsCount = student.assignments.length;

    // Átlagos pontszám kiszámítása
    const totalAchievedPoints = student.assignments.reduce((sum, assignment) => sum + assignment.achievedPoints, 0);
    const totalPossiblePoints = student.assignments.reduce((sum, assignment) => sum + assignment.assignmentId.totalPoints, 0);
    const averageScorePercentage = completedAssignmentsCount > 0 ? (totalAchievedPoints / totalPossiblePoints) * 100 : 0;

    // Egyéni dolgozatok statisztikája (cím, elért pontszám, max pontszám, kitöltés dátuma)
    const assignmentsStatistics = student.assignments.map(assignment => ({
      title: assignment.assignmentId.title,
      achievedPoints: assignment.achievedPoints,
      totalPoints: assignment.assignmentId.totalPoints,
      completedAt: assignment.completedAt
    }));

    res.status(200).json({
      completedAssignmentsCount,
      averageScorePercentage,
      assignmentsStatistics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hiba történt a statisztikai adatok lekérdezése során.' });
  }
});

module.exports = router;
