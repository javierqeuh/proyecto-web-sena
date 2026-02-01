// server.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv'; // Import dotenv
import db from './db.js'; // Import the database pool from db.js
import authMiddleware from './authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

dotenv.config(); // Cargar variables de entorno

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos de forma segura
// Sirve los archivos HTML desde la carpeta 'html_interfaz' como si estuvieran en la raíz
app.use(express.static(path.join(__dirname, 'html_interfaz'))); 
// Sirve los archivos CSS que están en la raíz del proyecto
app.use(express.static(path.join(__dirname)));
// Sirve los scripts del lado del cliente desde 'logica_interfaz' bajo la ruta /logica_interfaz
app.use('/logica_interfaz', express.static(path.join(__dirname, 'logica_interfaz')));
// Sirve los mismos scripts bajo la ruta /js para compatibilidad con los HTML
app.use('/js', express.static(path.join(__dirname, 'logica_interfaz')));
// Sirve las imágenes desde la carpeta 'img' bajo la ruta /img
app.use('/img', express.static(path.join(__dirname, 'img')));

// Ruta API: Registro de usuario
app.post('/api/registro', async (req, res) => {
  const { nombre, apellidos, cedula, fecha_nacimiento, email, password, rol } = req.body;

  // Validación básica
  if (!nombre || !apellidos || !cedula || !fecha_nacimiento || !email || !password || !rol) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  let connection;
  try {
    // 1. Obtener una conexión del pool para manejar la transacción
    connection = await db.getConnection();
    // 2. Iniciar la transacción
    await connection.beginTransaction();

    // Verificar si el email ya existe
    const [existing] = await connection.execute(
      'SELECT id_usuario FROM usuario WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      await connection.rollback(); // Revertir antes de salir
      return res.status(409).json({ message: 'Este correo ya está registrado.' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Ejecutar las inserciones DENTRO de la transacción
    const [result] = await connection.execute(
      `INSERT INTO usuario 
       (nombre, apellidos, cedula, fecha_nacimiento, email, password_hash, rol, activo, fecha_registro) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURDATE())`,
      [nombre, apellidos, cedula, fecha_nacimiento, email, hashedPassword, rol]
    );

    // Si es trabajador, insertar también en `trabajador`
    if (rol === 'trabajador') {
      const id_usuario = result.insertId;
      await connection.execute(
        `INSERT INTO trabajador 
         (numero_cedula, nombre, apellido, area, fecha_ingreso, id_usuario) 
         VALUES (?, ?, ?, ?, CURDATE(), ?)`,
        [cedula, nombre, apellidos, 'Sin asignar', id_usuario]
      );
    }

    // 4. Si todo fue exitoso, confirmar la transacción para guardar los datos
    await connection.commit();

    res.status(201).json({ message: 'Usuario registrado con éxito.' });
    
    // si falla el regsiro, msotrara error  en registro
  } catch (error) {
    console.error('Error en registro:', error);
    // 5. Si algo falla, revertir TODOS los cambios de la transacción
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    // 6. Siempre liberar la conexión de vuelta al pool
    if (connection) connection.release();
  }
});

// Ruta API: Login de usuario
app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  // Validación básica
  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, contraseña y rol son obligatorios.' });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // Buscar usuario por email
    const [users] = await connection.execute(
      'SELECT id_usuario, nombre, apellidos, email, password_hash, rol FROM usuario WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
    }

    const user = users[0];

    // Verificar que el rol sea correcto
    if (user.rol !== role) {
      return res.status(401).json({ message: 'El rol no coincide con el usuario.' });
    }

    // Comparar contraseñas
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
    }

    // Generar JWT (opcional, pero recomendado)
    const token = jwt.sign({ id_usuario: user.id_usuario, rol: user.rol }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '24h' });

    res.status(200).json({ 
      message: 'Autenticación exitosa.',
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        rol: user.rol
      },
      token: token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    if (connection) connection.release();
  }
});

// Ruta API: Obtener información del usuario actual (para el header)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    const [rows] = await db.execute(
      'SELECT nombre, apellidos, rol, activo FROM usuario WHERE id_usuario = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const user = rows[0];
    res.json({ user });
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

