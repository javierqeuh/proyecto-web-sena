import db from '../config/db.js';
import bcrypt from 'bcrypt';

/**
 * Obtiene todos los usuarios de la base de datos.
 * Selecciona solo campos necesarios para no exponer el hash de la contraseña.
 */
export const getAllUsers = async (req, res) => {
  try {
    const [usuarios] = await db.execute('SELECT id_usuario, nombre, apellidos, email, rol, activo, cedula, fecha_nacimiento FROM usuario');
    res.json({ data: usuarios });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo usuarios.' });
  }
};

/**
 * Obtiene el listado de trabajadores realizando un JOIN con la tabla de usuarios.
 * Esto permite tener el email y estado de cuenta junto a los datos laborales.
 */
export const getAllWorkers = async (req, res) => {
  try {
    const [trabajadores] = await db.execute(`
      SELECT t.id_trabajador, t.nombre, t.apellido, t.area as departamento, u.email, u.activo, u.id_usuario, u.rol, u.cedula, u.fecha_nacimiento
      FROM trabajador t
      JOIN usuario u ON t.id_usuario = u.id_usuario`);
    res.json({ data: trabajadores });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener trabajadores.' });
  }
};

/**
 * Obtiene la información detallada de un usuario específico por su ID.
 */
export const getUserById = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id_usuario, nombre, apellidos, cedula, fecha_nacimiento, email, rol, activo, foto_perfil FROM usuario WHERE id_usuario = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ data: users[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo perfil.' });
  }
};

/**
 * Actualiza la ruta de la foto de perfil en la base de datos.
 * El archivo físico ya fue procesado por Multer previamente.
 */
export const uploadProfilePicture = async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
  try {
    const filePath = `/uploads/${req.file.filename}`;
    await db.execute('UPDATE usuario SET foto_perfil = ? WHERE id_usuario = ?', [filePath, id]);
    res.json({ message: 'Foto de perfil actualizada correctamente.', path: filePath });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la foto de perfil.' });
  }
};

/**
 * Actualiza los datos de un usuario.
 * Implementa lógica dinámica: solo actualiza los campos que se envían en el cuerpo de la petición.
 * Maneja el hasheo de la contraseña si se decide cambiarla.
 */
export const updateUser = async (req, res) => {
  const { nombre, apellidos, email, rol, password, cedula, fecha_nacimiento } = req.body;
  const foto_perfil = req.file ? `/uploads/${req.file.filename}` : null; 

  try {
    // Construcción de la consulta dinámica
    let query = 'UPDATE usuario SET nombre = COALESCE(?, nombre), apellidos = COALESCE(?, apellidos), email = COALESCE(?, email)';
    const params = [nombre || null, apellidos || null, email || null];
    
    if (foto_perfil) {
      query += ', foto_perfil = ?';
      params.push(foto_perfil);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(hashedPassword);
    }
    if (cedula) { query += ', cedula = ?'; params.push(cedula); }
    if (fecha_nacimiento) { query += ', fecha_nacimiento = ?'; params.push(fecha_nacimiento); }
    if (rol) { query += ', rol = ?'; params.push(rol); }

    query += ' WHERE id_usuario = ?';
    params.push(req.params.id);

    await db.execute(query, params);

    // Retornamos el usuario actualizado para sincronizar el estado en el frontend
    const [updatedUser] = await db.execute('SELECT id_usuario, nombre, apellidos, email, rol, foto_perfil, cedula, fecha_nacimiento FROM usuario WHERE id_usuario = ?', [req.params.id]);
    
    res.json({ 
      message: 'Usuario actualizado correctamente.',
      user: updatedUser[0] 
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error actualizando usuario.' });
  }
};

/**
 * Crea un nuevo usuario.
 * Si el rol seleccionado es 'trabajador', inserta automáticamente en la tabla correspondiente.
 */
export const createUser = async (req, res) => {
  const { nombre, apellidos, email, password, rol, cedula, fecha_nacimiento } = req.body;
  let connection;
  try {
    if (!password) {
      return res.status(400).json({ message: 'La contraseña es obligatoria.' });
    }
    
    connection = await db.getConnection();
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await connection.execute(
      'INSERT INTO usuario (nombre, apellidos, email, password_hash, rol, activo, fecha_registro, cedula, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, 1, CURDATE(), ?, ?)', 
      [nombre, apellidos, email, hashedPassword, rol, cedula, fecha_nacimiento]);
    
    // Lógica de integridad para roles de trabajador
    if (rol === 'trabajador') {
      const id_usuario = result.insertId;
      await connection.execute(
        'INSERT INTO trabajador (numero_cedula, nombre, apellido, area, fecha_ingreso, id_usuario) VALUES (?, ?, ?, ?, CURDATE(), ?)',
        [cedula, nombre, apellidos, 'Sin asignar', id_usuario]
      );
    }
    
    await connection.commit();
    res.status(201).json({ message: 'Usuario creado exitosamente.' });
  } catch (error) {
    console.error('Error en createUser:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Error creando usuario.' });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Elimina un usuario del sistema.
 * Se encarga de borrar primero la referencia en la tabla trabajador para mantener la integridad referencial.
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Borrado manual de dependencias antes del usuario
    await db.execute('DELETE FROM trabajador WHERE id_usuario = ?', [id]);
    const [result] = await db.execute('DELETE FROM usuario WHERE id_usuario = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el usuario.' });
  }
};

/**
 * Elimina solo el perfil de trabajador sin borrar la cuenta de usuario.
 */
export const deleteWorker = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM trabajador WHERE id_trabajador = ?', [id]);
    res.json({ message: 'Trabajador eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar trabajador.' });
  }
};