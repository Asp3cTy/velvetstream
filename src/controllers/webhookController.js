const mercadopago = require('mercadopago');
const db = require('../models/db'); // Atualizado para usar o módulo de banco de dados

// Configurar o SDK do Mercado Pago
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

// Função para lidar com notificações de Webhook do Mercado Pago
exports.handleWebhook = async (req, res) => {
  const payment = req.body;
  
  // Processar a notificação de acordo com o status do pagamento
  if (payment.action === 'payment.created') {
    try {
      const paymentData = await mercadopago.payment.findById(payment.data.id);
      const userId = paymentData.body.metadata.user_id;

      switch (paymentData.body.status) {
        case 'approved':
          await db.updateUserStatus(userId, 'premium');
          res.status(200).send('Pagamento aprovado');
          break;
        case 'pending':
          await db.updateUserStatus(userId, 'pending');
          res.status(200).send('Pagamento pendente');
          break;
        case 'rejected':
          await db.updateUserStatus(userId, 'failed');
          res.status(200).send('Pagamento rejeitado');
          break;
        default:
          res.status(400).send('Status de pagamento desconhecido');
      }
    } catch (error) {
      console.log(error);
      res.status(500).send('Erro ao atualizar status do pagamento');
    }
  } else {
    res.status(400).send('Tipo de notificação desconhecido');
  }
};