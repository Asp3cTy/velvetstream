// src/server.js
const app = require('./app');

// Inicializar o banco de dados, se necessário
const db = require('./models/db');
db.initializeDatabase();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
