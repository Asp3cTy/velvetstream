const express = require('express');
require('dotenv').config();
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./logger'); // Nosso logger configurado com Winston

const app = express();

// Middlewares
app.use(helmet());
app.use(express.json());

// Morgan para logar requisições HTTP (opcional)
app.use(morgan('combined', {
  stream: {
    // Encaminha as mensagens do Morgan para o Winston
    write: (message) => logger.info(message.trim())
  }
}));

// Exemplo de uso do logger no app.js
logger.info("Aplicação iniciada...");

// Rotas da API versão 1
const v1Routes = require('./routes/v1Routes');
app.use('/v1', v1Routes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API está rodando!' });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ message: 'VelvetStream API está rodando!' });
});

module.exports = app;
