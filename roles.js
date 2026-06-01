/**
 * Configuración de Roles y Middleware de Autorización (RBAC).
 * Este archivo centraliza la lógica de quién puede realizar qué acciones en el sistema.
 */

// 1. Definición de Roles del Sistema (Evita el uso de strings sueltos en el código)
export const ROLES = {
    ADMIN: 'administrador',
    CREADOR: 'usuario',    // Usuario con permisos de gestión (Creador de encuestas)
    TRABAJADOR: 'trabajador'
};

// 2. Mapeo de Permisos por Funcionalidad
// Esto facilita cambiar quién hace qué en un solo lugar
export const PERMISOS = {
    GESTION_USUARIOS: [ROLES.ADMIN],
    CREAR_ENCUESTAS: [ROLES.ADMIN, ROLES.CREADOR],
    ASIGNAR_ENCUESTAS: [ROLES.ADMIN, ROLES.CREADOR],
    VER_REPORTES: [ROLES.ADMIN, ROLES.CREADOR],
    RESPONDER_ENCUESTAS: [ROLES.TRABAJADOR],
    VER_NOTIFICACIONES: [ROLES.ADMIN, ROLES.CREADOR, ROLES.TRABAJADOR],
    ver_perfil: [ROLES.ADMIN, ROLES.CREADOR, ROLES.TRABAJADOR],
    ver_dashboard: [ROLES.ADMIN, ROLES.CREADOR, ROLES.TRABAJADOR],
    ver_asignar_usuarios: [ROLES.ADMIN, ROLES.CREADOR],
    "ver-historiar-envio": [ROLES.ADMIN, ROLES.CREADOR],
    ver_revicion_respuestas: [ROLES.ADMIN, ROLES.CREADOR],
    VER_RETROALIMENTACION: [ROLES.TRABAJADOR] // Nuevo permiso para el trabajador
};

/**
 * Middleware de Autorización.
 * Verifica si el usuario autenticado tiene el rol necesario para continuar.
 * @param {Array} rolesPermitidos - Array de roles que pueden acceder a la ruta.
 */
export const authorize = (rolesPermitidos = []) => {
    return (req, res, next) => {
        // Se asume que authMiddleware ya procesó el JWT e inyectó los datos en req.user
        if (!req.user || !req.user.rol) {
            return res.status(401).json({ message: 'No autorizado. Información de rol no encontrada.' });
        }

        if (rolesPermitidos.includes(req.user.rol)) {
            return next();
        }

        return res.status(403).json({ 
            message: `Acceso denegado. Tu rol (${req.user.rol}) no tiene permisos para esta acción.` 
        });
    };
};