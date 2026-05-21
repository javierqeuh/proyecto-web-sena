// Cargar información del usuario en el header al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('userToken');
    
    if (!token) return;

    
    const getProfileImageUrl = (photoPath) => {
        if (!photoPath) return 'assets/img/default-avatar.png';
        if (photoPath.startsWith('http') || photoPath.startsWith('data:')) return photoPath;
        const baseUrl = 'http://localhost:3001';
        // Si el path ya incluye /uploads/ (como lo guarda el backend), no lo repetimos
        return photoPath.startsWith('/') ? `${baseUrl}${photoPath}` : `${baseUrl}/${photoPath}`;
    };

    try {
        const response = await fetch('http://localhost:3001/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const { user } = await response.json();
            
            const nameEl = document.getElementById('header-user-name');
            const roleEl = document.getElementById('header-user-role');
            const statusEl = document.getElementById('header-user-status');
            const headerPicture = document.getElementById('header-profile-picture');

            if (nameEl) nameEl.textContent = `${user.nombre} ${user.apellidos || ''}`.trim();
            if (roleEl) roleEl.textContent = user.rol.charAt(0).toUpperCase() + user.rol.slice(1); // Capitalizar
            if (statusEl) statusEl.textContent = user.activo ? 'Activo' : 'Inactivo';
            if (headerPicture) headerPicture.src = getProfileImageUrl(user.foto_perfil);
        } else {
            console.warn('No se pudo obtener la información del usuario.');
        }
    } catch (error) {
        console.error('Error al cargar info del header:', error);
    }
});