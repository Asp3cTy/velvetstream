const { queryDatabase } = require('../models/db');
const crypto = require('crypto');

/**
 * Gera a URL segura para o vídeo utilizando BunnyCDN.
 * Utiliza a BUNNY_STREAM_SECURITY_KEY para criar o hash SHA256 baseado na concatenação:
 * securityKey + videoId + expiration.
 * A URL expira em 1 hora.
 */
const generateBunnyToken = (videoId) => {
  const securityKey = process.env.BUNNY_STREAM_SECURITY_KEY; // Chave privada para gerar o token
  const libraryId = process.env.BUNNY_LIBRARY_ID; // ID da biblioteca, ex: "386908"
  const expiration = Math.floor(Date.now() / 1000) + 3600; // Expira em 1 hora (3600 segundos)

  // Gera o hash SHA256
  const tokenString = `${securityKey}${videoId}${expiration}`;
  const token = crypto.createHash("sha256").update(tokenString).digest("hex");

  // Constrói a URL segura conforme o padrão do BunnyCDN para embed
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expiration}`;
};

/**
 * Retorna uma URL segura para o vídeo para o player.
 * O videoId é recebido via parâmetro (:id).
 */
exports.getSecureVideoUrl = async (req, res) => {
  try {
    const { id } = req.params; // videoId
    // Opcional: você pode buscar detalhes do vídeo na tabela se necessário.
    // Exemplo: const videos = await queryDatabase("SELECT * FROM videos WHERE id = ?", [id]);
    // Se não encontrado, retorne erro 404.
    // Neste exemplo, vamos gerar a URL segura diretamente com o id.

    const secureUrl = generateBunnyToken(id);
    return res.json({ secureUrl });
  } catch (error) {
    console.error("Erro ao obter URL segura do vídeo:", error);
    return res.status(500).json({ error: "Erro interno ao obter URL segura" });
  }
};

/**
 * Salva o progresso do usuário em um vídeo.
 * Espera receber no body: user_id, video_id e progress (tempo assistido em segundos).
 */
exports.saveProgress = async (req, res) => {
  try {
    const { user_id, video_id, progress } = req.body;
    if (!user_id || !video_id || progress === undefined) {
      return res.status(400).json({ error: "user_id, video_id e progress são obrigatórios" });
    }
    // Verifica se já existe registro para este usuário e vídeo
    const rows = await queryDatabase(
      "SELECT * FROM video_progress WHERE user_id = ? AND video_id = ?",
      [user_id, video_id]
    );
    if (rows.length > 0) {
      // Atualiza o registro existente
      await queryDatabase(
        "UPDATE video_progress SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND video_id = ?",
        [progress, user_id, video_id]
      );
    } else {
      // Insere um novo registro
      await queryDatabase(
        "INSERT INTO video_progress (user_id, video_id, progress) VALUES (?, ?, ?)",
        [user_id, video_id, progress]
      );
    }
    return res.json({ message: "Progresso salvo com sucesso" });
  } catch (error) {
    console.error("Erro ao salvar progresso:", error);
    return res.status(500).json({ error: "Erro interno ao salvar progresso" });
  }
};

/**
 * Retorna o progresso salvo do usuário para um vídeo específico.
 * Rota: GET /player/progress/:id, onde :id é o video_id.
 * O user_id deve ser enviado como query parameter.
 */
exports.getProgress = async (req, res) => {
  try {
    const video_id = req.params.id;
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: "Parâmetro user_id é obrigatório" });
    }
    const rows = await queryDatabase(
      "SELECT progress FROM video_progress WHERE user_id = ? AND video_id = ?",
      [user_id, video_id]
    );
    if (rows.length === 0) {
      return res.json({ progress: 0 });
    }
    return res.json({ progress: rows[0].progress });
  } catch (error) {
    console.error("Erro ao obter progresso:", error);
    return res.status(500).json({ error: "Erro interno ao obter progresso" });
  }
};
