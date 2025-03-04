// routes/v1Routes.js
const express = require('express');
const router = express.Router();

const paymentRoutes = require('./paymentRoutes');
const webhookRoutes = require('./webhookRoutes');
const authRoutes = require('./authRoutes');
const contentRoutes = require('./contentRoutes');
const protectedRoutes = require('./protectedRoutes');
const userRoutes = require('./userRoutes');
const playerRoutes = require('./playerRoutes');
const listRoutes = require('./listRoutes');
const ratingsRoutes = require('./ratingsRoutes');
const adminRoutes = require('./adminRoutes');

// Definindo as rotas com seus respectivos prefixos
router.use('/admin', adminRoutes);
router.use('/api/payments', paymentRoutes);
router.use('/webhook', webhookRoutes);
router.use('/auth', authRoutes);
router.use('/content', contentRoutes);
router.use('/protected', protectedRoutes);
router.use('/api/users', userRoutes);
router.use('/player', playerRoutes);
router.use('/lists', listRoutes);
router.use('/ratings', ratingsRoutes);

module.exports = router;