// Ruta API: Crear Encuesta
app.post('/surveys', authMiddleware, async (req, res) => {
  const { title, description, deadline, is_mandatory, questions } = req.body;
  const userId = req.user.id_usuario; // Obtenido del token

  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ message: 'Título y preguntas son obligatorios.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Insertar Encuesta
    const [surveyResult] = await connection.execute(
      `INSERT INTO encuesta (titulo, descripcion, fecha_limite, id_usuario_creador, fecha_creacion) 
       VALUES (?, ?, ?, ?, NOW())`,
      [title, description, deadline || null, userId]
    );
    const surveyId = surveyResult.insertId;

    // 2. Insertar Preguntas
    for (const q of questions) {
      const [questionResult] = await connection.execute(
        `INSERT INTO pregunta (id_encuesta, text_pregunta, tipo, obligatoria, orden) 
         VALUES (?, ?, ?, ?, ?)`,
        [surveyId, q.text, q.type, q.is_mandatory ? 1 : 0, q.order]
      );
      const questionId = questionResult.insertId;

      // 3. Insertar Opciones (si aplica)
      if (q.type === 'opcion_multiple' && q.options && q.options.length > 0) {
        for (const opt of q.options) {
          await connection.execute(
            `INSERT INTO opcion (id_pregunta, texto, orden) 
             VALUES (?, ?, ?)`,
            [questionId, opt.text, opt.order]
          );
        }
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Encuesta creada exitosamente.', id_encuesta: surveyId });
  } catch (error) {
    console.error('Error creando encuesta:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Error al guardar la encuesta.', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// api eliminacion de encuesta 
app.delete('/surveys/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Ejecutamos una sola consulta. 
    // Si tu DB está bien configurada, esto borrará todo lo relacionado.
    const [result] = await db.execute('DELETE FROM encuesta WHERE id_encuesta = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Encuesta no encontrada.' });
    }

    res.json({ message: 'Encuesta eliminada con éxito', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la encuesta' });
  }
});

// Ruta API: Obtener lista de encuestas (Para Responder y Reportes)
app.get('/surveys', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM encuesta ORDER BY fecha_creacion DESC');
    res.json({ data: rows });
  } catch (error) {
    console.error('Error obteniendo encuestas:', error);
    res.status(500).json({ message: 'Error al obtener encuestas.' });
  }
});

// Ruta API: Obtener detalles de una encuesta (Para Responder)
app.get('/surveys/:id', authMiddleware, async (req, res) => {
  const surveyId = req.params.id;
  try {
    // 1. Obtener datos básicos
    const [surveyRows] = await db.execute('SELECT * FROM encuesta WHERE id_encuesta = ?', [surveyId]);
    if (surveyRows.length === 0) return res.status(404).json({ message: 'Encuesta no encontrada.' });
    
    const survey = surveyRows[0];

    // 2. Obtener preguntas
    const [questions] = await db.execute(
      'SELECT * FROM pregunta WHERE id_encuesta = ? ORDER BY orden ASC', 
      [surveyId]
    );

    // 3. Obtener opciones para preguntas de opción múltiple
    for (const q of questions) {
      if (q.tipo === 'opcion_multiple') {
        const [options] = await db.execute(
          'SELECT * FROM opcion WHERE id_pregunta = ? ORDER BY orden ASC', 
          [q.id_pregunta]
        );
        q.options = options.map(o => ({ id_opcion: o.id_opcion, text: o.texto }));
      }
      // Mapear campos para que coincidan con el frontend
      q.text = q.text_pregunta;
      q.type = q.tipo;
      q.is_mandatory = q.obligatoria ? 1 : 0;
    }

    survey.questions = questions;
    // Mapear campos
    survey.title = survey.titulo;
    survey.description = survey.descripcion;

    res.json({ data: survey });
  } catch (error) {
    console.error('Error obteniendo detalles:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

// Ruta API: Obtener resultados de una encuesta (Para Reportes)
app.get('/surveys/:id/responses', authMiddleware, async (req, res) => {
  const surveyId = req.params.id;
  try {
    // 1. Obtener datos de la encuesta
    const [surveyRows] = await db.execute('SELECT id_encuesta FROM encuesta WHERE id_encuesta = ?', [surveyId]);
    if (surveyRows.length === 0) return res.status(404).json({ message: 'Encuesta no encontrada.' });

    // 3. Obtener todas las respuestas
    const [answers] = await db.execute(`
      SELECT 
        r.id_asignacion,
        r.id_pregunta,
        r.valor_texto,
        r.valor_escala,
        o.texto as texto_opcion
      FROM respuesta r
      JOIN encuesta_asignada ea ON r.id_asignacion = ea.id_asignacion
      LEFT JOIN opcion o ON r.id_opcion_seleccionada = o.id_opcion
      WHERE ea.id_encuesta = ? AND ea.estado = 'completada'
    `, [surveyId]);

    const responsesMap = {};
    answers.forEach(a => {
        if (!responsesMap[a.id_asignacion]) {
            responsesMap[a.id_asignacion] = { id_asignacion: a.id_asignacion, respuestas: [] };
        }
        
        let respuestaVal = '';
        if (a.texto_opcion) respuestaVal = a.texto_opcion;
        else if (a.valor_escala) respuestaVal = a.valor_escala.toString();
        else respuestaVal = a.valor_texto;

        responsesMap[a.id_asignacion].respuestas.push({
            id_pregunta: a.id_pregunta,
            respuesta: respuestaVal
        });
    });

    const responsesData = Object.values(responsesMap);

    res.json({ data: responsesData });

  } catch (error) {
    console.error('Error obteniendo resultados:', error);
    res.status(500).json({ message: 'Error al obtener resultados.' });
  }
});

// Ruta API: Obtener respuestas detalladas de una encuesta (Para Revisión de Respuestas)
app.get('/surveys/:id/respuestas-detalladas', authMiddleware, async (req, res) => {
  const surveyId = req.params.id;

  try {
    // 1. Obtener las asignaciones completadas (envíos)
    const [submissions] = await db.execute(`
      SELECT 
        ea.id_asignacion, 
        u.nombre as nombre_usuario, 
        u.email as email_usuario, 
        ea.fecha_completada as fecha_respuesta
      FROM encuesta_asignada ea
      JOIN trabajador t ON ea.id_trabajador = t.id_trabajador
      JOIN usuario u ON t.id_usuario = u.id_usuario
      WHERE ea.id_encuesta = ? AND ea.estado = 'completada'
    `, [surveyId]);

    if (submissions.length === 0) {
      return res.json({ data: [] });
    }

    // Obtener IDs de asignaciones para buscar respuestas y comentarios
    const assignmentIds = submissions.map(s => s.id_asignacion);
    const placeholders = assignmentIds.map(() => '?').join(',');
    
    // 2. Obtener las respuestas detalladas
    const [answers] = await db.execute(`
      SELECT 
        r.id_asignacion,
        p.text_pregunta as texto_pregunta,
        p.tipo as tipo_pregunta,
        r.valor_texto,
        r.valor_escala,
        o.texto as texto_opcion
      FROM respuesta r
      JOIN pregunta p ON r.id_pregunta = p.id_pregunta
      LEFT JOIN opcion o ON r.id_opcion_seleccionada = o.id_opcion
      WHERE r.id_asignacion IN (${placeholders})
      ORDER BY p.orden ASC
    `, assignmentIds);

    // 3. Obtener comentarios asociados a estas asignaciones
    const [comments] = await db.execute(`
      SELECT c.id_asignacion, c.texto, c.fecha, u.nombre as autor
      FROM comentario_asignacion c
      JOIN usuario u ON c.id_autor = u.id_usuario
      WHERE c.id_asignacion IN (${placeholders})
      ORDER BY c.fecha ASC
    `, assignmentIds);

    // 4. Agrupar todo por asignación
    const submissionsMap = {};
    submissions.forEach(sub => {
      submissionsMap[sub.id_asignacion] = {
        id_respuesta: sub.id_asignacion, // Mapeamos id_asignacion a id_respuesta para el frontend
        nombre_usuario: sub.nombre_usuario,
        email_usuario: sub.email_usuario,
        fecha_respuesta: sub.fecha_respuesta,
        respuestas_pregunta: [],
        comentarios: []
      };
    });

    answers.forEach(ans => {
      const sub = submissionsMap[ans.id_asignacion];
      if (sub) {
        let respuestaFormatted = '';
        if (ans.tipo_pregunta === 'opcion_multiple') {
          respuestaFormatted = ans.texto_opcion;
        } else if (ans.tipo_pregunta === 'escala_1_5') {
          respuestaFormatted = ans.valor_escala ? ans.valor_escala.toString() : '';
        } else {
          respuestaFormatted = ans.valor_texto;
        }

        sub.respuestas_pregunta.push({
          texto_pregunta: ans.texto_pregunta,
          tipo_pregunta: ans.tipo_pregunta,
          respuesta: respuestaFormatted
        });
      }
    });

    comments.forEach(c => {
      const sub = submissionsMap[c.id_asignacion];
      if (sub) {
        sub.comentarios.push({
          texto: c.texto,
          fecha: c.fecha,
          autor: c.autor
        });
      }
    });

    const resultData = Object.values(submissionsMap);
    res.json({ data: resultData });

  } catch (error) {
    console.error('Error obteniendo respuestas detalladas:', error);
    res.status(500).json({ message: 'Error al obtener respuestas detalladas.' });
  }
});

// Ruta API: Agregar comentario a una respuesta
app.put('/respuestas/:id/comentario', authMiddleware, async (req, res) => {
  const idAsignacion = req.params.id;
  const idAutor = req.user.id_usuario;
  const { texto } = req.body;

  if (!texto) {
    return res.status(400).json({ message: 'El texto del comentario es obligatorio.' });
  }

  try {
    await db.execute(
      'INSERT INTO comentario_asignacion (id_asignacion, id_autor, texto, fecha) VALUES (?, ?, ?, NOW())',
      [idAsignacion, idAutor, texto]
    );
    res.json({ message: 'Comentario agregado correctamente.' });
  } catch (error) {
    console.error('Error al guardar comentario:', error);
    res.status(500).json({ message: 'Error al guardar el comentario.' });
  }
});

// Ruta API: Guardar Respuestas (Para Responder Encuesta)
app.post('/surveys/:id/responses', authMiddleware, async (req, res) => {
  const surveyId = req.params.id;
  const userId = req.user.id_usuario;
  const { responses } = req.body; // Array de { id_pregunta, respuesta }

  if (!responses || responses.length === 0) {
    return res.status(400).json({ message: 'No hay respuestas para guardar.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 0. Obtener el trabajador del usuario
    const [tRows] = await connection.execute(
      'SELECT id_trabajador FROM trabajador WHERE id_usuario = ?',
      [userId]
    );
    if (!tRows || tRows.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: 'El usuario no es un trabajador válido.' });
    }
    const id_trabajador = tRows[0].id_trabajador;

    // 1. Validar asignación pendiente
    const [assignRows] = await connection.execute(
      'SELECT id_asignacion, estado FROM encuesta_asignada WHERE id_encuesta = ? AND id_trabajador = ? ORDER BY id_asignacion DESC LIMIT 1',
      [surveyId, id_trabajador]
    );
    if (!assignRows || assignRows.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: 'No tienes asignada esta encuesta.' });
    }
    const asignacion = assignRows[0];
    if (asignacion.estado !== 'pendiente') {
      await connection.rollback();
      return res.status(409).json({ message: 'La encuesta ya fue respondida o no está pendiente.' });
    }

    // 2. Mapa de tipos por pregunta
    const [qRows] = await connection.execute(
      'SELECT id_pregunta, tipo FROM pregunta WHERE id_encuesta = ?',
      [surveyId]
    );
    const typeMap = new Map(qRows.map(row => [row.id_pregunta, row.tipo]));

    // 3. Guardar cada respuesta como fila en `respuesta`
    for (const r of responses) {
      const tipo = typeMap.get(r.id_pregunta);
      if (!tipo) {
        await connection.rollback();
        return res.status(400).json({ message: `Pregunta inválida: ${r.id_pregunta}` });
      }
      let valor_texto = null;
      let id_opcion_selecionada = null;
      let valor_escala = null;

      if (tipo === 'texto' || tipo === 'si_no') {
        valor_texto = r.respuesta ?? null;
      } else if (tipo === 'opcion_multiple') {
        id_opcion_selecionada = r.respuesta ? parseInt(r.respuesta) : null;
      } else if (tipo === 'escala_1_5') {
        valor_escala = r.respuesta ? parseInt(r.respuesta) : null;
      }

      await connection.execute(
        'INSERT INTO respuesta (id_asignacion, id_pregunta, valor_texto, id_opcion_seleccionada, valor_escala, fecha_respuesta) VALUES (?, ?, ?, ?, ?, NOW())',
        [asignacion.id_asignacion, r.id_pregunta, valor_texto, id_opcion_selecionada, valor_escala]
      );
    }

    // 4. Marcar la asignación como completada
    await connection.execute(
      'UPDATE encuesta_asignada SET estado = "completada", fecha_completada = NOW() WHERE id_asignacion = ?',
      [asignacion.id_asignacion]
    );

    await connection.commit();
    res.status(201).json({ message: 'Respuestas guardadas correctamente.' });
  } catch (error) {
    console.error('Error guardando respuestas:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Error al guardar respuestas.' });
  } finally {
    if (connection) connection.release();
  }
});

// Ruta API: Obtener Usuarios (Para Gestionar Usuarios y Asignar)
app.get('/api/usuarios', authMiddleware, async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id_usuario, nombre, email, rol, activo FROM usuario');
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo usuarios.' });
  }
});

