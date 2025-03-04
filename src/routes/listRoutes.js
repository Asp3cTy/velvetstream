const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');

// Adiciona um vídeo à lista
router.post('/', listController.addToList);

// Recupera a lista de um usuário
router.get('/:user_id', listController.getList);

// Remove um vídeo da lista
router.delete('/:user_id/:video_id', listController.removeFromList);

module.exports = router;
