const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const protectedRoutes = require('./routes/protectedRoutes');

app.use('/api/payments', paymentRoutes);
app.use('/webhook', webhookRoutes);
app.use('/auth', authRoutes);
app.use('/content', contentRoutes);
app.use('/protected', protectedRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'VelvetStream API está rodando!' });
});

module.exports = app;