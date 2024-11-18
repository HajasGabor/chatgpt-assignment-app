import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchUserData } from '../../api/Auth/ProfileData';
import { updateEmail, updatePassword } from '../../api/Auth/UserSettings';
import '../../styles/Settings.css';

const StudentSettings = () => {
    const [userData, setUserData] = useState({
        email: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const userDataResponse = await fetchUserData();
                setUserData({
                    email: userDataResponse.user.email,
                });
                console.log(userDataResponse);
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleEmailUpdate = async () => {
        try {
            const response = await updateEmail(newEmail);
            setUserData((prevData) => ({ ...prevData, email: response.updatedEmail }));
            setMessage('E-mail cím sikeresen módosítva.');
        } catch (error) {
            setMessage('Hiba történt az e-mail cím módosítása során.');
            console.error(error);
        }
    };

    const handlePasswordUpdate = async () => {
        if (newPassword !== confirmNewPassword) {
            setMessage('Az új jelszavak nem egyeznek.');
            return;
        }
        try {
            await updatePassword(currentPassword, newPassword, confirmNewPassword);
            setMessage('Jelszó sikeresen módosítva.');
        } catch (error) {
            setMessage('Hiba történt a jelszó módosítása során.');
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div id="content">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div id="content">
            <div className="settings-container">
                <h1 className="title">Beállítások</h1>
                <div className="generate-container">
                    <form className="settings-form">
                        <div className="form-group">
                            <label htmlFor="email">Új Email:</label>
                            <input
                                type="email"
                                id="newEmail"
                                name="newEmail"
                                value={newEmail}
                                placeholder="Új email"
                                onChange={(e) => setNewEmail(e.target.value)}
                            />
                            <button type="button" onClick={handleEmailUpdate} className="main-button">
                                Email módosítása
                            </button>
                        </div>
                        <div className="form-group">
                            <label htmlFor="currentPassword">Jelenlegi jelszó:</label>
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={currentPassword}
                                placeholder="Jelenlegi jelszó"
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="newPassword">Új jelszó:</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={newPassword}
                                placeholder="Új jelszó"
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmNewPassword">Új jelszó megerősítése:</label>
                            <input
                                type="password"
                                id="confirmNewPassword"
                                name="confirmNewPassword"
                                value={confirmNewPassword}
                                placeholder="Új jelszó megerősítése"
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                            />
                        </div>
                        <button type="button" onClick={handlePasswordUpdate} className="main-button">
                            Jelszó módosítása
                        </button>
                    </form>
                    {message && <p className="message">{message}</p>}
                </div>
            </div>
        </div>
    );
};

export default StudentSettings;
