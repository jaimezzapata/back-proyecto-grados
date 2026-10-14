import { Router } from 'express';
import courseController from '../controllers/course.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import {
  validateSchema,
  vincularAsignaturaSchema,
  createProgramaSchema,
  createAsignaturaSchema
} from '../middlewares/validate.middleware.js';

const router = Router();

// Rutas accesibles por cualquier docente autenticado
router.get('/programas', authenticateToken, courseController.getProgramas);
router.get('/asignaturas', authenticateToken, courseController.getAsignaturas);
router.get('/asignaturas/:id', authenticateToken, courseController.getAsignaturaById);

// Rutas específicas del docente autenticado
router.get('/mis-asignaturas', authenticateToken, courseController.getMisAsignaturas);
router.post(
  '/vincular-asignatura',
  authenticateToken,
  validateSchema(vincularAsignaturaSchema),
  courseController.vincularAsignatura
);

// Rutas de administración para crear catálogos
router.post(
  '/programas',
  authenticateToken,
  requireRole('ADMINISTRADOR'),
  validateSchema(createProgramaSchema),
  courseController.createPrograma
);

router.post(
  '/asignaturas',
  authenticateToken,
  requireRole('ADMINISTRADOR'),
  validateSchema(createAsignaturaSchema),
  courseController.createAsignatura
);

export default router;
