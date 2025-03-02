const mercadopago = require('mercadopago');
const db = require('../models/db');

// Garanta que o SDK esteja configurado (se não fez no app principal, repita aqui):
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

exports.handleWebhook = async (req, res) => {
  try {
    // Estrutura do corpo que o Mercado Pago envia: { "type": "payment", "data": { "id": "xxx" } }
    const { type, data } = req.body;

    if (type !== 'payment') {
      console.log(`❓ Tipo de webhook desconhecido: ${type}`);
      return res.status(400).send('Tipo de webhook desconhecido');
    }

    const paymentId = data.id;
    console.log(`🔍 Webhook recebido. Payment ID: ${paymentId}`);

    // Obtemos os detalhes do pagamento no MP
    const payment = await mercadopago.payment.findById(paymentId);
    const paymentInfo = payment.body;

    // userId pode estar em external_reference ou em metadata.userId
    const userId = paymentInfo.external_reference; 
    // Se você usa metadata: 
    // const userId = paymentInfo.metadata?.userId;

    console.log('🔍 Status do pagamento:', paymentInfo.status);
    console.log('🔍 userId extraído:', userId);

    // Se não tiver userId, não conseguimos atualizar
    if (!userId) {
      console.error('❌ Não foi possível identificar o usuário (sem external_reference).');
      return res.sendStatus(400);
    }

    // Verifica se o usuário existe
    const user = await db.getUserById(userId);
    if (!user) {
      console.error(`❌ Usuário não encontrado para userId = ${userId}`);
      return res.status(404).send('Usuário não encontrado');
    }

    // Atualizamos o status dependendo do "paymentInfo.status"
    // (approved, pending, in_process, rejected, cancelled, refunded, charged_back)
    switch (paymentInfo.status) {
      case 'approved':
        await db.updateUserStatus(userId, 'active');
        console.log(`✅ Pagamento aprovado. [UserID: ${userId}] => 'active'`);
        break;

      case 'pending':
      case 'in_process':
        await db.updateUserStatus(userId, 'pending');
        console.log(`⏳ Pagamento pendente/em processamento. [UserID: ${userId}] => 'pending'`);
        break;

      case 'rejected':
      case 'cancelled':
      case 'refunded':
      case 'charged_back':
        // Decide se deseja colocar 'expired', 'pending' etc. No exemplo, deixamos 'pending'
        await db.updateUserStatus(userId, 'pending');
        console.log(`❌ Pagamento ${paymentInfo.status}. [UserID: ${userId}] => 'pending'`);
        break;

      default:
        console.log(`❓ Status desconhecido: ${paymentInfo.status}`);
        // Pode decidir não alterar nada no banco
        break;
    }

    return res.sendStatus(200); // Confirma recebimento ao Mercado Pago
  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.sendStatus(500);
  }
};

// webhookController.js
exports.subscriptionWebhook = async (req, res) => {
  try {
    console.log('Recebendo Webhook de Assinatura:', req.body);
    const { id, type } = req.body;

    if (type === 'preapproval') {
      const preapprovalId = id;
      // Buscar status atual da assinatura
      const preapproval = await mercadopago.preapproval.findById(preapprovalId);
      const info = preapproval.body;

      // Extrair userId do external_reference
      const userId = info.external_reference;

      if (info.status === 'authorized') {
        await db.updateUserStatus(userId, 'active');
        console.log(`Assinatura autorizada! userId=${userId} agora está active.`);
      } else {
        await db.updateUserStatus(userId, 'pending');
        console.log(`Assinatura com status=${info.status}. userId=${userId} marcado como pending.`);
      }
    }

    // Sempre retorne 200 para indicar que recebeu
    res.sendStatus(200);
  } catch (error) {
    console.error('Erro no subscriptionWebhook:', error);
    res.sendStatus(500);
  }
};


/**
 * Webhook para notificações de pagamento (não recorrente).
 * Este endpoint processa notificações do Mercado Pago sobre pagamentos únicos.
 */
exports.paymentWebhook = async (req, res) => {
  try {
    console.log('Recebendo webhook de pagamento:', req.body);
    const { type, data } = req.body;
    
    // Verifica se o evento é de pagamento
    if (type !== 'payment') {
      console.log('Evento não é de pagamento. Ignorando...');
      return res.sendStatus(200);
    }
    
    // Consulta os detalhes do pagamento usando o ID recebido
    const paymentResponse = await mercadopago.payment.findById(data.id);
    const paymentInfo = paymentResponse.body;
    console.log('Detalhes do pagamento:', paymentInfo);
    
    // O campo external_reference deve ter sido definido na preferência e corresponde ao user_id do seu sistema
    const userId = paymentInfo.external_reference;
    if (!userId) {
      console.error('External_reference não encontrado no pagamento.');
      return res.sendStatus(400);
    }
    
    // Atualiza o status do usuário com base no status do pagamento
    // Se o pagamento for aprovado, marca como "active"; caso contrário, "pending"
    if (paymentInfo.status === 'approved') {
      await db.updateUserStatus(userId, 'active');
      console.log(`Pagamento aprovado para o usuário ${userId}. Status atualizado para active.`);
    } else {
      await db.updateUserStatus(userId, 'pending');
      console.log(`Pagamento com status "${paymentInfo.status}" para o usuário ${userId}. Marcado como pending.`);
    }
    
    return res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook de pagamento:', error);
    return res.sendStatus(500);
  }
};