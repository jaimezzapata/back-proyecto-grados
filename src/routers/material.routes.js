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

router.post('/upload', uploadMaterial.single('archivo'), materialController.upload);
router.get('/', materialController.getMisMateriales);
router.get('/:id', materialController.getMaterialById);
router.delete('/:id', materialController.deleteMaterial);

export default router;
