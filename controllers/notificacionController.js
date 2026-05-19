import db from '../config/db.js';

// para traer las notificaciones del usuario, marcarlas como leídas o eliminarlas

export const getNotifications = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const [rows] = await db.execute('SELECT * FROM notificacion WHERE id_usuario = ? ORDER BY fecha_creacion DESC', [req.user.id_usuario]);
    const notifications = rows.map(n => ({ ...n, leida: n.fecha_lectura !== null }));
    res.json({ data: notifications });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones.' });
  }
};
// para marcar una notificación específica como leída, asegurando que solo el propietario pueda actualizarla
export const markAsRead = async (req, res) => {
  try {
    await db.execute('UPDATE notificacion SET fecha_lectura = NOW() WHERE id_notificacion = ? AND id_usuario = ?', [req.params.id, req.user.id_usuario]);
    res.json({ message: 'Notificación marcada como leída.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar notificación.' });
  }
};
// para eliminar una notificación específica, asegurando que solo el propietario pueda eliminarla
export const deleteNotification = async (req, res) => {
  try {
    await db.execute('DELETE FROM notificacion WHERE id_notificacion = ? AND id_usuario = ?', [req.params.id, req.user.id_usuario]);
    res.json({ message: 'Notificación eliminada.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar notificación.' });
  }
};
// para eliminar todas las notificaciones, útil para limpiar el historial o si el usuario quiere empezar de nuevo
export const markAllAsRead = async (req, res) => {
  try {
    await db.execute('UPDATE notificacion SET fecha_lectura = NOW() WHERE id_usuario = ? AND fecha_lectura IS NULL', [req.user.id_usuario]);
    res.json({ message: 'Todas las notificaciones marcadas como leídas.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar notificaciones.' });
  }
};
// para contar cuántas notificaciones no leídas tiene el usuario, útil para mostrar un badge en el frontend
export const countUnread = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM notificacion WHERE id_usuario = ? AND fecha_lectura IS NULL', [req.user.id_usuario]);
    res.json({ data: { count: rows[0].count } });
  } catch (error) {
    res.status(500).json({ message: 'Error contando notificaciones.' });
  }
};