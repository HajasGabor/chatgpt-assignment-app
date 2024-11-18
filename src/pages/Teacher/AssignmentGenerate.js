import React, { useState, useEffect } from 'react';
import { generateAssignment } from '../../api/Assignments/Teacher/GenerateAssignment';
import { fetchTeacherClasses } from '../../api/Assignments/Teacher/GetClasses';
import '../../styles/Teacher/AssignmentGenerate.css';

const AssignmentGenerate = ({ token }) => {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [difficulty, setDifficulty] = useState('Könnyű');
    const [className, setClassName] = useState('');
    const [questionCount, setQuestionCount] = useState(5);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        const loadClasses = async () => {
            try {
                const fetchedClasses = await fetchTeacherClasses(token);
                setClasses(fetchedClasses);
            } catch (error) {
                setError(error.message || 'Hiba történt az osztályok betöltése során.');
            }
        };

        loadClasses();
    }, [token]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        if (questionCount < 1 || questionCount > 20) {
            setError('A kérdések száma 1 és 20 között kell, hogy legyen!');
            setIsLoading(false);
            return;
        }

        try {
            const data = await generateAssignment(title, subject, difficulty, className, questionCount);
            setMessage(data.message || 'A dolgozat sikeresen legenerálva!');
            setTitle('');
            setSubject('');
            setDifficulty('Könnyű');
            setClassName('');
            setQuestionCount(5);

            setTimeout(() => {
                setMessage('');
            }, 3000);
        } catch (error) {
            setError(error.message || 'Hiba történt a dolgozat generálása során.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuestionCountChange = (e) => {
        const value = e.target.value;

        if (/^\d+$/.test(value) && value >= 1 && value <= 20) {
            setQuestionCount(Number(value));
        } else {
            setQuestionCount('');
        }
    };

    return (
        <div id="content">
            <div className="assignment-generate-container">
                <h1 className='title'>Dolgozat Generálás</h1>
                <div className="generate-container">
                    <form onSubmit={handleGenerate} className="generate-form">
                        <div className="form-group">
                            <label htmlFor="title">Dolgozat címe</label>
                            <input
                                type="text"
                                placeholder='Kérlek add meg a dolgozat címét!'
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="subject">Tantárgy</label>
                            <input
                                type="text"
                                placeholder='Kérlek adj meg egy tantárgyat!'
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="difficulty">Dolgozat nehézsége</label>
                            <select
                                id="difficulty"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                required
                            >
                                <option value="Könnyű">Könnyű</option>
                                <option value="Közepes">Közepes</option>
                                <option value="Nehéz">Nehéz</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="className">Osztály neve</label>
                            <select
                                id="className"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                required
                            >
                                <option value="">Válassz osztályt</option>
                                {classes.map((classItem) => (
                                    <option key={classItem._id} value={classItem.name}>
                                        {classItem.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="questionCount">Kérdések száma</label>
                            <input
                                type="number"
                                id="questionCount"
                                value={questionCount}
                                onChange={handleQuestionCountChange}
                                min="1"
                                max="20"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="generate-button"
                            disabled={isLoading}
                        >
                            Dolgozat generálása
                        </button>
                    </form>

                    {isLoading ? (
                        <div className="generate-loading-container">
                            <div className="generate-loading-text">Dolgozat generálása</div>
                            <div className="loading-dots">
                                <span className="dot">.</span>
                                <span className="dot">.</span>
                                <span className="dot">.</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {message && <p className="success-message">{message}</p>}
                            {error && <p className="error-message">{error}</p>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignmentGenerate;
