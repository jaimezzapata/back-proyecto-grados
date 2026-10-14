import { errorResponse } from '../helpers/response.helper.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);

  // Error de Multer (ej. archivo muy grande)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'El archivo excede el tamaño máximo permitido (15 MB)', 400);
    }
    return errorResponse(res, `Error en la subida del archivo: ${err.message}`, 400);
  }

  // Error de Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
    return errorResponse(res, `Conflicto de unicidad: ${fields}`, 409);
  }

  if (err.name === 'SequelizeValidationError') {
    const fields = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
    return errorResponse(res, `Error de validación del modelo: ${fields}`, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};