// Ruta API: Obtener Trabajadores (Para Gestionar Usuarios)
app.get('/api/trabajadores', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        t.id_trabajador, 
        CONCAT(t.nombre, ' ', t.apellido) as nombre, 
        u.email, 
        t.area as departamento, 
        u.activo,
        u.id_usuario AS id_usuario,
        u.rol AS rol
      FROM trabajador t
      JOIN usuario u ON t.id_usuario = u.id_usuario
    `);
    res.json({ data: rows });
  } catch (error) {
    console.error('Error obteniendo trabajadores:', error);
    res.status(500).json({ message: 'Error al obtener trabajadores.' });
  }
});

// Ruta API: Obtener un Usuario (Para Perfil)
app.get('/api/usuarios/:id', authMiddleware, async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id_usuario, nombre, apellidos, cedula, fecha_nacimiento, email, rol, activo FROM usuario WHERE id_usuario = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ data: users[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo perfil.' });
  }
});

// Ruta API: Actualizar Usuario (Para Perfil y Gestionar Usuarios)
app.put('/api/usuarios/:id', authMiddleware, async (req, res) => {
  const { nombre, email, rol, telefono } = req.body;
  try {
    // Construcción dinámica de la query
    let query = 'UPDATE usuario SET nombre = ?, email = ?';
    const params = [nombre, email];

    if (rol) {
      query += ', rol = ?';
      params.push(rol);
    }
    

    query += ' WHERE id_usuario = ?';
    params.push(req.params.id);

    await db.execute(query, params);
    res.json({ message: 'Usuario actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error actualizando usuario.' });
  }
});

// Ruta API: Crear Usuario (Para Gestionar Usuarios - Admin)
app.post('/api/usuarios', authMiddleware, async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO usuario (nombre, email, password_hash, rol, activo, fecha_registro) VALUES (?, ?, ?, ?, 1, CURDATE())',
      [nombre, email, hashedPassword, rol]
    );
    res.status(201).json({ message: 'Usuario creado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creando usuario.' });
  }
});

// Ruta API: Eliminar Usuario (Para Gestionar Usuarios - Admin)
app.delete('/api/usuarios/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Si el usuario no es un trabajador, esta consulta simplemente no afectará a ninguna fila.
    await connection.execute('DELETE FROM trabajador WHERE id_usuario = ?', [id]);
    
    // Luego, eliminar de la tabla 'usuario'
    const [result] = await connection.execute('DELETE FROM usuario WHERE id_usuario = ?', [id]);

    // Si no se afectaron filas, significa que el usuario no existía.
    if (result.affectedRows === 0) {
      await connection.rollback(); // Revertimos la transacción aunque no se haya hecho nada.
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    await connection.commit(); // Confirmamos la transacción si todo fue bien.
    res.status(200).json({ message: 'Usuario eliminado correctamente.' });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    if (connection) await connection.rollback(); // Revertir en caso de cualquier error.
    res.status(500).json({ message: 'Error interno del servidor al eliminar el usuario.' });
  } finally {
    if (connection) connection.release(); // Liberar la conexión.
  }
});

// Ruta API: Eliminar Trabajador
app.delete('/api/trabajadores/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Obtener id_usuario para eliminar también el usuario base
    const [workers] = await connection.execute('SELECT id_usuario FROM trabajador WHERE id_trabajador = ?', [id]);
    
    await connection.execute('DELETE FROM trabajador WHERE id_trabajador = ?', [id]);
    
    if (workers.length > 0) {
       await connection.execute('DELETE FROM usuario WHERE id_usuario = ?', [workers[0].id_usuario]);
    }

    await connection.commit();
    res.json({ message: 'Trabajador eliminado correctamente.' });
  } catch (error) {
    console.error('Error eliminando trabajador:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Error al eliminar trabajador.' });
  } finally {
    if (connection) connection.release();
  }
});

// Ruta API: Asignar Encuesta (Para Asignar Encuesta)
app.post('/api/asignaciones', authMiddleware, async (req, res) => {
  const { id_encuesta, usuarios, fecha_asignacion } = req.body; // usuarios es array de IDs

  if (!id_encuesta || !usuarios || usuarios.length === 0) {
    return res.status(400).json({ message: 'Datos incompletos.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Obtener título de la encuesta para la notificación
    const [surveyRows] = await connection.execute('SELECT titulo FROM encuesta WHERE id_encuesta = ?', [id_encuesta]);
    if (!surveyRows || surveyRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Encuesta no encontrada.' });
    }
    const surveyTitle = surveyRows[0].titulo;

    for (const userId of usuarios) {
      // 1. Buscar el id_trabajador correspondiente al id_usuario
      const [trabajadorRows] = await connection.execute(
        'SELECT id_trabajador FROM trabajador WHERE id_usuario = ?',
        [userId]
      );

      // Si no es un trabajador o no existe, simplemente lo omitimos.
      if (trabajadorRows.length === 0) {
        console.log(`Usuario con ID ${userId} no es un trabajador o no fue encontrado. Omitiendo asignación.`);
        continue; // Pasar al siguiente usuario
      }
      
      const id_trabajador = trabajadorRows[0].id_trabajador;

      // 2. Verificar si ya existe la asignación para no duplicar
      const [existing] = await connection.execute(
        'SELECT id_asignacion FROM encuesta_asignada WHERE id_encuesta = ? AND id_trabajador = ?',
        [id_encuesta, id_trabajador]
      );

      // 3. Si no existe, insertar la nueva asignación con el id_trabajador correcto
      if (existing.length === 0) {
        // Validar y formatear la fecha a 'YYYY-MM-DD HH:MM:SS' para MySQL
        const assignmentDate = new Date(fecha_asignacion || Date.now());
        const formattedDate = assignmentDate.toISOString().slice(0, 19).replace('T', ' ');

        await connection.execute(
          'INSERT INTO encuesta_asignada (id_encuesta, id_trabajador, fecha_completada, estado, fecha_asignacion) VALUES (?, ?, NULL, "pendiente", ?)',
          [id_encuesta, id_trabajador, formattedDate]
        );

        // 4. Crear notificación para el usuario
        await connection.execute(
          'INSERT INTO notificacion (id_usuario, id_trabajador, id_encuesta, titulo, mensaje, tipo, fecha_creacion) VALUES (?, ?, ?, ?, ?, "nueva_encuesta", NOW())',
          [userId, id_trabajador, id_encuesta, `Nueva Asignación: ${surveyTitle}`, `Se te ha asignado la encuesta "${surveyTitle}". Por favor respóndela antes de la fecha límite.`]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Asignaciones creadas correctamente.' });
  } catch (error) {
    console.error('Error en asignaciones:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Error al asignar encuesta.' });
  } finally {
    if (connection) connection.release();
  }
});

// Ruta API: Estadísticas Dashboard
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const [activeSurveys] = await db.execute('SELECT COUNT(*) as count FROM encuesta WHERE fecha_limite >= NOW() OR fecha_limite IS NULL');
    const [totalUsers] = await db.execute('SELECT COUNT(*) as count FROM usuario');
    const [completedResponses] = await db.execute('SELECT COUNT(*) as count FROM respuesta');
    const [pendingResponses] = await db.execute('SELECT COUNT(*) as count FROM encuesta_asignada WHERE estado = "pendiente"');
    
    res.json({
      active: activeSurveys[0].count,
      pending: pendingResponses[0].count,
      users: totalUsers[0].count,
      completed: completedResponses[0].count
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo estadísticas.' });
  }
});

// Ruta API: Historial de Asignaciones
app.get('/api/assignments', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.id_asignacion, e.titulo, u.email, a.fecha_asignacion, a.estado 
      FROM encuesta_asignada a
      JOIN encuesta e ON a.id_encuesta = e.id_encuesta
      JOIN trabajador t ON a.id_trabajador = t.id_trabajador
      JOIN usuario u ON t.id_usuario = u.id_usuario
      ORDER BY a.fecha_asignacion DESC
    `);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo historial.' });
  }
});

