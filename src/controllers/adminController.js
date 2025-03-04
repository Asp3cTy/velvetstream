// controllers/adminController.js
const { queryDatabase } = require('../models/db');
const { v4: uuidv4 } = require('uuid');

/* ==========================
   Dashboard e Gerenciamento de Usuários e Pagamentos
========================== */

/**
 * Dashboard com estatísticas básicas.
 */
exports.getDashboard = async (req, res) => {
  try {
    const userCountResult = await queryDatabase("SELECT COUNT(*) as count FROM users");
    const videoCountResult = await queryDatabase("SELECT COUNT(*) as count FROM videos");
    const paymentCountResult = await queryDatabase("SELECT COUNT(*) as count FROM payments");

    res.json({
      totalUsers: userCountResult[0].count,
      totalVideos: videoCountResult[0].count,
      totalPayments: paymentCountResult[0] ? paymentCountResult[0].count : 0
    });
  } catch (error) {
    console.error("Erro no dashboard:", error);
    res.status(500).json({ error: "Erro ao obter dados do dashboard" });
  }
};

/**
 * Lista todos os usuários.
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await queryDatabase("SELECT id, name, email, role, subscription_status, created_at FROM users");
    res.json({ users });
  } catch (error) {
    console.error("Erro ao obter usuários:", error);
    res.status(500).json({ error: "Erro ao obter usuários" });
  }
};

/**
 * Atualiza a role do usuário (ex: promover para admin ou reverter).
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: "Role é obrigatória" });
    }
    await queryDatabase("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ message: "Role do usuário atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar role do usuário:", error);
    res.status(500).json({ error: "Erro ao atualizar role do usuário" });
  }
};

/**
 * Exclui um usuário.
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await queryDatabase("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    res.status(500).json({ error: "Erro ao excluir usuário" });
  }
};

/**
 * Retorna o histórico de pagamentos.
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await queryDatabase("SELECT * FROM payments ORDER BY created_at DESC");
    res.json({ payments });
  } catch (error) {
    console.error("Erro ao buscar histórico de pagamentos:", error);
    res.status(500).json({ error: "Erro ao buscar histórico de pagamentos" });
  }
};

/**
 * Atualiza o status de um pagamento.
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório" });
    }
    await queryDatabase("UPDATE payments SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: "Status do pagamento atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar status do pagamento:", error);
    res.status(500).json({ error: "Erro ao atualizar status do pagamento" });
  }
};

/* ==========================
   Endpoints para Filmes (Tabela "videos")
========================== */

/**
 * Cria um novo filme.
 * Campos obrigatórios: title e video_url.
 */
exports.createMovie = async (req, res) => {
  try {
    const { title, description, category, type, poster_url, video_url } = req.body;
    if (!title || !video_url) {
      return res.status(400).json({ error: "Title e video_url são obrigatórios" });
    }
    const id = uuidv4();
    await queryDatabase(
      "INSERT INTO videos (id, title, description, category, type, poster_url, video_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, title, description || null, category || null, type || null, poster_url || null, video_url]
    );
    res.status(201).json({ message: "Filme criado com sucesso", id });
  } catch (error) {
    console.error("Erro ao criar filme:", error);
    res.status(500).json({ error: "Erro interno ao criar filme" });
  }
};

/**
 * Atualiza um filme existente.
 */
exports.updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, type, poster_url, video_url } = req.body;
    const fields = [];
    const params = [];
    if (title) { fields.push("title = ?"); params.push(title); }
    if (description) { fields.push("description = ?"); params.push(description); }
    if (category) { fields.push("category = ?"); params.push(category); }
    if (type) { fields.push("type = ?"); params.push(type); }
    if (poster_url) { fields.push("poster_url = ?"); params.push(poster_url); }
    if (video_url) { fields.push("video_url = ?"); params.push(video_url); }
    if (fields.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }
    params.push(id);
    const query = `UPDATE videos SET ${fields.join(", ")} WHERE id = ?`;
    await queryDatabase(query, params);
    res.json({ message: "Filme atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar filme:", error);
    res.status(500).json({ error: "Erro interno ao atualizar filme" });
  }
};

/**
 * Exclui um filme.
 */
exports.deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    await queryDatabase("DELETE FROM videos WHERE id = ?", [id]);
    res.json({ message: "Filme excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir filme:", error);
    res.status(500).json({ error: "Erro interno ao excluir filme" });
  }
};

/* ==========================
   Endpoints para Séries, Temporadas e Episódios
========================== */

/**
 * Cria uma nova série (dados gerais).
 * Campos obrigatórios: title e description.
 */
exports.createSeries = async (req, res) => {
  try {
    const { title, description, poster_url } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title e description são obrigatórios" });
    }
    const id = uuidv4();
    await queryDatabase(
      "INSERT INTO series (id, title, description, poster_url) VALUES (?, ?, ?, ?)",
      [id, title, description, poster_url || null]
    );
    res.status(201).json({ message: "Série criada com sucesso", id });
  } catch (error) {
    console.error("Erro ao criar série:", error);
    res.status(500).json({ error: "Erro interno ao criar série" });
  }
};

/**
 * Lista todas as séries.
 */
exports.getSeries = async (req, res) => {
  try {
    const series = await queryDatabase(
      "SELECT id, title, description, poster_url, created_at FROM series ORDER BY created_at DESC"
    );
    res.json({ series });
  } catch (error) {
    console.error("Erro ao buscar séries:", error);
    res.status(500).json({ error: "Erro interno ao buscar séries" });
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
    res.status(500).json({ error: "Erro interno ao buscar detalhes da série" });
  }
};

/**
 * Atualiza uma série.
 */
