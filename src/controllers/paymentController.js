const db = require('../models/db');

// Função para lidar com notificações de Webhook do Mercado Pago
exports.handleWebhook = async (req, res) => {
  const payment = req.body;
  
  // Processar a notificação de acordo com o status do pagamento
  if (payment.type === 'payment') {
    try {
      switch (payment.data.status) {
        case 'approved':
          await db.updateUserStatus(payment.data.user_id, 'premium');
          res.status(200).send('Pagamento aprovado');
          break;
        case 'pending':
          await db.updateUserStatus(payment.data.user_id, 'pending');
          res.status(200).send('Pagamento pendente');
          break;
        case 'rejected':
          await db.updateUserStatus(payment.data.user_id, 'failed');
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