import jwt from 'jsonwebtoken';
import { errorResponse } from '../helpers/response.helper.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return errorResponse(res, 'Token de autenticación no proporcionado', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 'Token inválido o expirado', 401, error.message);
  }
};

export const requireRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return errorResponse(res, 'Usuario no autenticado', 401);
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return errorResponse(res, 'Acceso denegado: permisos insuficientes', 403);
    }

    next();
  };
};
