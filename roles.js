/**
 * Configuración de Roles y Middleware de Autorización (RBAC).
 * Este archivo centraliza la lógica de quién puede realizar qué acciones en el sistema.
 */

// 1. Definición de Roles del Sistema (Evita el uso de strings sueltos en el código)
export const ROLES = {
    ADMIN: 'administrador',
    USUARIO: 'usuario',    // Actúa como administrador/creador en la lógica de negocio actual,
    TRABAJADOR: 'trabajador'
};

// 2. Mapeo de Permisos por Funcionalidad
// Esto facilita cambiar quién hace qué en un solo lugar
export const PERMISOS = {
    GESTION_USUARIOS: [ROLES.ADMIN, ROLES.USUARIO],
    CREAR_ENCUESTAS: [ROLES.ADMIN, ROLES.USUARIO],
    ASIGNAR_ENCUESTAS: [ROLES.ADMIN, ROLES.USUARIO],
    VER_REPORTES: [ROLES.ADMIN, ROLES.USUARIO],
    RESPONDER_ENCUESTAS: [ROLES.TRABAJADOR],
    VER_NOTIFICACIONES: [ROLES.ADMIN, ROLES.USUARIO, ROLES.TRABAJADOR],
    ver_perfil: [ROLES.ADMIN, ROLES.USUARIO, ROLES.TRABAJADOR],
    ver_dashboard: [ROLES.ADMIN, ROLES.USUARIO, ROLES.TRABAJADOR],
    ver_asignar_usuarios: [ROLES.ADMIN, ROLES.USUARIO],
    "ver-historiar-envio": [ROLES.ADMIN, ROLES.USUARIO],
    ver_revicion_respuestas: [ROLES.ADMIN, ROLES.USUARIO]
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