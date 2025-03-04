const { queryDatabase } = require('../models/db');

/**
 * Lista todas as séries (dados gerais, da tabela "series").
 */
exports.getSeries = async (req, res) => {
  try {
    const series = await queryDatabase(
      "SELECT id, title, description, poster_url, created_at FROM series ORDER BY created_at DESC"
    );
    res.json({ series });
  } catch (error) {
    console.error("Erro ao buscar séries:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Retorna os detalhes de uma série.
 */
exports.getSeriesDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const seriesResult = await queryDatabase("SELECT * FROM series WHERE id = ?", [id]);
    if (!seriesResult || seriesResult.length === 0) {
      return res.status(404).json({ error: "Série não encontrada" });
    }
    res.json({ series: seriesResult[0] });
  } catch (error) {
    console.error("Erro ao buscar detalhes da série:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Retorna as temporadas de uma série.
 * O parâmetro :id representa o series_id.
 */
exports.getSeriesSeasons = async (req, res) => {
    try {
      const { id } = req.params; // Aqui, "id" é o series_id
      const seasons = await queryDatabase(
        `SELECT s.id, s.season_number, s.title AS season_title, s.description, s.created_at, ser.title AS series_title
         FROM seasons s
         JOIN series ser ON s.series_id = ser.id
         WHERE s.series_id = ?
         ORDER BY s.season_number ASC`,
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
 * caso contrário, retorna todos os episódios ordenados por temporada e episódio.
 */
exports.getEpisodes = async (req, res) => {
    try {
      const seriesId = req.params.id;
      const seasonNumber = req.query.season;
      let queryStr, params;
      if (seasonNumber) {
        queryStr = `SELECT e.id, e.episode_number, e.title, e.created_at, ser.title AS series_title
                    FROM episodes e
                    JOIN series ser ON e.series_id = ser.id
                    WHERE e.series_id = ? AND e.season_number = ?
                    ORDER BY e.episode_number ASC`;
        params = [seriesId, seasonNumber];
      } else {
        queryStr = `SELECT e.id, e.season_number, e.episode_number, e.title, e.created_at, ser.title AS series_title
                    FROM episodes e
                    JOIN series ser ON e.series_id = ser.id
                    WHERE e.series_id = ?
                    ORDER BY e.season_number ASC, e.episode_number ASC`;
        params = [seriesId];
      }
      const episodes = await queryDatabase(queryStr, params);
      res.json({ episodes });
    } catch (error) {
      console.error("Erro ao buscar episódios:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };
  
