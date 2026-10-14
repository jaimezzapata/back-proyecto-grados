import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { syncDB } from './models/index.js';
import authRoutes from './routers/auth.routes.js';
import courseRoutes from './routers/course.routes.js';
import materialRoutes from './routers/material.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

import { getFeaturesState } from './config/features.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/academic', courseRoutes);
app.use('/api/materials', materialRoutes);

// Estado de Funcionalidades (Feature Flags / Suscripción)
app.get('/api/features', (req, res) => {
  res.json({
    success: true,
    data: getFeaturesState(),
    message: 'Estado de módulos y características conmutables'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`
  });
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
