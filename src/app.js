const express = require('express');
require('dotenv').config();

const app = express();

app.use(express.json());

// Adicione as rotas de pagamento e webhook
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

app.use('/api/payments', paymentRoutes);
app.use('/', webhookRoutes);

// Registre apenas as rotas restantes (auth, content, etc.)
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const protectedRoutes = require('./routes/protectedRoutes');

app.use('/auth', authRoutes);
app.use('/content', contentRoutes);
app.use('/protected', protectedRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'VelvetStream API está rodando!' });
});

module.exports = app;