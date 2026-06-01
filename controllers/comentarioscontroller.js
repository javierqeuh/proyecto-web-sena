import db from '../config/db.js';

/**
 * Obtiene el feedback (comentarios) dejado por administradores para el trabajador logueado.
 */
export const getWorkerFeedback = async (req, res) => {
  const userId = req.user.id_usuario;
  try {
    const [rows] = await db.execute(`
      SELECT ca.texto, ca.fecha, e.titulo as encuesta
      FROM comentario_asignacion ca
      JOIN encuesta_asignada ea ON ca.id_asignacion = ea.id_asignacion
      JOIN trabajador t ON ea.id_trabajador = t.id_trabajador
      JOIN encuesta e ON ea.id_encuesta = e.id_encuesta
      WHERE t.id_usuario = ?
      ORDER BY ca.fecha DESC
    `, [userId]);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener comentarios de asignación.' });
  }
};