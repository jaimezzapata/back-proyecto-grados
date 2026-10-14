import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { validateSchema, registerSchema, loginSchema } from '../middlewares/validate.middleware.js';

const router = Router();

router.post(
  '/register',
  validateSchema(registerSchema),
  authController.register
);

router.post(
  '/login',
  validateSchema(loginSchema),
  authController.login
);

export default router;
