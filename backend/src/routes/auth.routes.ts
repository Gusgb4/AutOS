import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ensureAuthenticated } from '../middlewares/auth.middleware';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.get('/me', ensureAuthenticated, authController.me);

export { authRoutes };