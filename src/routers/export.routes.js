import { Router } from 'express';
import exportController from '../controllers/export.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de exportación requieren docente autenticado
router.use(authenticateToken);

/**
 * @openapi
 * tags:
 *   name: Exportación y Descargas
 *   description: Generación y descarga de evaluaciones en Word (.docx) y PDF con versiones para Estudiante y Docente (Solucionario)
 */

/**
 * @openapi
 * /api/exports/exams/{id}/pdf:
 *   get:
 *     summary: Descargar evaluación en formato PDF
 *     tags: [Exportación y Descargas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la evaluación
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [ESTUDIANTE, DOCENTE_SOLUCIONARIO]
 *           default: ESTUDIANTE
 *         description: Tipo de documento (ESTUDIANTE sin respuestas, DOCENTE_SOLUCIONARIO con respuestas y retroalimentación)
 *     responses:
 *       200:
 *         description: Archivo PDF generado y listo para imprimir
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parámetros inválidos o evaluación sin preguntas
 *       404:
 *         description: Evaluación no encontrada
 */
router.get('/exams/:id/pdf', exportController.exportPdf);

/**
 * @openapi
 * /api/exports/exams/{id}/word:
 *   get:
 *     summary: Descargar evaluación en formato Word (.docx)
 *     tags: [Exportación y Descargas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la evaluación
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [ESTUDIANTE, DOCENTE_SOLUCIONARIO]
 *           default: ESTUDIANTE
 *         description: Tipo de documento (ESTUDIANTE sin respuestas, DOCENTE_SOLUCIONARIO con respuestas y retroalimentación)
 *     responses:
 *       200:
 *         description: Archivo DOCX editable generado
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parámetros inválidos o evaluación sin preguntas
 *       404:
 *         description: Evaluación no encontrada
 */
router.get('/exams/:id/word', exportController.exportWord);

/**
 * @openapi
 * /api/exports/exams/{id}/history:
 *   get:
 *     summary: Consultar historial de descargas de una evaluación específica
 *     tags: [Exportación y Descargas]
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
 *         description: Historial de exportaciones con fecha y formato
 */
router.get('/exams/:id/history', exportController.getExamHistory);

/**
 * @openapi
 * /api/exports/history:
 *   get:
 *     summary: Consultar todo el historial de exportaciones realizadas por el docente
 *     tags: [Exportación y Descargas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial general de descargas del docente
 */
router.get('/history', exportController.getMyHistory);

export default router;
