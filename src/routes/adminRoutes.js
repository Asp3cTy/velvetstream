const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

// Aplica autenticação e verificação de admin para todas as rotas abaixo
router.use(authenticateToken, adminOnly);


// Rota pra Dashboard

router.get('/dashboard', adminController.getDashboard);


// Rotas para Filmes
router.post('/movies', adminController.createMovie);
router.put('/movies/:id', adminController.updateMovie);
router.delete('/movies/:id', adminController.deleteMovie);

// Rotas para Séries
router.post('/series', adminController.createSeries);
router.get('/series', adminController.getSeries);
router.get('/series/:id', adminController.getSeriesDetails); // Você pode adicionar esse endpoint se desejar
router.put('/series/:id', adminController.updateSeries);
router.delete('/series/:id', adminController.deleteSeries);

// Rotas para Temporadas
router.post('/series/:series_id/seasons', adminController.createSeason);
router.put('/seasons/:id', adminController.updateSeason);
router.delete('/seasons/:id', adminController.deleteSeason);

// Rotas para Episódios
router.post('/seasons/:season_id/episodes', adminController.createEpisode);
router.put('/episodes/:id', adminController.updateEpisode);
router.delete('/episodes/:id', adminController.deleteEpisode);
router.get('/seasons/:season_id/episodes', adminController.getEpisodesBySeason);

module.exports = router;
