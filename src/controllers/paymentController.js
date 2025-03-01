const mercadopago = require('mercadopago');
const db = require('../models/db'); 

// Configurar o SDK do Mercado Pago
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

// Função para criar uma preferência de pagamento
exports.createPreference = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Criar usuário no banco de dados se não existir
  const existingUser = await db.getUserByEmail(email);
  let userId;
  if (!existingUser) {
    userId = await db.createUser(name, email, password, role, 'pending');
  } else {
    userId = existingUser.id;
    // Verifica se o usuário já possui uma assinatura ativa
    if (existingUser.subscription_status === 'active') {
      return res.status(400).json({ error: 'Usuário já possui uma assinatura ativa' });
    }
  }

  const preference = {
    items: [
      {
        title: 'Assinatura Mensal',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: 14.90
      }
    ],
    payer: {
      email: email
    },
    back_urls: {
      success: `http://localhost:3000/api/payments/success?user_id=${userId}`,
      failure: `http://localhost:3000/api/payments/failure?user_id=${userId}`,
      pending: `http://localhost:3000/api/payments/pending?user_id=${userId}`
    },
    auto_return: 'approved',
    notification_url: 'http://localhost:3000/webhook' // URL do Webhook
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    res.json({ id: response.body.id });
  } catch (error) {
    console.log(error);
    res.status(500).send('Erro ao criar preferência');
  }
};

// Função para tratar o sucesso do pagamento
exports.success = async (req, res) => {
  const userId = req.query.user_id;
  try {
    await db.updateUserStatus(userId, 'active');
    res.send('Pagamento bem-sucedido');
  } catch (error) {
    console.log(error);
    res.status(500).send('Erro ao atualizar status do pagamento');
  }
};

// Função para tratar o pagamento pendente
exports.pending = async (req, res) => {
  const userId = req.query.user_id;
  try {
    await db.updateUserStatus(userId, 'pending');
    res.send('Pagamento pendente');
  } catch (error) {
    console.log(error);
    res.status(500).send('Erro ao atualizar status do pagamento');
  }
};

// Função para tratar o pagamento falho
exports.failure = async (req, res) => {
  const userId = req.query.user_id;
  try {
    await db.updateUserStatus(userId, 'pending');
    res.send('Pagamento falhou');
  } catch (error) {
    console.log(error);
    res.status(500).send('Erro ao atualizar status do pagamento');
  }
};

// Função para cancelar a assinatura
exports.cancelSubscription = async (req, res) => {
  const userId = req.body.user_id;
  try {
    const user = await db.getUserById(userId);
    if (user) {
      const subscriptionStatus = user.subscription_status;
      console.log(`🔍 Verificando assinatura do usuário ${userId}. Status atual: ${subscriptionStatus}`);
      if (subscriptionStatus === 'active') {
        await db.updateUserStatus(userId, 'pending');
        res.send('Assinatura cancelada com sucesso');
      } else {
        res.status(400).send('Usuário não possui uma assinatura ativa para cancelar');
      }
    } else {
      res.status(404).send('Usuário não encontrado');
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Erro ao cancelar a assinatura');
  }
};