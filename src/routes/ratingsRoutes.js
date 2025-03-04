const express = require('express');
const router = express.Router();
const ratingsController = require('../controllers/ratingsController');

// Rota para adicionar ou atualizar avaliação
router.post('/', ratingsController.addOrUpdateRating);

// Rota para obter avaliações de um vídeo específico
router.get('/:video_id', ratingsController.getRatingsForVideo);

module.exports = router;
