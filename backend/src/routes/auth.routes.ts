import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ensureAuthenticated } from '../middlewares/auth.middleware';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/login', authController.login);
authRoutes.get('/me', ensureAuthenticated, authController.me);
authRoutes.patch('/senha', ensureAuthenticated, authController.changePassword);

export { authRoutes };