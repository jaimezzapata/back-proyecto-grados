import { errorResponse } from '../helpers/response.helper.js';
import { AppError } from '../helpers/errors.js';
import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  // Siempre loguear en consola para trazabilidad del desarrollador
  console.error(`[Error Handler] [${req.method}] ${req.originalUrl} ->`, err.name, ':', err.message);

  // 1. Errores operacionales explícitos de la aplicación (AppError y subclases)
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.details, err.errorCode);
  }

  // 2. Errores de validación de esquemas Zod
  if (err instanceof ZodError) {
    const issues = err.issues || err.errors || [];
    const fieldErrors = issues.map(e => ({
      campo: e.path ? e.path.join('.') : 'campo',
      mensaje: e.message,
      codigo: e.code
    }));
    return errorResponse(
      res,
      'Error de validación en los datos de entrada',
      400,
      fieldErrors,
      'VALIDATION_ERROR'
    );
  }

  // 3. Error de JSON mal formado en el body de Express
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(
      res,
      'El cuerpo de la solicitud no es un JSON válido. Revisa las comillas y la sintaxis.',
      400,
      { error_sintaxis: err.message },
      'INVALID_JSON_BODY'
    );
  }

  // 4. Errores de JWT (jsonwebtoken)
  if (err.name === 'TokenExpiredError') {
    return errorResponse(
      res,
      `Su sesión ha expirado a las ${err.expiredAt ? new Date(err.expiredAt).toLocaleTimeString() : 'recientemente'}. Por favor inicie sesión nuevamente.`,
      401,
      { expirado_en: err.expiredAt },
      'TOKEN_EXPIRED'
    );
  }

  if (err.name === 'JsonWebTokenError') {
    return errorResponse(
      res,
      'El token de autenticación es inválido, ha sido alterado o la firma es incorrecta.',
      401,
      { motivo: err.message },
      'TOKEN_INVALID'
    );
  }

  // 5. Errores de carga de archivos (Multer)
  if (err.name === 'MulterError') {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return errorResponse(
          res,
          'El archivo excede el tamaño máximo permitido de 15 MB.',
          400,
          { limite_bytes: 15 * 1024 * 1024 },
          'FILE_TOO_LARGE'
        );
      case 'LIMIT_UNEXPECTED_FILE':
        return errorResponse(
          res,
          `El campo '${err.field || 'archivo'}' no es permitido o se enviaron archivos adicionales no esperados.`,
          400,
          { campo: err.field },
          'UNEXPECTED_FILE_FIELD'
        );
      case 'LIMIT_FILE_COUNT':
        return errorResponse(
          res,
          'Se ha excedido el número máximo de archivos permitidos simultáneamente.',
          400,
          null,
          'TOO_MANY_FILES'
        );
      default:
        return errorResponse(
          res,
          `Error en la gestión de archivos: ${err.message}`,
          400,
          { codigo_multer: err.code },
          'FILE_UPLOAD_ERROR'
        );
    }
  }

  // 6. Errores de Sequelize / Base de Datos
  if (err.name === 'SequelizeUniqueConstraintError') {
    const duplicateFields = err.errors ? err.errors.map(e => ({
      campo: e.path,
      valor: e.value,
      mensaje: `El valor '${e.value}' para el campo '${e.path}' ya se encuentra registrado.`
    })) : [{ mensaje: err.message }];

    return errorResponse(
      res,
      'Conflicto de unicidad: ya existe un registro con uno de los valores ingresados.',
      409,
      duplicateFields,
      'DUPLICATE_ENTRY'
    );
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse(
      res,
      `Violación de clave foránea: La entidad referenciada en la tabla '${err.table || 'relacionada'}' no existe o no tiene integridad en la base de datos.`,
      400,
      { tabla_relacionada: err.table, campo_foraneo: err.index },
      'FOREIGN_KEY_VIOLATION'
    );
  }

  if (err.name === 'SequelizeValidationError') {
    const validationDetails = err.errors ? err.errors.map(e => ({
      campo: e.path,
      mensaje: e.message,
      tipo_validacion: e.validatorKey
    })) : [{ mensaje: err.message }];

    return errorResponse(
      res,
      'Error de validación en el modelo de base de datos.',
      400,
      validationDetails,
      'MODEL_VALIDATION_ERROR'
    );
  }

  if (err.name === 'SequelizeConnectionRefusedError' || err.name === 'SequelizeConnectionError') {
    return errorResponse(
      res,
      'No se pudo establecer conexión con el servidor de base de datos. Verifique si el servicio de base de datos está activo.',
      503,
      { error_tecnico: err.message },
      'DATABASE_CONNECTION_ERROR'
    );
  }

  // 7. Errores no controlados (500)
  const isDevelopment = process.env.NODE_ENV === 'development';
  return errorResponse(
    res,
    isDevelopment ? err.message : 'Ha ocurrido un error inesperado en el servidor. Por favor comuníquese con soporte.',
    err.statusCode || 500,
    isDevelopment ? { stack: err.stack, nombre_error: err.name } : null,
    'INTERNAL_SERVER_ERROR'
  );
};