exports.updateSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, poster_url } = req.body;
    const fields = [];
    const params = [];
    if (title) { fields.push("title = ?"); params.push(title); }
    if (description) { fields.push("description = ?"); params.push(description); }
    if (poster_url) { fields.push("poster_url = ?"); params.push(poster_url); }
    if (fields.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }
    params.push(id);
    const query = `UPDATE series SET ${fields.join(", ")} WHERE id = ?`;
    await queryDatabase(query, params);
    res.json({ message: "Série atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar série:", error);
    res.status(500).json({ error: "Erro interno ao atualizar série" });
  }
};

/**
 * Exclui uma série.
 */
exports.deleteSeries = async (req, res) => {
  try {
    const { id } = req.params;
    await queryDatabase("DELETE FROM series WHERE id = ?", [id]);
    res.json({ message: "Série excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir série:", error);
    res.status(500).json({ error: "Erro interno ao excluir série" });
  }
};

/**
 * Cria uma nova temporada para uma série.
 * Rota: POST /admin/series/:series_id/seasons
 * Expects: season_number, title, description (opcional)
 */
exports.createSeason = async (req, res) => {
  try {
    const { series_id } = req.params;
    const { season_number, title, description } = req.body;
    if (!season_number || !title) {
      return res.status(400).json({ error: "season_number e title são obrigatórios" });
    }
    const id = uuidv4();
    await queryDatabase(
      "INSERT INTO seasons (id, series_id, season_number, title, description) VALUES (?, ?, ?, ?, ?)",
      [id, series_id, season_number, title, description || null]
    );
    res.status(201).json({ message: "Temporada criada com sucesso", id });
  } catch (error) {
    console.error("Erro ao criar temporada:", error);
    res.status(500).json({ error: "Erro interno ao criar temporada" });
  }
};

/**
 * Atualiza uma temporada.
 */
exports.updateSeason = async (req, res) => {
  try {
    const { id } = req.params;
    const { season_number, title, description } = req.body;
    const fields = [];
    const params = [];
    if (season_number) { fields.push("season_number = ?"); params.push(season_number); }
    if (title) { fields.push("title = ?"); params.push(title); }
    if (description) { fields.push("description = ?"); params.push(description); }
    if (fields.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }
    params.push(id);
    const query = `UPDATE seasons SET ${fields.join(", ")} WHERE id = ?`;
    await queryDatabase(query, params);
    res.json({ message: "Temporada atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar temporada:", error);
    res.status(500).json({ error: "Erro interno ao atualizar temporada" });
  }
};

/**
 * Exclui uma temporada.
 */
exports.deleteSeason = async (req, res) => {
  try {
    const { id } = req.params;
    await queryDatabase("DELETE FROM seasons WHERE id = ?", [id]);
    res.json({ message: "Temporada excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir temporada:", error);
    res.status(500).json({ error: "Erro interno ao excluir temporada" });
  }
};

/**
 * Cria um novo episódio para uma temporada.
 * Rota: POST /admin/seasons/:season_id/episodes
 * Expects: episode_number, title, description, video_url, duration
 */
exports.createEpisode = async (req, res) => {
    try {
      const { season_id } = req.params;
      const { episode_number, title, description, video_url, duration } = req.body;
      if (!season_id || !episode_number || !title || !video_url || !duration) {
        return res.status(400).json({ error: "Campos obrigatórios: season_id, episode_number, title, video_url, duration" });
      }
      const id = uuidv4();
      await queryDatabase(
        "INSERT INTO episodes (id, season_id, episode_number, title, description, video_url, duration) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, season_id, episode_number, title, description || null, video_url, duration]
      );
      res.status(201).json({ message: "Episódio criado com sucesso", id });
    } catch (error) {
      console.error("Erro ao criar episódio:", error);
      res.status(500).json({ error: "Erro interno ao criar episódio" });
    }
  };
  

/**
 * Atualiza um episódio.
 */
exports.updateEpisode = async (req, res) => {
  try {
    const { id } = req.params;
    const { episode_number, title, description, video_url, duration } = req.body;
    const fields = [];
    const params = [];
    if (episode_number) { fields.push("episode_number = ?"); params.push(episode_number); }
    if (title) { fields.push("title = ?"); params.push(title); }
    if (description) { fields.push("description = ?"); params.push(description); }
    if (video_url) { fields.push("video_url = ?"); params.push(video_url); }
    if (duration) { fields.push("duration = ?"); params.push(duration); }
    if (fields.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }
    params.push(id);
    const query = `UPDATE episodes SET ${fields.join(", ")} WHERE id = ?`;
    await queryDatabase(query, params);
    res.json({ message: "Episódio atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar episódio:", error);
    res.status(500).json({ error: "Erro interno ao atualizar episódio" });
  }
};

/**
 * Exclui um episódio.
 */
exports.deleteEpisode = async (req, res) => {
  try {
    const { id } = req.params;
    await queryDatabase("DELETE FROM episodes WHERE id = ?", [id]);
    res.json({ message: "Episódio excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir episódio:", error);
    res.status(500).json({ error: "Erro interno ao excluir episódio" });
  }
};

/**
 * Lista todos os episódios de uma temporada.
 * Rota: GET /admin/seasons/:season_id/episodes
 */
exports.getEpisodesBySeason = async (req, res) => {
    try {
      const { season_id } = req.params;
      // Busca os episódios usando a coluna season_id
      const episodes = await queryDatabase(
        "SELECT * FROM episodes WHERE season_id = ? ORDER BY episode_number ASC",
        [season_id]
      );
      res.json({ episodes });
    } catch (error) {
      console.error("Erro ao buscar episódios da temporada:", error);
      res.status(500).json({ error: "Erro interno ao buscar episódios da temporada" });
    }
  };
  
