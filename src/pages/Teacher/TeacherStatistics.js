import React, { useState, useEffect } from 'react';
import { fetchTeacherStatistics } from '../../api/Assignments/Teacher/Statistics';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/Teacher/TeacherStatistics.css';

const TeacherStatistics = () => {
    const [statistics, setStatistics] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStatistics = async () => {
            try {
                const data = await fetchTeacherStatistics();
                setStatistics(data);
                console.log(data);
            } catch (error) {
                setError('A statisztikák betöltése sikertelen');
            } finally {
                setIsLoading(false);
            }
        };

        loadStatistics();
    }, []);

    if (isLoading) {
        return (
            <div id="content">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div id="content">
            <div className="statistics-container">
                <h1 className="stat-title">Statisztikák</h1>
                <div className="statistic-grid">
                    <div className="statistic-item">
                        <h2>Összes Feladat</h2>
                        <p>{statistics.totalAssignments}</p>
                    </div>

                    <div className="statistic-item">
                        <h2>Teljesített Feladatok</h2>
                        <p>{statistics.completedAssignments}</p>
                    </div>

                    <div className="statistic-item">
                        <h2>Befejezett Feladatok Aránya</h2>
                        <p>{statistics.completionRate}%</p>
                    </div>

                    <div className="statistic-item">
                        <h2>Átlagos Pontszám Százalék</h2>
                        <p>{statistics.avgScorePercentagePerAssignment}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherStatistics;
