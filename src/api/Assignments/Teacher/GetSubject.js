export const fetchTeacherSubject = async () => {
    try {
        const response = await fetch('/api/teacher/subject', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('AccessToken')}`,
            }
        });

        if (!response.ok) {
            throw new Error('Hiba történt a tantárgy lekérése során');
        }

        const data = await response.json();
        return data.subjects;
    } catch (error) {
        console.error(error);
        throw new Error('Hiba történt az osztályok lekérése során');
    }
};
