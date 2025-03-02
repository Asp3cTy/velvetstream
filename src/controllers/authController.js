// authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queryDatabase } = require('../models/db');
require('dotenv').config();

function generateAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    email = email.trim().toLowerCase();
    const existingUserResult = await queryDatabase(
      "SELECT COUNT(*) as count FROM users WHERE email = ?",
      [email]
    );
    console.log("🔍 [REGISTER] Query (COUNT) result:", existingUserResult);
    const existingUserCount =
      existingUserResult && existingUserResult[0] ? Number(existingUserResult[0].count) : 0;
    if (existingUserCount > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    await queryDatabase(
      "INSERT INTO users (id, name, email, password, role, subscription_status) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, name, email, hashedPassword, 'user', 'pending']
    );
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso',
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('❌ Erro no registro:', error);
    if (error.message.includes('UNIQUE constraint failed: users.email')) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    email = email.trim().toLowerCase();
    const queryResult = await queryDatabase("SELECT * FROM users WHERE email = ?", [email]);
    console.log("🔍 [LOGIN] Query result:", queryResult);
    if (!queryResult || queryResult.length === 0) {
      console.log("🔍 [LOGIN] No user found for email:", email);
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }
    const user = queryResult[0];
    console.log("🔍 [LOGIN] User found:", user);
    console.log("🔍 [LOGIN] Comparing passwords: Input:", password, "Stored Hash:", user.password);
    if (!user.password) {
      return res.status(500).json({ error: 'Erro ao buscar senha do usuário' });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log("🔍 [LOGIN] Password mismatch.");
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    return res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Token ausente' });
    }
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
      }
      const newAccessToken = generateAccessToken(decoded.id);
      return res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error('Erro no refresh token:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.delete = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    email = email.trim().toLowerCase();
    const existingUser = await queryDatabase("SELECT * FROM users WHERE email = ?", [email]);
    if (!existingUser || existingUser.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    await queryDatabase("DELETE FROM users WHERE email = ?", [email]);
    return res.status(200).json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error(`❌ Erro ao excluir usuário: ${error}`);
    return res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
};

exports.logout = async (req, res) => {
  return res.json({ message: "Logout realizado com sucesso" });
};

/**
 * Endpoint para solicitar recuperação de senha.
 * Se o email existir, gera um token de reset com expiração curta.
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }
    // Procura o usuário pelo email usando queryDatabase
    const userResult = await queryDatabase("SELECT * FROM users WHERE email = ?", [email.trim().toLowerCase()]);
    const user = userResult && userResult.length > 0 ? userResult[0] : null;
    if (!user) {
      // Para segurança, não informe se o usuário não existe
      return res.status(200).json({ message: "Se o email existir, instruções serão enviadas." });
    }
    // Gera um token de reset (usando o user.id como payload)
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_RESET_SECRET,
      { expiresIn: process.env.JWT_RESET_EXPIRES_IN || "1h" }
    );
    // Em produção, você enviaria esse token por email para o usuário.
    // Aqui, para testes, retornamos o token na resposta.
    return res.json({
      message: "Token de recuperação de senha gerado. Use-o para resetar a senha.",
      resetToken
    });
  } catch (error) {
    console.error("Erro em forgotPassword:", error);
    res.status(500).json({ error: "Erro ao processar a recuperação de senha" });
  }
};

/**
 * Endpoint para resetar a senha.
 * Recebe o token de reset e a nova senha, verifica o token e atualiza a senha do usuário.
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
    }
    // Verifica o token de reset
    jwt.verify(token, process.env.JWT_RESET_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
      }
      const userId = decoded.id;
      // Gera hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      // Atualiza a senha do usuário no banco
      await queryDatabase("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);
      return res.json({ message: "Senha resetada com sucesso" });
    });
  } catch (error) {
    console.error("Erro em resetPassword:", error);
    res.status(500).json({ error: "Erro ao resetar a senha" });
  }
};