// Ruta API: Mis Asignaciones (solo del usuario autenticado)
app.get('/api/my-assignments', authMiddleware, async (req, res) => {
  const userId = req.user.id_usuario;
  try {
    const [rows] = await db.execute(`
      SELECT 
        a.id_asignacion,
        a.estado,
        a.fecha_asignacion,
        e.id_encuesta,
        e.titulo,
        e.descripcion,
        e.fecha_limite
      FROM encuesta_asignada a
      JOIN trabajador t ON a.id_trabajador = t.id_trabajador
      JOIN encuesta e ON a.id_encuesta = e.id_encuesta
      WHERE t.id_usuario = ?
      ORDER BY a.fecha_asignacion DESC
    `, [userId]);
    res.json({ data: rows });
  } catch (error) {
    console.error('Error obteniendo mis asignaciones:', error);
    res.status(500).json({ message: 'Error al obtener asignaciones.' });
  }
});

// Ruta API: Obtener Notificaciones
app.get('/api/notificaciones', authMiddleware, async (req, res) => {
  const userId = req.user.id_usuario;
  try {
    res.setHeader('Cache-Control', 'no-store');
    const [rows] = await db.execute(
      'SELECT * FROM notificacion WHERE id_usuario = ? ORDER BY fecha_creacion DESC',
      [userId]
    );

    const notifications = rows.map(n => ({
      ...n,
      leida: n.fecha_lectura !== null
    }));

    res.json({ data: notifications });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ message: 'Error al obtener notificaciones.' });
  }
});

