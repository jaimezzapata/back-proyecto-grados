/**
 * Wrapper para funciones asíncronas en controladores Express.
 * Elimina la necesidad de bloques try/catch repetitivos y canaliza
 * todos los errores automáticamente hacia el middleware centralizado errorHandler.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
