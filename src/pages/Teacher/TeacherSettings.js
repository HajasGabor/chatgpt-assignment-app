import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchUserData } from '../../api/Auth/ProfileData';
import { updateEmail, updatePassword } from '../../api/Auth/UserSettings';
import '../../styles/Settings.css';

const TeacherSettings = () => {
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
                setUserData({ email: userDataResponse.user.email });
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleEmailChange = async () => {
        try {
            const response = await updateEmail(newEmail);
            setUserData((prev) => ({ ...prev, email: newEmail }));
            setMessage(response.message);
        } catch (error) {
            console.error('Error updating email:', error);
            setMessage('Hiba történt az e-mail cím módosítása során.');
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmNewPassword) {
            setMessage('Az új jelszavak nem egyeznek.');
            return;
        }

        try {
            const response = await updatePassword(currentPassword, newPassword, confirmNewPassword);
            setMessage(response.message);
        } catch (error) {
            console.error('Error updating password:', error);
            setMessage('Hiba történt a jelszó módosítása során.');
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
                            <label htmlFor="email">Új e-mail cím:</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                            />
                            <button type="button" className="main-button" onClick={handleEmailChange}>
                                E-mail cím módosítása
                            </button>
                        </div>

                        <div className="form-group">
                            <label htmlFor="current-password">Jelenlegi jelszó:</label>
                            <input
                                type="password"
                                id="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="new-password">Új jelszó:</label>
                            <input
                                type="password"
                                id="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirm-new-password">Új jelszó megerősítése:</label>
                            <input
                                type="password"
                                id="confirm-new-password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                            />
                        </div>
                        <button type="button" className="main-button" onClick={handlePasswordChange}>
                            Jelszó módosítása
                        </button>
                    </form>
                </div>
                {message && <p className="message">{message}</p>}
            </div>
        </div>
    );
};

export default TeacherSettings;
