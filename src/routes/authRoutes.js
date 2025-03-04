// authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyTurnstile = require('../middleware/turnstileMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

// Rota de registro com validação do Turnstile
router.post('/register', authController.register);

// Rota de login com validação do Turnstile e rate limiting para login
router.post('/login', loginLimiter, authController.login);

// Outras rotas já existentes
router.post('/refresh-token', authController.refreshToken);
router.delete('/delete', authController.delete);
router.post('/logout', authController.logout);

// Rotas para recuperação de senha
router.post('/forgot-password', verifyTurnstile, authController.forgotPassword);
router.post('/reset-password', verifyTurnstile, authController.resetPassword);

module.exports = router;
