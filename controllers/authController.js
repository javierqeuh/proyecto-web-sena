import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/db.js';

/**
 * Procesa el registro de nuevos usuarios.
 * Utiliza transacciones de SQL para asegurar que si falla la creación del trabajador, no se cree el usuario.
 */
export const register = async (req, res) => {
  const { nombre, apellidos, cedula, fecha_nacimiento, email, password, rol } = req.body;

  if (!nombre || !apellidos || !cedula || !fecha_nacimiento || !email || !password || !rol) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Validación de unicidad de correo
    const [existing] = await connection.execute('SELECT id_usuario FROM usuario WHERE email = ?', [email]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'Este correo ya está registrado.' });
    }

    // Encriptación de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      `INSERT INTO usuario (nombre, apellidos, cedula, fecha_nacimiento, email, password_hash, rol, activo, fecha_registro) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURDATE())`,
      [nombre, apellidos, cedula, fecha_nacimiento, email, hashedPassword, rol]
    );

    // Si el rol es trabajador, creamos su ficha laboral vinculada
    if (rol === 'trabajador') {
      const id_usuario = result.insertId;
      await connection.execute(
        `INSERT INTO trabajador (numero_cedula, nombre, apellido, area, fecha_ingreso, id_usuario) 
         VALUES (?, ?, ?, ?, CURDATE(), ?)`,
        [cedula, nombre, apellidos, 'Sin asignar', id_usuario]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Usuario registrado con éxito.' });
  } catch (error) {
    console.error('Error en registro:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Autentica al usuario, verifica el rol y genera un token JWT válido por 24 horas.
 */
export const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, contraseña y rol son obligatorios.' });
  }

  try {
    const [users] = await db.execute(
      'SELECT id_usuario, nombre, apellidos, email, password_hash, rol, foto_perfil FROM usuario WHERE email = ?',
      [email]
    );

    if (users.length === 0) return res.status(401).json({ message: 'Email o contraseña incorrectos.' });

    const user = users[0];
    // Verificación de rol para evitar que un trabajador entre como administrador
    if (user.rol !== role) return res.status(401).json({ message: 'El rol no coincide con el usuario.' });

    // Comparación segura del hash de la contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ message: 'Email o contraseña incorrectos.' });

    // Generación del token de sesión
    // En producción, es obligatorio que JWT_SECRET esté definido en el .env
    const token = jwt.sign({ id_usuario: user.id_usuario, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({ 
      message: 'Autenticación exitosa.',
      user: { id_usuario: user.id_usuario, nombre: user.nombre, apellidos: user.apellidos, email: user.email, rol: user.rol, foto_perfil: user.foto_perfil },
      token: token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

/**
 * Obtiene la información del usuario autenticado actualmente.
 * Utiliza el ID extraído del token JWT por el middleware de autenticación.
 * Útil para mantener la sesión persistente en el frontend tras recargar la página.
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    const [rows] = await db.execute(
      'SELECT id_usuario, nombre, apellidos, email, rol, activo, foto_perfil FROM usuario WHERE id_usuario = ?',
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    // Mensaje genérico para no exponer detalles de la BD
    res.status(500).json({ message: 'Error al procesar la solicitud de perfil.' });
  }
};

/**
 * Inicia el proceso de recuperación de contraseña.
 * 1. Verifica si el email existe.
 * 2. Genera un token de seguridad temporal de un solo uso.
 * 3. Simula el envío de un correo electrónico con el enlace de restablecimiento.
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Buscar el usuario en la base de datos por su correo electrónico
    const [users] = await db.execute('SELECT id_usuario, email FROM usuario WHERE email = ?', [email]);
    
    // Práctica de seguridad: Si el usuario no existe, no lo decimos explícitamente 
    // para evitar "user enumeration" (que atacantes sepan qué correos están registrados).
    if (users.length === 0) {
      return res.status(200).json({ 
        message: "Si el correo existe, se ha enviado un enlace de recuperación." 
      });
    }

    const user = users[0];

    // Generación de un token criptográfico seguro (hexadecimal de 20 bytes)
    const token = crypto.randomBytes(20).toString('hex');
    // Definición de expiración: El token será válido solo por 1 hora
    const expireDate = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' '); 

    // Guardar token en la DB
    await db.execute('UPDATE usuario SET reset_token = ?, reset_expires = ? WHERE id_usuario = ?', [token, expireDate, user.id_usuario]);

    // 4. Construir el enlace de reseteo
    const resetUrl = `http://localhost:3001/reset-password?token=${token}`;

    // 5. Enviar el correo (Requiere configurar nodemailer)
    // Por ahora solo mostramos en consola para depuración
    console.log(`[SIMULACIÓN] Enviar correo a ${email} con token: ${token}`);
    console.log(`[SIMULACIÓN] Link: ${resetUrl}`);

    res.status(200).json({ message: "Correo de recuperación enviado." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor." });
  }
};

/**
 * Finaliza el proceso de recuperación de contraseña.
 * 1. Valida el token recibido desde el frontend.
 * 2. Verifica que el token no haya expirado.
 * 3. Actualiza la contraseña en la base de datos (hasheándola previamente).
 */
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Validar token y expiración
    const [users] = await db.execute('SELECT id_usuario FROM usuario WHERE reset_token = ? AND reset_expires > NOW()', [token]);

    if (users.length === 0) {
      return res.status(400).json({ message: "Token inválido o ha expirado." });
    }
    const user = users[0];

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE usuario SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id_usuario = ?', [hashedPassword, user.id_usuario]);

    res.status(200).json({ message: "Contraseña actualizada con éxito." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la contraseña." });
  }
};
