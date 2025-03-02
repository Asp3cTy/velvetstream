const { fetch } = require('undici');
require('dotenv').config();

const D1_URL = process.env.D1_URL;
const D1_AUTH = process.env.D1_AUTH;

/**
 * Executa a query SQL contra o Cloudflare D1.
 * Adicionamos logs extras e ajustamos o parsing do JSON para extrair os resultados corretamente.
 */
async function queryDatabase(query, params = []) {
  console.log("Executando SQL:", query);
  console.log("Com parâmetros:", params);
  try {
    const response = await fetch(D1_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${D1_AUTH}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: query, params })
    });
    // Loga o response raw para depuração
    const rawText = await response.text();
    console.log("Raw DB response text:", rawText);
    let result;
    try {
      result = JSON.parse(rawText);
    } catch (err) {
      throw new Error("Falha ao converter resposta do DB para JSON: " + rawText);
    }
    console.log("Parsed DB result:", result);
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors.map((err) => err.message).join(', '));
    }
    
    // Ajusta para extrair os resultados de acordo com a estrutura retornada pelo D1
    if (result.result && Array.isArray(result.result) && result.result.length > 0) {
      if (result.result[0].results && Array.isArray(result.result[0].results)) {
        return result.result[0].results;
      }
    }
    
    return [];
  } catch (error) {
    console.error("❌ Erro na query do DB:", error);
    throw error;
  }
}

const initializeDatabase = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      subscription_status TEXT NOT NULL CHECK (subscription_status IN ('active', 'expired', 'pending')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS seasons (
      id TEXT PRIMARY KEY,
      series_id TEXT NOT NULL,
      season_number INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS episodes (
      id TEXT PRIMARY KEY,
      series_id TEXT NOT NULL,
      season_number INTEGER NOT NULL,
      episode_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ];
  for (const query of queries) {
    await queryDatabase(query);
  }
};

const getUserByEmail = async (email) => {
  const result = await queryDatabase("SELECT * FROM users WHERE email = ?", [email]);
  console.log("🔍 [DB] getUserByEmail result:", JSON.stringify(result));
  return result.length > 0 ? result[0] : null;
};

const getUserById = async (id) => {
  const result = await queryDatabase("SELECT * FROM users WHERE id = ?", [id]);
  console.log("🔍 [DB] getUserById result:", JSON.stringify(result));
  return result.length > 0 ? result[0] : null;
};

const createUser = async (name, email, password, role, subscription_status) => {
  const id = generateId();
  await queryDatabase(
    "INSERT INTO users (id, name, email, password, role, subscription_status) VALUES (?, ?, ?, ?, ?, ?)",
    [id, name, email, password, role, subscription_status]
  );
  return id;
};

const updateUserStatus = async (userId, status) => {
  await queryDatabase("UPDATE users SET subscription_status = ? WHERE id = ?", [status, userId]);
};

const deleteUserByEmail = async (email) => {
  await queryDatabase("DELETE FROM users WHERE email = ?", [email]);
};

const generateId = () => {
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16));
};

// Função para atualizar o preapproval_id do usuário no banco de dados
const savePreapprovalId = async (userId, preapprovalId) => {
  try {
    await queryDatabase("UPDATE users SET mp_preapproval_id = ? WHERE id = ?", [preapprovalId, userId]);
    console.log(`Preapproval_id ${preapprovalId} salvo para o user ${userId}`);
  } catch (error) {
    console.error(`Erro ao salvar preapproval_id para o usuário ${userId}:`, error);
    throw error;
  }
};

// Resetar a Senha do
const updateUserPassword = async (userId, hashedPassword) => {
  try {
    await queryDatabase("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);
    console.log(`Senha atualizada para o usuário ${userId}`);
  } catch (error) {
    console.error(`Erro ao atualizar senha para o usuário ${userId}:`, error);
    throw error;
  }
};

module.exports = {
  initializeDatabase,
  queryDatabase,
  getUserByEmail,
  getUserById,
  createUser,
  updateUserStatus,
  deleteUserByEmail,
  savePreapprovalId,
  updateUserPassword  // Exporta a nova função
};




