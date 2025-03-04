const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

// Retorna a URL segura do vídeo para o player
router.get('/:id', playerController.getSecureVideoUrl);

// Salva o progresso do usuário no vídeo
router.post('/progress', playerController.saveProgress);

// Retorna o progresso salvo do usuário para um vídeo específico
router.get('/progress/:id', playerController.getProgress);

module.exports = router;
