const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

// Página inicial com recomendações
router.get('/home', contentController.getHomeContent);

// Pesquisa por filmes/séries (exemplo: /content/search?query=aventura)
router.get('/search', contentController.searchContent);

// Detalhes de um filme/série
router.get('/:id', contentController.getContentDetails);

// Listagem de temporadas de uma série (o id representa o id da série)
router.get('/:id/seasons', contentController.getSeriesSeasons);

// Listagem de episódios de uma série (opcional: use query param 'season' para filtrar por temporada)
// Exemplo: /content/:id/episodes?season=2
router.get('/:id/episodes', contentController.getEpisodes);

module.exports = router;
