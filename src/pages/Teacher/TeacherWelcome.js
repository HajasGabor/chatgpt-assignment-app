import React, { useState, useEffect } from 'react';
import { fetchUserData } from '../../api/Auth/ProfileData';
import { fetchTeacherClasses } from '../../api/Assignments/Teacher/GetClasses';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/Welcome.css';

const TeacherWelcome = () => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [classes, setClasses] = useState([]);
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userResponse = await fetchUserData();

                if (userResponse.message === 'Felhasználó adatai sikeresen lekérve') {
                    setUserName(userResponse.user.name);
                    setMessage('Sikeresen betöltve az adatok!');
                    console.log(userResponse.user);
                } else {
                    setMessage('Nem található felhasználói adat.');
                }

                const classesData = await fetchTeacherClasses();
                setClasses(classesData);

                const date = new Date();
                setCurrentDate(date.toLocaleDateString('hu-HU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }));
            } catch (err) {
                setError('Hiba történt az adatok lekérésekor.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div id="content">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div id="content">
            <div className="welcome-container">
                <h1 className="title">Üdv, {userName || 'Felhasználó'}!</h1>
                <p className="date">{currentDate}</p>
                <div className='welcome-content'>
                    {error && <p className="error-message">{error}</p>}
                    <h2>Osztályaim</h2>
                    <ul className="class-list">
                        {classes.length > 0 ? (
                            classes.map((classItem, index) => (
                                <li key={index}>{classItem.name}</li>
                            ))
                        ) : (
                            <p>Nincsenek osztályok.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default TeacherWelcome;
