const app = require('./app');
const db = require('./models/db');

// Inicializar o banco de dados
db.initializeDatabase()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao inicializar o banco de dados:', error);
  });