import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { syncDB } from './models/index.js';
import authRoutes from './routers/auth.routes.js';
import courseRoutes from './routers/course.routes.js';
import materialRoutes from './routers/material.routes.js';
import examRoutes from './routers/exam.routes.js';
import exportRoutes from './routers/export.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { NotFoundError } from './helpers/errors.js';

import { getFeaturesState } from './config/features.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentación Swagger / OpenAPI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Documentación API - Generador de Evaluaciones con IA',
  customCss: '.swagger-ui .topbar { display: none }',
}));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/academic', courseRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exports', exportRoutes);

/**
 * @openapi
 * tags:
 *   name: Sistema
 *   description: Estado general, salud del servicio y Feature Flags
 */

/**
 * @openapi
 * /api/features:
 *   get:
 *     summary: Consultar estado de los Feature Flags y módulos activos
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: Mapa de características habilitadas/deshabilitadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
app.get('/api/features', (req, res) => {
  res.json({
    success: true,
    data: getFeaturesState(),
    message: 'Estado de módulos y características conmutables'
  });
});

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Verificar el estado de salud del servidor
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: Servidor en línea y operativo
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo 404
app.use((req, res, next) => {
  next(new NotFoundError('Endpoint o recurso', `${req.method} ${req.originalUrl}`));
});

// Manejo centralizado de errores
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

export const startServer = async () => {
  try {
    await connectDB();
    await syncDB();

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor debido a un fallo en la conexión a la base de datos:', error.message);
  }
};

startServer();

export default app;
