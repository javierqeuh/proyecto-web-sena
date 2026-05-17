import express from 'express';
import * as usuarioController from '../controllers/usuarioController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import multer from 'multer';
import path from 'path';

// Configuración de Multer para gestionar la subida de imágenes de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta donde se guardarán las fotos
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Nombre único para evitar colisiones
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = express.Router();

// Definición de endpoints protegidos por authMiddleware
router.get('/', authMiddleware, usuarioController.getAllUsers);
router.post('/', authMiddleware, usuarioController.createUser);
router.get('/:id', authMiddleware, usuarioController.getUserById);
// Ruta especial que usa Multer para recibir la foto en el campo 'foto_perfil'
router.put('/:id', authMiddleware, upload.single('foto_perfil'), usuarioController.updateUser);
router.delete('/:id', authMiddleware, usuarioController.deleteUser);

// Rutas específicas para gestión de trabajadores
router.get('/trabajadores', authMiddleware, usuarioController.getAllWorkers);
router.delete('/trabajadores/:id', authMiddleware, usuarioController.deleteWorker);

export default router;