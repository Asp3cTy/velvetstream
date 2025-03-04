const { queryDatabase } = require('../models/db');

/**
 * Retorna os filmes recomendados para a página inicial.
 * Exemplo: os 10 filmes mais recentes (da tabela "videos").
 */
exports.getHomeMovies = async (req, res) => {
  try {
    const movies = await queryDatabase(
      "SELECT id, title, description, created_at FROM videos ORDER BY created_at DESC LIMIT 10"
    );
    res.json({ movies });
  } catch (error) {
    console.error("Erro ao buscar filmes para home:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Pesquisa filmes usando o parâmetro 'query'.
 */
exports.searchMovies = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Parâmetro de busca 'query' é obrigatório" });
    }
    const movies = await queryDatabase(
      "SELECT id, title, description, created_at FROM videos WHERE title LIKE ? ORDER BY created_at DESC",
      [`%${query}%`]
    );
    res.json({ movies });
  } catch (error) {
    console.error("Erro na pesquisa de filmes:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Retorna os detalhes de um filme.
 */
exports.getMovieDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const movieResult = await queryDatabase("SELECT * FROM videos WHERE id = ?", [id]);
    if (!movieResult || movieResult.length === 0) {
      return res.status(404).json({ error: "Filme não encontrado" });
    }
    res.json({ movie: movieResult[0] });
  } catch (error) {
    console.error("Erro ao buscar detalhes do filme:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};
