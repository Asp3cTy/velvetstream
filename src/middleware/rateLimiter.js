// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Limiter geral: limita 100 requisições por 15 minutos por IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo de 100 requisições por IP
  message: "Muitas requisições, tente novamente mais tarde."
});

// Limiter específico para login: limita 5 tentativas por 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Muitas tentativas de login, por favor aguarde 15 minutos e tente novamente."
});

module.exports = { generalLimiter, loginLimiter };
