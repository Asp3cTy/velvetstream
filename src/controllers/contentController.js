const { queryDatabase } = require('../models/db');

// 1. Listar todos os vídeos para a home (ordenados pela data de criação, mais recentes primeiro)
exports.getHomeContent = async (req, res) => {
  try {
    const videos = await queryDatabase("SELECT * FROM videos ORDER BY created_at DESC", []);
    return res.json({ videos });
  } catch (error) {
    console.error("Erro ao obter conteúdo home:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// 2. Buscar vídeos por título (utilizando parâmetro de query "q")
exports.searchContent = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Parâmetro de busca 'q' é obrigatório" });
    }
    // Usa LIKE para buscar vídeos cujo título contenha o termo pesquisado
    const videos = await queryDatabase(
      "SELECT * FROM videos WHERE title LIKE ? ORDER BY created_at DESC",
      [`%${q}%`]
    );
    return res.json({ videos });
  } catch (error) {
    console.error("Erro ao buscar conteúdo:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// 3. Obter detalhes de um vídeo específico pelo ID
exports.getContentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID é obrigatório" });
    }
    const detailsResult = await queryDatabase("SELECT * FROM videos WHERE id = ?", [id]);
    // Supondo que a função queryDatabase retorne os dados de forma aninhada (por exemplo, em results)
    // Se a estrutura for diferente, ajuste conforme necessário.
    let video;
    if (detailsResult.length > 0 && detailsResult[0].results && detailsResult[0].results.length > 0) {
      video = detailsResult[0].results[0];
    } else {
      // Caso a queryDatabase já retorne diretamente um array
      video = detailsResult[0];
    }
    if (!video) {
      return res.status(404).json({ error: "Conteúdo não encontrado" });
    }
    return res.json({ video });
  } catch (error) {
    console.error("Erro ao obter detalhes do conteúdo:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// 4. Listar temporadas de uma série (assumindo que há uma tabela "seasons" com, por exemplo, os campos season_number e series_id)
exports.getSeriesSeasons = async (req, res) => {
  try {
    const { id } = req.params; // 'id' aqui se refere ao ID da série
    if (!id) {
      return res.status(400).json({ error: "ID da série é obrigatório" });
    }
    const seasons = await queryDatabase(
      "SELECT * FROM seasons WHERE series_id = ? ORDER BY season_number ASC",
      [id]
    );
    return res.json({ seasons });
  } catch (error) {
    console.error("Erro ao obter temporadas:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// 5. Listar episódios de uma temporada específica de uma série
exports.getSeasonEpisodes = async (req, res) => {
    try {
      const { id, seasonNumber } = req.params; // 'id' é o ID da série
      if (!id || !seasonNumber) {
        return res.status(400).json({ error: "ID da série e número da temporada são obrigatórios" });
      }
      const episodes = await queryDatabase(
        "SELECT * FROM episodes WHERE series_id = ? AND season_number = ? ORDER BY episode_number ASC",
        [id, seasonNumber]
      );
      return res.json({ episodes });
    } catch (error) {
      console.error("Erro ao obter episódios:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  };
  
