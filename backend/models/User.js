const mongoose = require('mongoose');

const assignmentAnswerSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, unique: true },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
      studentAnswer: { type: String, required: false },
      score: { type: Number, default: 0 }
    }
  ],
  achievedPoints: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'student'], required: true },
  subject: { 
    type: String, 
    required: function() { return this.role === 'teacher'; }, 
    message: 'A tantárgy megadása kötelező a tanároknak.' 
  },
  className: { 
    type: String, 
    required: function() { return this.role === 'student'; }, 
    message: 'Az osztály megadása kötelező a diákoknak.' 
  },
  assignments: [assignmentAnswerSchema], // Kitöltött dolgozatok tárolása
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);