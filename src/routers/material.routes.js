import { Router } from 'express';
import materialController from '../controllers/material.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { uploadMaterial } from '../middlewares/upload.middleware.js';
import { requireFeature } from '../middlewares/feature.middleware.js';
import { FEATURES } from '../config/features.js';

const router = Router();

// Todas las rutas de material requieren docente autenticado y funcionalidad activa
router.use(authenticateToken);
router.use(requireFeature(FEATURES.MATERIAL_INGESTION));

/**
 * @openapi
 * tags:
 *   name: Ingesta de Material
 *   description: Carga y procesamiento de documentos de clase (.pdf, .docx, .txt) para la generación de evaluaciones
 */

/**
 * @openapi
 * /api/materials/upload:
 *   post:
 *     summary: Subir y procesar un archivo de clase con extracción automática de texto
 *     tags: [Ingesta de Material]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - archivo
 *               - asignatura_id
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo en formato PDF, Word (DOCX) o TXT (máx. 15MB)
 *               asignatura_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID de la asignatura a la que corresponde el material
 *               titulo:
 *                 type: string
 *                 example: Unidad 1 - Fundamentos de Arquitectura
 *                 description: Título descriptivo (opcional, por defecto toma el nombre del archivo)
 *     responses:
 *       201:
 *         description: Archivo subido y procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Formato inválido o falta de parámetros
 *       403:
 *         description: Funcionalidad deshabilitada (Feature Flag apagado)
 */
router.post('/upload', uploadMaterial.single('archivo'), materialController.upload);

/**
 * @openapi
 * /api/materials:
 *   get:
 *     summary: Listar los materiales subidos por el docente autenticado
 *     tags: [Ingesta de Material]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: asignatura_id
 *         schema:
 *           type: integer
 *         description: Filtrar materiales por ID de asignatura
 *     responses:
 *       200:
 *         description: Lista de materiales de clase
 */
router.get('/', materialController.getMisMateriales);

/**
 * @openapi
 * /api/materials/{id}:
 *   get:
 *     summary: Obtener detalle y contenido extraído de un material
 *     tags: [Ingesta de Material]
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
 *         description: Detalle del material
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Material no encontrado
 */
router.get('/:id', materialController.getMaterialById);

/**
 * @openapi
 * /api/materials/{id}:
 *   delete:
 *     summary: Eliminar un material y su archivo asociado en disco
 *     tags: [Ingesta de Material]
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
 *         description: Material eliminado exitosamente
 *       404:
 *         description: Material no encontrado
 */
router.delete('/:id', materialController.deleteMaterial);

export default router;
