import db from '../config/db.js';
import bcrypt from 'bcrypt';
// otener usuarios
export const getAllUsers = async (req, res) => {
  try {
    const [usuarios] = await db.execute('SELECT id_usuario, nombre, apellidos, email, rol, activo, cedula, fecha_nacimiento FROM usuario');
    res.json({ data: usuarios });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo usuarios.' });
  }
};
// obtener trabajadores
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
// informacion para perfil
export const getUserById = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id_usuario, nombre, apellidos, cedula, fecha_nacimiento, email, rol, activo FROM usuario WHERE id_usuario = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ data: users[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo perfil.' });
  }
};

// cargar foto perfil
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

// atualizar usuario
export const updateUser = async (req, res) => {
  const { nombre, apellidos, email, rol, password, cedula, fecha_nacimiento } = req.body;
  try {
    let query = 'UPDATE usuario SET nombre = ?, apellidos = ?, email = ?, cedula = ?, fecha_nacimiento = ?';
    const params = [nombre, apellidos, email, cedula, fecha_nacimiento];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(hashedPassword);
    }

    if (rol) { query += ', rol = ?'; params.push(rol); }
    query += ' WHERE id_usuario = ?';
    params.push(req.params.id);
    await db.execute(query, params);
    res.json({ message: 'Usuario actualizado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando usuario.' });
  }
};
// crear usuario desde gestin de usuario
export const createUser = async (req, res) => {
  const { nombre, apellidos, email, password, rol, cedula, fecha_nacimiento } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ message: 'La contraseña es obligatoria.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO usuario (nombre, apellidos, email, password_hash, rol, activo, fecha_registro, cedula, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, 1, CURDATE(), ?, ?)', 
      [nombre, apellidos, email, hashedPassword, rol, cedula, fecha_nacimiento]);
    
    if (rol === 'trabajador') {
      const id_usuario = result.insertId;
      await db.execute(
        'INSERT INTO trabajador (numero_cedula, nombre, apellido, area, fecha_ingreso, id_usuario) VALUES (?, ?, ?, ?, CURDATE(), ?)',
        [cedula, nombre, apellidos, 'Sin asignar', id_usuario]
      );
    }
    
    res.status(201).json({ message: 'Usuario creado exitosamente.' });
  } catch (error) {
    console.error('Error en createUser:', error);
    res.status(500).json({ message: 'Error creando usuario.' });
  }
};
// eliminar usuario 
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM trabajador WHERE id_usuario = ?', [id]);
    const [result] = await db.execute('DELETE FROM usuario WHERE id_usuario = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el usuario.' });
  }
};
// eliminar trabajador
export const deleteWorker = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM trabajador WHERE id_trabajador = ?', [id]);
    res.json({ message: 'Trabajador eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar trabajador.' });
  }
};