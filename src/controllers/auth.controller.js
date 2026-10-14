import authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../helpers/response.helper.js';

class AuthController {
  
  async register(req, res) {
    try {
      const newUser = await authService.register(req.body);
      return successResponse(res, newUser, 'Usuario registrado exitosamente', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return successResponse(res, result, 'Inicio de sesión exitoso', 200);
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }
}

export default new AuthController();
