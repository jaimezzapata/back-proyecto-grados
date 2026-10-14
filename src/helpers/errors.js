/**
 * Jerarquía de Errores de Dominio de la Aplicación
 * Proporciona mensajes claros, precisos y códigos HTTP exactos.
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'La solicitud contiene datos inválidos o incompletos', details = null) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado: se requiere un token de acceso válido', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado: no tiene permisos para realizar esta acción o el recurso no le pertenece', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(recurso = 'Recurso', identificador = null) {
    const msg = identificador 
      ? `${recurso} con identificador '${identificador}' no fue encontrado en el sistema`
      : `${recurso} no fue encontrado en el sistema`;
    super(msg, 404, 'NOT_FOUND', { recurso, identificador });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto: el registro o dato ya existe en el sistema', details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Error en los datos de entrada', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(servicio = 'Servicio Externo', message = 'El servicio externo no respondió adecuadamente', details = null) {
    super(`Fallo en ${servicio}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}
