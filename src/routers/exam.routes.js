import { Router } from 'express';
import examController from '../controllers/exam.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireFeature } from '../middlewares/feature.middleware.js';
import { FEATURES } from '../config/features.js';
import {
  validateSchema,
  generateExamSchema,
  updateQuestionSchema,
  updateOptionSchema,
  addQuestionSchema,
  approveExamSchema
} from '../middlewares/validate.middleware.js';

const router = Router();

// Todas las rutas de exámenes requieren docente autenticado y feature flag activo
router.use(authenticateToken);
router.use(requireFeature(FEATURES.AI_GENERATION));

/**
 * @openapi
 * tags:
 *   name: Motor de Evaluaciones e IA
 *   description: Generación automática de evaluaciones académicas con IA y supervisión docente (Human-in-the-Loop)
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
 *     summary: Eliminar una evaluación completa
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

// ==========================================
// Endpoints Human-in-the-Loop (Edición Granular)
// ==========================================

/**
 * @openapi
 * /api/exams/{id}/questions:
 *   post:
 *     summary: Agregar una nueva pregunta redactada manualmente por el docente (Human-in-the-Loop)
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
 *               - enunciado
 *             properties:
 *               enunciado:
 *                 type: string
 *                 example: ¿Cuál es la principal ventaja de desacoplar las capas de una aplicación?
 *               tipo_pregunta:
 *                 type: string
 *                 enum: [OPCION_MULTIPLE, VERDADERO_FALSO, ABIERTA, MIXTA]
 *                 default: OPCION_MULTIPLE
 *               nivel_bloom:
 *                 type: string
 *                 enum: [Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear]
 *                 default: Comprender
 *               puntaje:
 *                 type: number
 *                 default: 1.0
 *               justificacion_pedagogica:
 *                 type: string
 *                 example: Evalúa comprensión de la mantenibilidad del software.
 *               opciones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - texto_opcion
 *                   properties:
 *                     texto_opcion:
 *                       type: string
 *                       example: Facilita la escalabilidad y las pruebas independientes.
 *                     es_correcta:
 *                       type: boolean
 *                       default: false
 *                     retroalimentacion:
 *                       type: string
 *                       example: Correcto, permite modificar una capa sin alterar las demás.
 *     responses:
 *       201:
 *         description: Pregunta y opciones añadidas correctamente
 */
router.post(
  '/:id/questions',
  validateSchema(addQuestionSchema),
  examController.addQuestion
);

/**
 * @openapi
 * /api/exams/{id}/questions/{questionId}:
 *   put:
 *     summary: Editar enunciado, nivel de Bloom, puntaje o justificación de una pregunta (Human-in-the-Loop)
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
 *       - in: path
 *         name: questionId
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
 *             properties:
 *               enunciado:
 *                 type: string
 *               tipo_pregunta:
 *                 type: string
 *                 enum: [OPCION_MULTIPLE, VERDADERO_FALSO, ABIERTA, MIXTA]
 *               nivel_bloom:
 *                 type: string
 *                 enum: [Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear]
 *               puntaje:
 *                 type: number
 *               justificacion_pedagogica:
 *                 type: string
 *               orden:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Pregunta editada exitosamente
 */
router.put(
  '/:id/questions/:questionId',
  validateSchema(updateQuestionSchema),
  examController.updateQuestion
);

/**
 * @openapi
 * /api/exams/{id}/questions/{questionId}:
 *   delete:
 *     summary: Eliminar una pregunta específica de la evaluación (Human-in-the-Loop)
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
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pregunta eliminada exitosamente
 *       400:
 *         description: No se puede eliminar la única pregunta del examen
 */
router.delete(
  '/:id/questions/:questionId',
  examController.deleteQuestion
);

/**
 * @openapi
 * /api/exams/{id}/questions/{questionId}/options/{optionId}:
 *   put:
 *     summary: Modificar texto, retroalimentación o respuesta correcta de una opción (Human-in-the-Loop)
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
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: optionId
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
 *             properties:
 *               texto_opcion:
 *                 type: string
 *               es_correcta:
 *                 type: boolean
 *               retroalimentacion:
 *                 type: string
 *               marcar_como_unica_correcta:
 *                 type: boolean
 *                 description: Si es true, desmarca todas las demás opciones y marca solo esta como correcta
 *               orden:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Opción de respuesta actualizada exitosamente
 */
router.put(
  '/:id/questions/:questionId/options/:optionId',
  validateSchema(updateOptionSchema),
  examController.updateOption
);

/**
 * @openapi
 * /api/exams/{id}/approve:
 *   post:
 *     summary: Aprobar y congelar la versión final del examen (Human-in-the-Loop)
 *     description: Realiza validaciones pedagógicas, genera un snapshot JSON inmutable y registra la versión en la tabla versiones_examenes con estado APROBADO.
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero_version:
 *                 type: string
 *                 example: "v1.0"
 *               comentarios:
 *                 type: string
 *                 example: Examen aprobado para aplicar en la semana 8.
 *     responses:
 *       201:
 *         description: Examen aprobado y versión congelada exitosamente
 *       400:
 *         description: Error pedagógico (ej. no hay preguntas o faltan opciones correctas)
 */
router.post(
  '/:id/approve',
  validateSchema(approveExamSchema),
  examController.approve
);

/**
 * @openapi
 * /api/exams/{id}/versions:
 *   get:
 *     summary: Consultar el historial de versiones congeladas de una evaluación
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
 *         description: Lista de versiones congeladas con sus snapshots y usuario aprobador
 */
router.get(
  '/:id/versions',
  examController.getVersions
);

export default router;
