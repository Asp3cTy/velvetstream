const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
  // O token normalmente vem no header "Authorization" no formato "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  // Verifica o token usando a chave secreta
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    // Armazena os dados do usuário decodificados para uso posterior
    req.user = decoded;
    next();
  });
}

module.exports = { authenticateToken };
