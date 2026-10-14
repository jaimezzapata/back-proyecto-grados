import { Router } from 'express';
import examController from '../controllers/exam.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireFeature } from '../middlewares/feature.middleware.js';
import { FEATURES } from '../config/features.js';
import { validateSchema, generateExamSchema } from '../middlewares/validate.middleware.js';

const router = Router();

// Todas las rutas de exámenes requieren docente autenticado y feature flag activo
router.use(authenticateToken);
router.use(requireFeature(FEATURES.AI_GENERATION));

/**
 * @openapi
 * tags:
 *   name: Motor de Evaluaciones e IA
 *   description: Generación automática de evaluaciones académicas estructuradas con IA y supervisión docente (Human-in-the-Loop)
 */

/**
 * @openapi
 * /api/exams/generate:
 *   post:
 *     summary: Generar automáticamente una evaluación a partir de material de clase y Taxonomía de Bloom
 *     tags: [Motor de Evaluaciones e IA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - asignatura_id
 *             properties:
 *               asignatura_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID de la asignatura evaluada
 *               material_id:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                 description: ID del material de clase procesado (opcional si se envía texto_manual)
 *               texto_manual:
 *                 type: string
 *                 example: "Texto del tema para generar preguntas..."
 *                 description: Texto plano de entrada (opcional si se envía material_id)
 *               nivel_bloom:
 *                 type: string
 *                 enum: [Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear]
 *                 default: Comprender
 *                 description: Nivel cognitivo según la Taxonomía de Bloom
 *               cantidad_preguntas:
 *                 type: integer
 *                 default: 5
 *                 minimum: 1
 *                 maximum: 30
 *               tipo_preguntas:
 *                 type: string
 *                 enum: [OPCION_MULTIPLE, VERDADERO_FALSO, ABIERTA, MIXTA]
 *                 default: OPCION_MULTIPLE
 *               tema_especifico:
 *                 type: string
 *                 example: Patrones arquitectónicos y capas de software
 *               instrucciones_adicionales:
 *                 type: string
 *                 example: Enfocar preguntas en casos prácticos
 *               titulo_personalizado:
 *                 type: string
 *                 example: Parcial 1 - Arquitectura de Software
 *     responses:
 *       201:
 *         description: Examen generado y persistido exitosamente con sus preguntas y opciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Error en parámetros o en la generación
 *       403:
 *         description: Módulo de IA deshabilitado
 */
router.post(
  '/generate',
  validateSchema(generateExamSchema),
  examController.generate
);

/**
 * @openapi
 * /api/exams:
 *   get:
 *     summary: Listar todas las evaluaciones del docente autenticado
 *     tags: [Motor de Evaluaciones e IA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: asignatura_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de evaluaciones
 */
router.get('/', examController.getMisEvaluaciones);

/**
 * @openapi
 * /api/exams/{id}:
 *   get:
 *     summary: Obtener detalle completo de una evaluación con preguntas y opciones
 *     tags: [Motor de Evaluaciones e IA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Evaluación completa con preguntas y opciones
 *       404:
 *         description: Evaluación no encontrada
 */
router.get('/:id', examController.getById);

/**
 * @openapi
 * /api/exams/{id}/status:
 *   patch:
 *     summary: Actualizar estado de la evaluación (ej. BORRADOR, EN_REVISION, APROBADO)
 *     tags: [Motor de Evaluaciones e IA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [BORRADOR, GENERADO_IA, EN_REVISION, APROBADO, ARCHIVADO]
 *                 example: APROBADO
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 */
router.patch('/:id/status', examController.updateStatus);

/**
 * @openapi
 * /api/exams/{id}:
 *   delete:
 *     summary: Eliminar una evaluación
 *     tags: [Motor de Evaluaciones e IA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Evaluación eliminada exitosamente
 */
router.delete('/:id', examController.delete);

export default router;
