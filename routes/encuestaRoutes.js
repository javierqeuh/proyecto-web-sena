import express from 'express';
import * as encuestaController from '../controllers/encuestaController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { authorize, PERMISOS, ROLES } from '../roles.js';

const router = express.Router();

router.get('/mis-asignaciones', authMiddleware, authorize(PERMISOS.RESPONDER_ENCUESTAS), encuestaController.getMyAssignments);
router.post('/asignaciones/:id/comentario', authMiddleware, authorize(PERMISOS.ver_revicion_respuestas), encuestaController.addAssignmentComment);
router.post('/asignaciones', authMiddleware, authorize(PERMISOS.ASIGNAR_ENCUESTAS), encuestaController.assignSurvey); // Originalmente /api/asignaciones

router.post('/', authMiddleware, authorize(PERMISOS.CREAR_ENCUESTAS), encuestaController.createSurvey); // /surveys
router.get('/', authMiddleware, authorize(PERMISOS.VER_REPORTES), encuestaController.getAllSurveys);
router.get('/:id', authMiddleware, authorize([ROLES.ADMIN, ROLES.USUARIO, ROLES.TRABAJADOR]), encuestaController.getSurveyById);
router.delete('/:id', authMiddleware, authorize(PERMISOS.CREAR_ENCUESTAS), encuestaController.deleteSurvey);
router.get('/:id/responses', authMiddleware, authorize(PERMISOS.ver_revicion_respuestas), encuestaController.getSurveyResponses);
router.post('/:id/responses', authMiddleware, authorize(PERMISOS.RESPONDER_ENCUESTAS), encuestaController.saveResponses);

export default router;