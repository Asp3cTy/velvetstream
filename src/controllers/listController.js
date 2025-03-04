const { queryDatabase } = require('../models/db');

/**
 * Adiciona um vídeo à "Minha Lista" do usuário.
 * Expects JSON body with: user_id, video_id.
 */
exports.addToList = async (req, res) => {
  try {
    const { user_id, video_id } = req.body;
    if (!user_id || !video_id) {
      return res.status(400).json({ error: 'user_id e video_id são obrigatórios' });
    }
    // Verifica se o item já está na lista
    const exists = await queryDatabase(
      "SELECT * FROM user_list WHERE user_id = ? AND video_id = ?",
      [user_id, video_id]
    );
    if (exists && exists.length > 0) {
      return res.status(400).json({ error: 'Vídeo já está na sua lista' });
    }
    await queryDatabase(
      "INSERT INTO user_list (user_id, video_id) VALUES (?, ?)",
      [user_id, video_id]
    );
    res.json({ message: 'Vídeo adicionado à lista com sucesso' });
  } catch (error) {
    console.error("Erro ao adicionar à lista:", error);
    res.status(500).json({ error: 'Erro interno ao adicionar à lista' });
  }
};

/**
 * Retorna a lista de vídeos salvos para o usuário.
 * Rota: GET /lists/:user_id
 */
exports.getList = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }
    const list = await queryDatabase(
      "SELECT video_id, created_at FROM user_list WHERE user_id = ? ORDER BY created_at DESC",
      [user_id]
    );
    res.json({ list });
  } catch (error) {
    console.error("Erro ao buscar a lista:", error);
    res.status(500).json({ error: 'Erro interno ao buscar a lista' });
  }
};

/**
 * Remove um vídeo da "Minha Lista" do usuário.
 * Rota: DELETE /lists/:user_id/:video_id
 */
exports.removeFromList = async (req, res) => {
  try {
    const { user_id, video_id } = req.params;
    if (!user_id || !video_id) {
      return res.status(400).json({ error: 'user_id e video_id são obrigatórios' });
    }
    await queryDatabase(
      "DELETE FROM user_list WHERE user_id = ? AND video_id = ?",
      [user_id, video_id]
    );
    res.json({ message: 'Vídeo removido da lista com sucesso' });
  } catch (error) {
    console.error("Erro ao remover da lista:", error);
    res.status(500).json({ error: 'Erro interno ao remover da lista' });
  }
};
