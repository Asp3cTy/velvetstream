// Modifications Log:
// 1. No changes to the queryDatabase function aside from using the same "?" placeholders since params are passed as an array.
// 2. Detailed response logging is maintained.
const { fetch } = require('undici');
require('dotenv').config();

const D1_URL = process.env.D1_URL;
const D1_AUTH = process.env.D1_AUTH;

async function queryDatabase(query, params = []) {
  try {
    const response = await fetch(D1_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${D1_AUTH}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: query, params })
    });
    const result = await response.json();
    console.log("🔍 [DB] Query response:", result);
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors.map((err) => err.message).join(', '));
    }
    if (result && Array.isArray(result.results) && result.results.length > 0) {
      return result.results;
    } else {
      return null;
    }
  } catch (error) {
    console.error("❌ Erro ao conectar ao Cloudflare D1:", error);
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
  return result ? result[0] : null;
};

const getUserById = async (id) => {
  const result = await queryDatabase("SELECT * FROM users WHERE id = ?", [id]);
  console.log("🔍 [DB] getUserById result:", JSON.stringify(result));
  return result ? result[0] : null;
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

module.exports = {
  initializeDatabase,
  queryDatabase,
  getUserByEmail,
  getUserById,
  createUser,
  updateUserStatus,
  deleteUserByEmail
};