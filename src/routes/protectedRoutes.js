const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// Rota protegida: somente acessível com um token válido
router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({
    message: 'Bem-vindo ao Dashboard protegido!',
    userId: req.user.id
  });
});

module.exports = router;
