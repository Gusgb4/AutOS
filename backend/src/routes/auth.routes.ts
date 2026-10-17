import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ensureAuthenticated } from '../middlewares/auth.middleware';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const authRoutes = Router();
const authController = new AuthController();
const prisma = new PrismaClient();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.get('/me', ensureAuthenticated, authController.me);

// Rota de alteração de senha (Card 4) resolvida diretamente aqui
authRoutes.patch('/mudar-senha', ensureAuthenticated, async (req: any, res: any) => {
  try {
    const { senha } = req.body;
    const userId = req.user?.id; // ID vindo do token JWT do middleware

    if (!senha || senha.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }

    const hashedPassword = await bcrypt.hash(senha, 8);

    await prisma.user.update({
      where: { id: userId },
      data: {
        senha: hashedPassword,
        trocar_senha: false, // Remove a obrigatoriedade de troca
      },
    });

    return res.json({ message: "Senha alterada com sucesso!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno ao alterar a senha." });
  }
});

export { authRoutes };