// Ruta API: Marcar Notificación como Leída
app.put('/api/notificaciones/:id/leida', authMiddleware, async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id_usuario;
  try {
    await db.execute(
      'UPDATE notificacion SET fecha_lectura = NOW() WHERE id_notificacion = ? AND id_usuario = ?',
      [notificationId, userId]
    );
    res.json({ message: 'Notificación marcada como leída.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar notificación.' });
  }
});

// Ruta API: Eliminar Notificación
app.delete('/api/notificaciones/:id', authMiddleware, async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id_usuario;
  try {
    await db.execute(
      'DELETE FROM notificacion WHERE id_notificacion = ? AND id_usuario = ?',
      [notificationId, userId]
    );
    res.json({ message: 'Notificación eliminada.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar notificación.' });
  }
});

// Ruta API: Marcar todas las notificaciones como leídas
app.put('/api/notificaciones/marcar-todas-leidas', authMiddleware, async (req, res) => {
  const userId = req.user.id_usuario;
  try {
    await db.execute(
      'UPDATE notificacion SET fecha_lectura = NOW() WHERE id_usuario = ? AND fecha_lectura IS NULL',
      [userId]
    );
    res.json({ message: 'Todas las notificaciones marcadas como leídas.' });
  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
    res.status(500).json({ message: 'Error al actualizar notificaciones.' });
  }
});

