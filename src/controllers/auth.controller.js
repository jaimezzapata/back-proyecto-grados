import authService from '../services/auth.service.js';
import { successResponse } from '../helpers/response.helper.js';

class AuthController {
  
  async register(req, res, next) {
    try {
      const newUser = await authService.register(req.body);
      return successResponse(res, newUser, 'Usuario registrado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return successResponse(res, result, 'Inicio de sesión exitoso', 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
