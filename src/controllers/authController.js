const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queryDatabase } = require('../models/db');
require('dotenv').config();

// Função para gerar o token de acesso (válido por 15 minutos)
function generateAccessToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

// Função para gerar o refresh token (válido por 7 dias)
function generateRefreshToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// 📌 **Registro de Usuário**
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        // Usa COUNT(*) para checar se o e-mail já existe
        const existingUser = await queryDatabase("SELECT COUNT(*) as count FROM users WHERE email = ?", [email]);

        // Converte o resultado para número (caso seja string) e checa se é maior que 0
        if (existingUser.length > 0 && parseInt(existingUser[0].count, 10) > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Gera o hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // Insere o novo usuário no banco
        await queryDatabase(
            "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)",
            [userId, name, email, hashedPassword]
        );

        // Gera os tokens JWT
        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        res.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('❌ Erro no registro:', error);
        if (error.message.includes('UNIQUE constraint failed: users.email')) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};






// 📌 **Login do Usuário**
exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("🔍 Dados recebidos:", email, password);
  
      if (!email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }
  
      // Executa a query para buscar o usuário
      const queryResult = await queryDatabase("SELECT * FROM users WHERE email = ?", [email]);
      console.log("🔍 Resultado da query:", queryResult);
  
      // Verifica se a query retornou dados no formato esperado
      if (
        !queryResult ||
        queryResult.length === 0 ||
        !queryResult[0].results ||
        queryResult[0].results.length === 0
      ) {
        return res.status(400).json({ error: 'Credenciais inválidas' });
      }
  
      // Extrai a lista de usuários a partir do objeto retornado
      const users = queryResult[0].results;
      const user = users[0];
      console.log("🔍 user.password no BD:", user.password);
  
      // Compara a senha enviada com a senha armazenada (já hashada)
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Credenciais inválidas' });
      }
  
      // Gera os tokens JWT
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
  
      return res.json({ accessToken, refreshToken });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
  
  

// 📌 **Refresh Token (Renovação de Sessão)**
exports.refreshToken = async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(401).json({ error: 'Token ausente' });
      }
  
      // Verifica se o refresh token é válido usando a chave JWT_REFRESH_SECRET
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: 'Token inválido ou expirado' });
        }
        // Se válido, gera um novo access token com base no ID do usuário decodificado
        const newAccessToken = generateAccessToken(decoded.id);
        return res.json({ accessToken: newAccessToken });
      });
    } catch (error) {
      console.error('Erro no refresh token:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
  