// Ruta API: Contar Notificaciones No Leídas
app.get('/api/notificaciones/no-leidas/count', authMiddleware, async (req, res) => {
  const userId = req.user.id_usuario;
  try {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM notificacion WHERE id_usuario = ? AND fecha_lectura IS NULL', [userId]);
    res.json({ data: { count: rows[0].count } });
  } catch (error) {
    res.status(500).json({ message: 'Error contando notificaciones.' });
  }
});

// Ruta API: Historial de envíos (Para historia-envio.js)
app.get('/api/historial-envios', authMiddleware, async (req, res) => {
  const userId = req.user.id_usuario;
  const userRole = req.user.rol;

  try {
    // Si es trabajador, mostrar historial de respuestas enviadas por él
    if (userRole === 'trabajador') {
      const [rows] = await db.execute(`
        SELECT 
          e.id_encuesta,
          e.titulo as titulo_encuesta,
          e.fecha_creacion,
          ea.fecha_completada as fecha_envio,
          1 as total_asignados,
          1 as total_respondidos,
          'enviada' as estado,
          e.id_encuesta as id_envio
        FROM encuesta_asignada ea
        JOIN encuesta e ON ea.id_encuesta = e.id_encuesta
        JOIN trabajador t ON ea.id_trabajador = t.id_trabajador
        WHERE t.id_usuario = ? AND ea.estado = 'completada'
        ORDER BY ea.fecha_completada DESC
      `, [userId]);
      return res.json({ data: rows });
    }

    // Si es creador/admin, mostrar historial de asignaciones realizadas
    const [rows] = await db.execute(`
      SELECT 
        e.id_encuesta,
        e.titulo as titulo_encuesta,
        e.fecha_creacion,
        MAX(ea.fecha_asignacion) as fecha_envio,
        COUNT(ea.id_asignacion) as total_asignados,
        SUM(CASE WHEN ea.estado = 'completada' THEN 1 ELSE 0 END) as total_respondidos,
        CASE 
            WHEN e.fecha_limite IS NOT NULL AND e.fecha_limite < NOW() THEN 'cerrada'
            WHEN COUNT(ea.id_asignacion) > 0 AND COUNT(ea.id_asignacion) = SUM(CASE WHEN ea.estado = 'completada' THEN 1 ELSE 0 END) THEN 'cerrada'
            ELSE 'en_progreso'
        END as estado,
        e.id_encuesta as id_envio
      FROM encuesta e
      JOIN encuesta_asignada ea ON e.id_encuesta = ea.id_encuesta
      WHERE e.id_usuario_creador = ?
      GROUP BY e.id_encuesta
      ORDER BY fecha_envio DESC
    `, [userId]);
    
    res.json({ data: rows });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ message: 'Error al obtener historial.' });
  }
});

