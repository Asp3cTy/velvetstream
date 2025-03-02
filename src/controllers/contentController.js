const { queryDatabase } = require('../models/db');

/**
 * Retorna destaques e recomendações para a página inicial.
 * Exemplo: retorna os 10 vídeos mais recentes.
 */
exports.getHomeContent = async (req, res) => {
  try {
    const videos = await queryDatabase(
      "SELECT id, title, description, created_at FROM videos ORDER BY created_at DESC LIMIT 10"
    );
    res.json({ videos });
  } catch (error) {
    console.error("Erro ao buscar conteúdo home:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Pesquisa por filmes/séries usando o parâmetro 'query'.
 */
exports.searchContent = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Parâmetro de busca 'query' é obrigatório" });
    }
    const videos = await queryDatabase(
      "SELECT id, title, description, created_at FROM videos WHERE title LIKE ? ORDER BY created_at DESC",
      [`%${query}%`]
    );
    res.json({ videos });
  } catch (error) {
    console.error("Erro na pesquisa de conteúdo:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Retorna detalhes de um filme/série (sinopse, trailer, avaliações, etc.).
 */
exports.getContentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const videoResult = await queryDatabase("SELECT * FROM videos WHERE id = ?", [id]);
    if (!videoResult || videoResult.length === 0) {
      return res.status(404).json({ error: "Conteúdo não encontrado" });
    }
    res.json({ video: videoResult[0] });
  } catch (error) {
    console.error("Erro ao buscar detalhes do conteúdo:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Retorna as temporadas de uma série.
 * O parâmetro id representa o id da série.
 */
exports.getSeriesSeasons = async (req, res) => {
  try {
    const { id } = req.params;
    const seasons = await queryDatabase(
      "SELECT id, season_number, created_at FROM seasons WHERE series_id = ? ORDER BY season_number ASC",
      [id]
    );
    res.json({ seasons });
  } catch (error) {
    console.error("Erro ao buscar temporadas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Retorna os episódios de uma série.
 * Se o query param "season" for fornecido, filtra os episódios daquela temporada;
 * caso contrário, retorna todos os episódios ordenados por temporada e número.
 */
exports.getEpisodes = async (req, res) => {
  try {
    const seriesId = req.params.id;
    const seasonNumber = req.query.season;
    let queryStr, params;
    if (seasonNumber) {
      queryStr = "SELECT id, episode_number, title, created_at FROM episodes WHERE series_id = ? AND season_number = ? ORDER BY episode_number ASC";
      params = [seriesId, seasonNumber];
    } else {
      queryStr = "SELECT id, season_number, episode_number, title, created_at FROM episodes WHERE series_id = ? ORDER BY season_number ASC, episode_number ASC";
      params = [seriesId];
    }
    const episodes = await queryDatabase(queryStr, params);
    res.json({ episodes });
  } catch (error) {
    console.error("Erro ao buscar episódios:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};
