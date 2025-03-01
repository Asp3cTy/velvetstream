// Modifications Log:
// 1. Reverted all SQL parameter placeholders back to "?".
// 2. Now both registration and login queries use the "?" placeholder consistently.
// 3. Detailed debug logs remain to show query results and password comparisons.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queryDatabase } = require('../models/db');
require('dotenv').config();

// Function to generate access token (valid for 15 minutes)
function generateAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

// Function to generate refresh token (valid for 7 days)
function generateRefreshToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// Register User
exports.register = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    // Force email to lowercase and trim spaces
    email = email.trim().toLowerCase();

    // Check if the email already exists using "?" placeholders.
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
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    // Insert the new user into the database using "?" placeholders.
    await queryDatabase(
      "INSERT INTO users (id, name, email, password, role, subscription_status) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, name, email, hashedPassword, 'user', 'pending']
    );
    // Generate tokens
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

// Login User
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    // Force email to lowercase and trim spaces
    email = email.trim().toLowerCase();

    // Fetch the user using "?" placeholders.
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

// Refresh Token (Session Renewal)
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

// Delete User (optional)
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