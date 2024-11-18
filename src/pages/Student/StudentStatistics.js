import React, { useState, useEffect } from 'react';
import { fetchStudentStatistics } from '../../api/Assignments/Student/Statistics';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/Student/StudentStatistics.css';

const StudentStatistics = () => {
    const [statistics, setStatistics] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStatistics = async () => {
            try {
                const data = await fetchStudentStatistics();
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

    const totalPoints = statistics.assignmentsStatistics.reduce(
        (acc, assignment) => acc + assignment.totalPoints,
        0
    );
    const achievedPoints = statistics.assignmentsStatistics.reduce(
        (acc, assignment) => acc + assignment.achievedPoints,
        0
    );

    const totalAssignmentsCount = statistics.assignmentsStatistics.length;
    const averageScorePercentage = statistics.averageScorePercentage;

    return (
        <div id="content">
            <div className="student-statistics-container">
                <h1 className="stat-title">Statisztikák</h1>
                <div className='student-statistics'>
                    <div className="statistics-grid">
                            <div className="student-statistic-item">
                                <h2>megoldott dolgozatok száma</h2>
                                <p className='stat-text'>{statistics.completedAssignmentsCount}</p>
                            </div>
                            <div className="student-statistic-item">
                                <h2>Az utolsó dolgozat statisztikái</h2>
                                <div className="last-assignment">
                                    <p className='stat-text2'><strong>{statistics.assignmentsStatistics[statistics.assignmentsStatistics.length - 1].title}</strong></p>
                                    <p className='stat-text2'>
                                        Elért pontszám: {statistics.assignmentsStatistics[statistics.assignmentsStatistics.length - 1].achievedPoints}
                                        / {statistics.assignmentsStatistics[statistics.assignmentsStatistics.length - 1].totalPoints}
                                    </p>
                                    <p className='stat-text2'>
                                        Kitöltés dátuma: {new Date(statistics.assignmentsStatistics[statistics.assignmentsStatistics.length - 1].completedAt).toLocaleDateString()}
                                    </p>
                                </div>
                        </div>
                        <div className="student-statistic-item">
                            <h2>Átlagos pontszám</h2>
                            <p className='stat-text'>{averageScorePercentage.toFixed(2)}%</p>
                        </div>
                    </div>
                    <div className="statistics-grid">
                        <div className="student-statistic-item">
                            <h2>Elért Pontszámok Összesen</h2>
                            <p className='stat-text'>{achievedPoints} / {totalPoints}</p>
                        </div>

                        <div className="student-statistic-item">
                            <h2>Teljesíett dolgozatok</h2>
                            <p className='stat-text'> {statistics.completedAssignmentsCount}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentStatistics;
