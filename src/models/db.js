// src/models/db.js
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

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors.map(err => err.message).join(', '));
    }

    return result.result || [];
  } catch (error) {
    console.error("❌ Erro ao conectar ao Cloudflare D1:", error);
    throw error;
  }
}

module.exports = { queryDatabase };
