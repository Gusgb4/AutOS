import rateLimit from "express-rate-limit";

const JANELA_MINUTOS = 15;
const MAX_TENTATIVAS = 10;

// Limita tentativas de login por IP. Só conta as que falharam
// (skipSuccessfulRequests), para que logins corretos não travem a oficina,
// onde várias pessoas costumam sair pelo mesmo IP.
export const loginRateLimiter = rateLimit({
  windowMs: JANELA_MINUTOS * 60 * 1000,
  limit: MAX_TENTATIVAS,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      erro: `Muitas tentativas de login. Tente novamente em ${JANELA_MINUTOS} minutos.`,
    });
  },
});