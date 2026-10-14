import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../helpers/errors.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError(
      'Encabezado de autorización ausente: debe proporcionar un token Bearer en el encabezado Authorization (ej. Bearer <token>).'
    ));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Será interceptado por errorHandler (TokenExpiredError o JsonWebTokenError)
    next(error);
  }
};

export const requireRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return next(new UnauthorizedError(
        'Sesión no autenticada: se requiere autenticación para acceder a este recurso.'
      ));
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return next(new ForbiddenError(
        `Acceso denegado: su rol actual ('${req.user.rol}') no tiene privilegios suficientes para este endpoint. Roles permitidos: [${rolesPermitidos.join(', ')}].`,
        { rol_usuario: req.user.rol, roles_requeridos: rolesPermitidos }
      ));
    }

    next();
  };
};
