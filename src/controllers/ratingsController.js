const { queryDatabase } = require('../models/db');

/**
 * Adiciona ou atualiza uma avaliação para um vídeo.
 * Recebe no body: user_id, video_id, rating, like e comment (opcional).
 */
exports.addOrUpdateRating = async (req, res) => {
  try {
    const { user_id, video_id, rating, like, comment } = req.body;
    if (!user_id || !video_id || rating === undefined) {
      return res.status(400).json({ error: "user_id, video_id e rating são obrigatórios" });
    }
    // Verifica se já existe uma avaliação para esse usuário e vídeo
    const existing = await queryDatabase(
      "SELECT * FROM ratings WHERE user_id = ? AND video_id = ?",
      [user_id, video_id]
    );
    if (existing && existing.length > 0) {
      // Atualiza a avaliação existente
      await queryDatabase(
        "UPDATE ratings SET rating = ?, `like` = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND video_id = ?",
        [rating, like, comment || null, user_id, video_id]
      );
      return res.json({ message: "Avaliação atualizada com sucesso" });
    } else {
      // Insere uma nova avaliação
      await queryDatabase(
        "INSERT INTO ratings (user_id, video_id, rating, `like`, comment) VALUES (?, ?, ?, ?, ?)",
        [user_id, video_id, rating, like, comment || null]
      );
      return res.json({ message: "Avaliação criada com sucesso" });
    }
  } catch (error) {
    console.error("Erro ao salvar avaliação:", error);
    return res.status(500).json({ error: "Erro interno ao salvar avaliação" });
  }
};

/**
 * Retorna todas as avaliações de um vídeo e calcula a média de rating.
 * Rota: GET /ratings/:video_id
 */
exports.getRatingsForVideo = async (req, res) => {
  try {
    const { video_id } = req.params;
    const ratings = await queryDatabase(
      "SELECT user_id, rating, `like`, comment, created_at FROM ratings WHERE video_id = ?",
      [video_id]
    );
    let average = 0;
    if (ratings && ratings.length > 0) {
      const total = ratings.reduce((sum, r) => sum + Number(r.rating), 0);
      average = total / ratings.length;
    }
    return res.json({ ratings, average });
  } catch (error) {
    console.error("Erro ao obter avaliações:", error);
    return res.status(500).json({ error: "Erro interno ao obter avaliações" });
  }
};
