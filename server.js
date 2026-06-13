// server.js
import express from 'express';
import path, { dirname } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv'; // Import dotenv
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import db from './config/db.js'; // Import the database pool from db.js
import apiRoutes from './routes/index.js';
import * as authController from './controllers/authController.js';
import encuestaRoutes from './routes/encuestaRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Confiar en el proxy inverso (Nginx) para manejar HTTPS e IPs reales
app.set('trust proxy', 1);

// 1. Configuración de variables de entorno
dotenv.config({ path: path.join(__dirname, 'config', '.env') }); // Cargar variables de entorno desde la carpeta config

// 2. Middlewares de Seguridad y Generales
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http://localhost:*", "https://*"]
    }
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// 3. Limitación de Tasa (Rate Limiting) para rutas sensibles
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por IP
  message: { message: 'Demasiadas peticiones desde esta IP, intente de nuevo más tarde.' }
});

app.use('/login', apiLimiter);
app.use('/api/registro', apiLimiter);

// 4. Redirección automática de .htm a .html
app.use((req, res, next) => {
  if (req.path.endsWith('.htm')) {
    return res.redirect(301, req.path.replace(/\.htm$/, '.html'));
  }
  next();
});

// 5. Configuración de Archivos Estáticos
// Sirve los archivos HTML desde la carpeta 'html_interfaz' como si estuvieran en la raíz
app.use(express.static(path.join(__dirname, 'html_interfaz'))); 
// Sirve los imágenes desde la carpeta 'img' bajo la ruta /img
app.use('/img', express.static(path.join(__dirname, 'img')));
// Sirve la lógica de la interfaz (JS)
app.use('/logica_interfaz', express.static(path.join(__dirname, 'logica_interfaz')));
// Sirve las imágenes de perfil subidas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));



// 6. Rutas de la API (Centralizadas)
app.use('/api', apiRoutes);

// 7. Rutas de Encuestas (Compatibilidad)
// Ruta de compatibilidad para el dashboard que llama a /surveys directamente
app.use('/surveys', encuestaRoutes);

// 8. Rutas de Autenticación
// Redirección para compatibilidad con frontend existente si llama a /login directamente
app.post('/login', authController.login);
app.post('/api/registro', authController.register);
app.post('/forgot-password', authController.forgotPassword);
app.post('/reset-password', authController.resetPassword);

// 9. Ruta Raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html_interfaz', 'index.html'));
});

// 10. Inicialización del Servidor y Base de Datos
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
        tipo ENUM('nueva_encuesta', 'asignacion', 'respuesta', 'resultado', 'recordatorio', 'completada', 'encuesta'),
        leida BOOLEAN NOT NULL DEFAULT FALSE,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
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
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Tu formulario: http://localhost:${PORT}/interfasz-ingreso.html`);
  } catch (err) {
    console.error('Error al conectar con MySQL:', err.message);
    process.exit(1); // Salir si la conexión a la base de datos falla
  }
});