// Ruta API: Reenviar encuesta (Notificar pendientes)
app.post('/api/historial-envios/:id/reenviar', authMiddleware, async (req, res) => {
  const surveyId = req.params.id;
  
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Obtener asignaciones pendientes
    const [pending] = await connection.execute(`
      SELECT ea.id_asignacion, ea.id_trabajador, u.id_usuario, e.titulo
      FROM encuesta_asignada ea
      JOIN encuesta e ON ea.id_encuesta = e.id_encuesta
      JOIN trabajador t ON ea.id_trabajador = t.id_trabajador
      JOIN usuario u ON t.id_usuario = u.id_usuario
      WHERE ea.id_encuesta = ? AND ea.estado = 'pendiente'
    `, [surveyId]);

    if (pending.length === 0) {
      await connection.rollback();
      return res.json({ message: 'No hay usuarios pendientes por responder.' });
    }

    // Crear notificaciones
    for (const p of pending) {
      await connection.execute(
        'INSERT INTO notificacion (id_usuario, id_trabajador, id_encuesta, titulo, mensaje, tipo, fecha_creacion) VALUES (?, ?, ?, ?, ?, "recordatorio", NOW())',
        [p.id_usuario, p.id_trabajador, surveyId, `Recordatorio: ${p.titulo}`, `Recuerda responder la encuesta "${p.titulo}".`]
      );
    }

    await connection.commit();
    res.json({ message: `Recordatorio enviado a ${pending.length} usuarios.` });

  } catch (error) {
    console.error('Error reenviando encuesta:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Error al reenviar encuesta.' });
  } finally {
    if (connection) connection.release();
  }
});

