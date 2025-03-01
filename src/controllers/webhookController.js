const db = require('../models/db');

// Função para lidar com o webhook de pagamento
exports.handleWebhook = async (req, res) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;
    const userId = '4dd1-0191-225f-3c74'; // ID do usuário fornecido

    console.log(`🔍 Processando pagamento ${paymentId} para o usuário ${userId}`);

    if (paymentId === '123456789') {
      // Sucesso
      await db.updateUserStatus(userId, 'active');
      console.log(`✅ Pagamento bem-sucedido para o usuário ${userId}`);
      return res.status(200).send('Pagamento bem-sucedido');
    } else if (paymentId === '987654321') {
      // Pendente
      await db.updateUserStatus(userId, 'pending');
      console.log(`⏳ Pagamento pendente para o usuário ${userId}`);
      return res.status(200).send('Pagamento pendente');
    } else if (paymentId === '1122334455') {
      // Falha
      console.log(`❌ Pagamento falhou para o usuário ${userId}`);
      return res.status(200).send('Pagamento falhou');
    } else {
      // Pagamento desconhecido
      console.log(`❓ ID de pagamento desconhecido: ${paymentId}`);
      return res.status(400).send('ID de pagamento desconhecido');
    }
  } else {
    // Tipo de webhook desconhecido
    console.log(`❓ Tipo de webhook desconhecido: ${type}`);
    return res.status(400).send('Tipo de webhook desconhecido');
  }
};