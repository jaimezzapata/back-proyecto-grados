import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { validateSchema, registerSchema, loginSchema } from '../middlewares/validate.middleware.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Autenticación
 *   description: Endpoints para registro e inicio de sesión de docentes y administradores
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo docente
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuario registrado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Error de validación o correo ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  '/register',
  validateSchema(registerSchema),
  authController.register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión y obtener token JWT
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso con token JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Credenciales incorrectas o usuario inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  '/login',
  validateSchema(loginSchema),
  authController.login
);

export default router;
