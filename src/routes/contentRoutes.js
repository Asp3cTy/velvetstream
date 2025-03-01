const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

// Rota para listar vídeos da home
router.get('/home', contentController.getHomeContent);

// Rota para buscar vídeos por título (usando parâmetro de query "q")
router.get('/search', contentController.searchContent);

// Rota para obter detalhes de um vídeo específico
router.get('/:id', contentController.getContentDetails);

// Rotas para séries (apenas se houver suporte para temporadas/episódios)
// Lista as temporadas de uma série
router.get('/:id/seasons', contentController.getSeriesSeasons);

// Lista os episódios de uma temporada específica de uma série
router.get('/:id/seasons/:seasonNumber/episodes', contentController.getSeasonEpisodes);

module.exports = router;
