const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');




// Rota para assinatura recorrente
router.post('/create_subscription', paymentController.createSubscription);
router.get('/subscriptionReturn', paymentController.subscriptionReturn);
router.post('/create_preference', paymentController.createPreference);
router.get('/checkSubscriptionStatus', paymentController.checkSubscriptionStatus);
router.get('/success', paymentController.success);
router.get('/pending', paymentController.pending);
router.get('/failure', paymentController.failure);
router.post('/cancel', paymentController.cancelSubscription);

module.exports = router;