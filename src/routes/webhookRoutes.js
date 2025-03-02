const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/', webhookController.handleWebhook);

// Rota POST para receber notificações de assinaturas (preapproval)
router.post('/subscriptionWebhook', webhookController.subscriptionWebhook);
// Rota para notificações de pagamento único
router.post('/paymentWebhook', webhookController.paymentWebhook);

module.exports = router;