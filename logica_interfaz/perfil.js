/**
 * Lógica para la página: perfil.html
 */
document.addEventListener('DOMContentLoaded', function () {
    // Verificar que ésta sea la página correcta
    if (document.body.id !== 'page-perfil') {
        return;
    }

    // ========== ELEMENTOS DEL DOM ==========
    const saveProfileBtn = document.getElementById('save-profile-btn');

    // Campos del perfil
    const profileNombreInput = document.getElementById('profile-nombre');
    const profileApellidosInput = document.getElementById('profile-apellidos');
    const profileEmailInput = document.getElementById('profile-email');
    const profileRolInput = document.getElementById('profile-rol');
    const profileHeaderName = document.getElementById('profile-header-name');

    // ========== FUNCIONES DE UTILIDAD ==========

    /**
     * Obtiene el token de autenticación del localStorage
     * @returns {string} Token JWT del usuario
     */
    const getAuthToken = () => localStorage.getItem('userToken');

    /**
     * Obtiene los datos del usuario autenticado del token almacenado
     * @returns {Object} Objeto con los datos del usuario
     */
    const getUserData = () => {
        const userStr = localStorage.getItem('userData');
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    };

    /**
     * Construye la URL completa para una imagen de perfil
     */
    const getProfileImageUrl = (photoPath) => {
        if (!photoPath) return 'assets/img/default-avatar.png';
        if (photoPath.startsWith('http') || photoPath.startsWith('data:')) return photoPath;
        const baseUrl = 'http://localhost:3001';
        // Si el path ya incluye /uploads/ (como lo guarda el backend), no lo repetimos
        return photoPath.startsWith('/') ? `${baseUrl}${photoPath}` : `${baseUrl}/${photoPath}`;
    };

    /**
     * Verifica que el usuario esté autenticado
     * @returns {boolean} true si existe token, false en caso contrario
     */
    const checkAuthentication = () => {
        const token = getAuthToken();
        if (!token) {
            window.showAppNotification('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'error');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    };

    // ========== FUNCIONES PRINCIPALES ==========
    const loadUserProfile = async () => {
        if (!checkAuthentication()) return;

        try {
            const token = getAuthToken();
            // Petición real a la API para obtener datos frescos
            const response = await fetch('http://localhost:3001/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('userData', JSON.stringify(data.user)); // Actualizar caché local
                displayUserProfile(data.user);
            }
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            window.showAppNotification('No se pudo cargar los datos del usuario.', 'error');
        }
    };

    /**
     * Muestra los datos del perfil en los campos correspondientes
     * @param {Object} user - Objeto con los datos del usuario
     */
    const displayUserProfile = (user) => {
        // Campos de entrada (modo edición)
        if (profileNombreInput) {
            profileNombreInput.value = user.nombre || '';
        }
        if (profileApellidosInput) {
            // Si no viene apellidos, intenta extraerlo del nombre completo
            let apellidos = user.apellidos || '';
            if (!apellidos && user.nombre) {
                const partes = user.nombre.trim().split(' ');
                if (partes.length > 1) {
                    apellidos = partes.slice(1).join(' ');
                }
            }
            profileApellidosInput.value = apellidos;
        }
        if (profileEmailInput) profileEmailInput.value = user.email || '';
        if (profileRolInput) profileRolInput.value = user.rol || '';

        // Mostrar nombre completo en el encabezado usando los datos del objeto user
        const nombreFull = `${user.nombre || ''} ${user.apellidos || ''}`.trim();
        if (profileHeaderName) profileHeaderName.textContent = nombreFull || 'Mi Perfil';

        // Mostrar la foto de perfil si existe en los datos del usuario
        const profilePicturePreview = document.getElementById('profile-picture-preview');
        if (profilePicturePreview) {
            profilePicturePreview.src = getProfileImageUrl(user.foto_perfil);
        }

        const headerPicture = document.getElementById('header-profile-picture');
        if (headerPicture) {
            headerPicture.src = getProfileImageUrl(user.foto_perfil);
        }
    };

    // Función para guardar los cambios del perfil
    const saveProfile = async (e) => {
        if (e) e.preventDefault();

        if (!profileNombreInput?.value.trim()) {
            window.showAppNotification('El nombre es requerido.', 'error');
            return;
        }

        window.setButtonLoadingState('save-profile-btn', true, 'Guardando...');

        try {
            const userData = getUserData();
            const userId = userData?.id_usuario || userData?.id;
            if (!userId) throw new Error('No se encontró el ID del usuario');

            // Cambiamos a FormData para poder enviar el archivo de imagen
            const formData = new FormData();
            formData.append('nombre', profileNombreInput?.value.trim());
            formData.append('apellidos', profileApellidosInput?.value.trim());
            formData.append('email', profileEmailInput?.value.trim());

            // Capturamos el archivo del input si el usuario seleccionó uno
            const profilePictureInput = document.getElementById('profile-picture-input');
            if (profilePictureInput && profilePictureInput.files[0]) {
                formData.append('foto_perfil', profilePictureInput.files[0]);
            }

            const token = getAuthToken();
            const response = await fetch(`http://localhost:3001/api/usuarios/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Error al actualizar en el servidor');

            const result = await response.json();
            
            // Actualizar caché local con la respuesta del servidor (que ya trae la nueva URL de la foto)
            const updatedUser = result.user || result;
            const newUserData = { ...userData, ...updatedUser };
            localStorage.setItem('userData', JSON.stringify(newUserData));

            // Actualizar información visual en el sidebar inmediatamente
            const sidebarNameEl = document.querySelector('.user-info h3');
            if (sidebarNameEl) {
                sidebarNameEl.textContent = `${newUserData.nombre} ${newUserData.apellidos || ''}`.trim();
            }

            // Actualizar también la imagen en el header global
            const headerPicture = document.getElementById('header-profile-picture');
            if (headerPicture) {
                headerPicture.src = getProfileImageUrl(newUserData.foto_perfil);
            }

            window.showAppNotification('Perfil actualizado correctamente.', 'success');
            // En lugar de recargar de la API, usamos los datos que ya recibimos
            displayUserProfile(newUserData);
        } catch (error) {
            console.error('Error al guardar perfil:', error);
            window.showAppNotification('Error al guardar el perfil.', 'error');
        } finally {
            window.setButtonLoadingState('save-profile-btn', false, 'Guardar cambios');
        }
    };

    // agregar foto perfil
     const profilePictureInput = document.getElementById('profile-picture-input');
     const profilePicturePreview = document.getElementById('profile-picture-preview');
        if (profilePictureInput && profilePicturePreview) {
            // ACCIÓN: Al hacer clic en la foto o en el botón, abrir el selector de archivos
            profilePicturePreview.addEventListener('click', () => profilePictureInput.click());
            
            const changePhotoBtn = document.getElementById('change-photo-btn');
            if (changePhotoBtn) {
                changePhotoBtn.addEventListener('click', () => profilePictureInput.click());
            }

            profilePictureInput.addEventListener('change', function () {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        profilePicturePreview.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }


    // Botón para guardar cambios del perfil
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }

    // Cargar perfil al abrir la página
    loadUserProfile();
});
