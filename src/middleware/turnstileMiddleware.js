// middleware/turnstileMiddleware.js
const axios = require('axios');

const verifyTurnstile = async (req, res, next) => {
  // O front-end deve enviar o token do Turnstile no campo "cf-turnstile-response"
  const token = req.body['cf-turnstile-response'];
  if (!token) {
    return res.status(400).json({ error: 'Token do Turnstile ausente' });
  }

  try {
    const secret = process.env.TURNSTILE_SECRET;
    const remoteip = req.ip; // IP do usuário
    const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    // Monta os parâmetros para envio
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    params.append('remoteip', remoteip);

    // Faz a requisição para verificar o token
    const response = await axios.post(verifyUrl, params);
    if (response.data.success) {
      // Token válido, continua para o próximo middleware ou endpoint
      return next();
    } else {
      return res.status(400).json({
        error: 'Falha na verificação do Turnstile',
        details: response.data
      });
    }
  } catch (error) {
    console.error("Erro ao verificar Turnstile:", error);
    return res.status(500).json({ error: "Erro interno na verificação do Turnstile" });
  }
};

module.exports = verifyTurnstile;
