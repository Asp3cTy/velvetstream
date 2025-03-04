const express = require('express');
const router = express.Router();

const moviesController = require('../controllers/moviesController');
const seriesController = require('../controllers/seriesController');

// Endpoints para Filmes
router.get('/movies', moviesController.getHomeMovies);        // Lista os filmes (home)
router.get('/movies/search', moviesController.searchMovies);    // Pesquisa filmes
router.get('/movies/:id', moviesController.getMovieDetails);      // Detalhes de um filme

// Endpoints para Séries
router.get('/series', seriesController.getSeries);              // Lista todas as séries
router.get('/series/:id', seriesController.getSeriesDetails);     // Detalhes de uma série
router.get('/series/:id/seasons', seriesController.getSeriesSeasons); // Temporadas da série
router.get('/series/:id/episodes', seriesController.getEpisodes); // Episódios da série (opcionalmente com ?season=)

// Você pode manter também o endpoint /home, se desejar, para exibir recomendações gerais (filmes ou ambos)
router.get('/home', moviesController.getHomeMovies);

module.exports = router;
