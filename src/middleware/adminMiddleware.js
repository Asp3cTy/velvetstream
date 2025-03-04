// middleware/adminMiddleware.js
function adminOnly(req, res, next) {
    // Assume que o authMiddleware já populou req.user
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ error: "Acesso negado. Área restrita para administradores." });
  }
  
  module.exports = { adminOnly };
  