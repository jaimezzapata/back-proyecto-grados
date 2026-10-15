import { Router } from 'express';
import courseController from '../controllers/course.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import {
  validateSchema,
  vincularAsignaturaSchema,
  updateDocenteAsignaturaSchema,
  createProgramaSchema,
  createAsignaturaSchema,
  updateAsignaturaSchema
} from '../middlewares/validate.middleware.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Contexto Académico
 *   description: Gestión de Programas Académicos, Asignaturas y asignación a Docentes
 */

/**
 * @openapi
 * /api/academic/programas:
 *   get:
 *     summary: Listar todos los programas académicos
 *     tags: [Contexto Académico]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de programas académicos disponibles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: No autenticado
 */
router.get('/programas', authenticateToken, courseController.getProgramas);

/**
 * @openapi
 * /api/academic/asignaturas:
 *   get:
 *     summary: Listar asignaturas (opcionalmente filtradas por programa)
 *     tags: [Contexto Académico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programa_id
 *         schema:
 *           type: integer
 *         description: ID del programa académico para filtrar asignaturas
 *     responses:
 *       200:
 *         description: Lista de asignaturas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/asignaturas', authenticateToken, courseController.getAsignaturas);

/**
 * @openapi
 * /api/academic/asignaturas/{id}:
 *   get:
 *     summary: Obtener detalle de una asignatura por su ID
 *     tags: [Contexto Académico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle de la asignatura
 *       404:
 *         description: Asignatura no encontrada
 */
router.get('/asignaturas/:id', authenticateToken, courseController.getAsignaturaById);

/**
 * @openapi
 * /api/academic/mis-asignaturas:
 *   get:
 *     summary: Obtener las asignaturas que imparte el docente autenticado
 *     tags: [Contexto Académico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *         description: Periodo académico (ej. 2026-1)
 *     responses:
 *       200:
 *         description: Asignaturas asignadas al docente
 */
router.get('/mis-asignaturas', authenticateToken, courseController.getMisAsignaturas);

/**
 * @openapi
 * /api/academic/vincular-asignatura:
 *   post:
 *     summary: Vincular una asignatura al docente en un periodo y grupo determinado
 *     tags: [Contexto Académico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VincularAsignaturaInput'
 *     responses:
 *       201:
 *         description: Asignatura vinculada con éxito
 *       400:
 *         description: Datos inválidos
 */
router.post(
  '/vincular-asignatura',
  authenticateToken,
  validateSchema(vincularAsignaturaSchema),
  courseController.vincularAsignatura
);

/**
 * @openapi
 * /api/academic/mis-asignaturas/{id}:
 *   put:
 *     summary: Actualizar la configuración de un grupo o modificar la asignatura vinculada
 *     tags: [Contexto Académico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la asignación (DocenteAsignatura)
 *     responses:
 *       200:
 *         description: Asignatura actualizada
 *       404:
 *         description: Asignación no encontrada
 */
router.put(
  '/mis-asignaturas/:id',
  authenticateToken,
  validateSchema(updateDocenteAsignaturaSchema),
  courseController.updateMisAsignatura
);

/**
 * @openapi
 * /api/academic/mis-asignaturas/{id}:
 *   delete:
 *     summary: Desvincular una asignatura o grupo del docente
 *     tags: [Contexto Académico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la asignación (DocenteAsignatura)
 *     responses:
 *       200:
 *         description: Asignación eliminada exitosamente
 */
router.delete(
  '/mis-asignaturas/:id',
  authenticateToken,
  courseController.deleteMisAsignatura
);

/**
 * @openapi
 * /api/academic/asignaturas/{id}:
 *   put:
 *     summary: Modificar información de una asignatura (Catálogo)
 *     tags: [Contexto Académico]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/asignaturas/:id',
  authenticateToken,
  requireRole('ADMINISTRADOR', 'DOCENTE'),
  validateSchema(updateAsignaturaSchema),
  courseController.updateAsignatura
);

/**
 * @openapi
 * /api/academic/programas:
 *   post:
 *     summary: Crear un nuevo programa académico (Solo Administrador)
 *     tags: [Contexto Académico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProgramaInput'
 *     responses:
 *       201:
 *         description: Programa creado
 *       403:
 *         description: Requiere rol ADMINISTRADOR
 */
router.post(
  '/programas',
  authenticateToken,
  requireRole('ADMINISTRADOR'),
  validateSchema(createProgramaSchema),
  courseController.createPrograma
);

/**
 * @openapi
 * /api/academic/asignaturas:
 *   post:
 *     summary: Crear una nueva asignatura (Solo Administrador)
 *     tags: [Contexto Académico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAsignaturaInput'
 *     responses:
 *       201:
 *         description: Asignatura creada
 *       403:
 *         description: Requiere rol ADMINISTRADOR
 */
router.post(
  '/asignaturas',
  authenticateToken,
  requireRole('ADMINISTRADOR', 'DOCENTE'),
  validateSchema(createAsignaturaSchema),
  courseController.createAsignatura
);

export default router;
