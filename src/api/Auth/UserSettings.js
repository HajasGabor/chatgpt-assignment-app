// Frissíti az e-mail címet
export const updateEmail = async (newEmail) => {
    try {
      const response = await fetch('/api/auth/update-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('AccessToken')}`,
        },
        body: JSON.stringify({ newEmail }),
      });
  
      if (!response.ok) {
        throw new Error('Hiba történt az e-mail cím módosítása során');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };
  
  // Frissíti a jelszót
  export const updatePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('AccessToken')}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
  
      if (!response.ok) {
        throw new Error('Hiba történt a jelszó módosítása során');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };
  