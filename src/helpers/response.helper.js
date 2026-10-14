/**
 * Helpers para estandarizar las respuestas de la API REST
 * según los lineamientos de AGENTS.md
 */

export const successResponse = (res, data = {}, message = 'Operación realizada con éxito', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

export const errorResponse = (res, error = 'Error interno del servidor', statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error,
    details
  });
};