// Ruta raíz (opcional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html_interfaz', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, async () => {
  try {
    // Probar la conexión a la base de datos al iniciar el servidor
    const connection = await db.getConnection();
    
    // Crear tabla de notificaciones si no existe
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notificacion (
        id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario INT NOT NULL,
        id_trabajador INT,
        id_encuesta INT,
        titulo VARCHAR(100),
        mensaje TEXT,
        tipo ENUM('nueva_encuesta','recordatorio','completada'),
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_lectura DATETIME NULL
      )
    `);

    // Crear tabla de comentarios si no existe
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS comentario_asignacion (
        id_comentario INT AUTO_INCREMENT PRIMARY KEY,
        id_asignacion INT NOT NULL,
        id_autor INT NOT NULL,
        texto TEXT NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_asignacion) REFERENCES encuesta_asignada(id_asignacion) ON DELETE CASCADE,
        FOREIGN KEY (id_autor) REFERENCES usuario(id_usuario)
      )
    `);

    console.log('✅ Conectado a MySQL');
    connection.release(); // Liberar la conexión de vuelta al pool
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📄 Tu formulario: http://localhost:${PORT}/registro.html`);
  } catch (err) {
    console.error('❌ Error al conectar con MySQL:', err.message);
    process.exit(1); // Salir si la conexión a la base de datos falla
  }
});
