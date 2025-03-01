const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create_preference', paymentController.createPreference);
router.get('/success', paymentController.success);
router.get('/pending', paymentController.pending);
router.get('/failure', paymentController.failure);
router.post('/cancel', paymentController.cancelSubscription);

module.exports = router;