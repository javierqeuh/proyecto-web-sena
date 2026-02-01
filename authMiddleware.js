import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar el token JWT.
 * Se ejecuta antes de las rutas protegidas.
 */
const authMiddleware = (req, res, next) => {
    // 1. Obtener el token de la cabecera 'Authorization'
    const authHeader = req.headers['authorization'];
    
    // El formato esperado es "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Si no hay token, denegar el acceso
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
    }

    try {
        // 3. Verificar si el token es válido usando el secreto
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedPayload; // Añadimos los datos del usuario (ej: { userId, rol }) a la petición
        next(); // El token es válido, continuamos a la siguiente función (la ruta solicitada)
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

export default authMiddleware;