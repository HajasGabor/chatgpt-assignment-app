import React, { useState, useEffect } from 'react';
import { fetchUserData } from '../../api/Auth/ProfileData';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/Welcome.css';

const WelcomePage = () => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchUserData();

                if (response.message === 'Felhasználó adatai sikeresen lekérve') {
                    setUserName(response.user.name);
                    setMessage('Sikeresen betöltve az adatok!');
                } else {
                    setMessage('Nem található felhasználói adat.');
                }

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
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
}

export default WelcomePage;
