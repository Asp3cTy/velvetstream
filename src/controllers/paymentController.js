const mercadopago = require('mercadopago');
const db = require('../models/db'); 

// Configure o SDK do Mercado Pago
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN // Token de teste ou produção
});

/**
 * 1. Pagamento Único (Manual)
 * Permite que o usuário escolha entre Pix, cartão de crédito/débito e outros métodos.
 * Esse pagamento é feito manualmente a cada ciclo.
 */
exports.createPreference = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Verifica se o usuário já existe
    const existingUser = await db.getUserByEmail(email);
    let userId;
    if (!existingUser) {
      // Cria um novo usuário com status 'pending'
      userId = await db.createUser(name, email, password, role, 'pending');
    } else {
      userId = existingUser.id;
      if (existingUser.subscription_status === 'active') {
        return res.status(400).json({ error: 'Usuário já possui uma assinatura ativa' });
      }
    }

    // Monta a preferência de pagamento para pagamento único
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
      // URL do webhook (por exemplo, usando ngrok)
      notification_url: 'https://f36f-2804-56c-c113-aa00-346d-8b1f-3bc0-c01b.ngrok-free.app/webhook/paymentWebhook',
      external_reference: userId
    };

    // Cria a preferência no Mercado Pago para pagamento único
    const response = await mercadopago.preferences.create(preference);
    res.json({ id: response.body.id });
  } catch (error) {
    console.error('Erro ao criar preferência Mercado Pago:', error);
    res.status(500).send('Erro ao criar preferência');
  }
};

/**
 * Endpoints para retorno do pagamento único
 */
exports.success = async (req, res) => {
  const userId = req.query.user_id;
  try {
    await db.updateUserStatus(userId, 'active');
    res.send('Pagamento bem-sucedido');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atualizar status do pagamento');
  }
};

exports.pending = async (req, res) => {
  const userId = req.query.user_id;
  try {
    await db.updateUserStatus(userId, 'pending');
    res.send('Pagamento pendente');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atualizar status do pagamento');
  }
};

exports.failure = async (req, res) => {
  const userId = req.query.user_id;
  try {
    await db.updateUserStatus(userId, 'pending');
    res.send('Pagamento falhou');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atualizar status do pagamento');
  }
};

/**
 * Endpoint para cancelar assinatura (para ambos os fluxos)
 * Atualiza o status para 'pending'
 */
exports.cancelSubscription = async (req, res) => {
  const userId = req.body.user_id;
  try {
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).send('Usuário não encontrado');
    }
    if (user.subscription_status === 'active') {
      // Se houver um preapproval_id salvo, você pode cancelar via API:
      // const mpPreapprovalId = user.mp_preapproval_id;
      // await mercadopago.preapproval.update(mpPreapprovalId, { status: 'cancelled' });
      
      await db.updateUserStatus(userId, 'pending');
      res.send('Assinatura cancelada com sucesso');
    } else {
      res.status(400).send('Usuário não possui uma assinatura ativa para cancelar');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao cancelar a assinatura');
  }
};
/**
 * Cria uma assinatura recorrente (preapproval) para cobrança automática mensal.
 * É necessário que o email passado em payer_email seja de um test user (comprador) no sandbox.
 */
/**
 * Cria uma assinatura recorrente (preapproval) para cobrança automática mensal.
 * O campo back_url é utilizado para redirecionar o usuário após a aprovação ou cancelamento.
 * O payer_email deve ser de um test user comprador.
 */
/**
 * Cria uma assinatura recorrente (preapproval) para cobrança automática mensal.
 * O campo payer_email deve ser um e-mail de test user comprador.
 * Após a criação, o preapproval_id é salvo no banco para futuras consultas/cancelamentos.
 */
exports.createSubscription = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Verifica se o usuário já existe no banco
    const existingUser = await db.getUserByEmail(email);
    let userId;
    if (!existingUser) {
      // Cria um novo usuário com status 'pending'
      userId = await db.createUser(name, email, password, role, 'pending');
    } else {
      userId = existingUser.id;
      if (existingUser.subscription_status === 'active') {
        return res.status(400).json({ error: 'Usuário já possui uma assinatura ativa' });
      }
    }

    // Dados para a assinatura recorrente (preapproval)
    // Atenção: o payer_email deve ser de um test user (comprador) no ambiente sandbox.
    const preapprovalData = {
      reason: 'Assinatura Mensal',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 14.90,
        currency_id: 'BRL'
      },
      payer_email: email, // Use um e-mail de test user comprador, ex: "test_user_720029967@testuser.com"
      // URL para redirecionamento após aprovação ou cancelamento. Use o seu domínio público (ngrok)
      back_url: `https://f36f-2804-56c-c113-aa00-346d-8b1f-3bc0-c01b.ngrok-free.app/api/payments/subscriptionReturn?user_id=${userId}`,
      external_reference: userId
    };

    // Cria a assinatura recorrente (preapproval) no Mercado Pago
    const response = await mercadopago.preapproval.create(preapprovalData);
    console.log('MP preapproval response:', response.body);

    // Tenta obter o link de aprovação (init_point)
    let initPoint = response.body.sandbox_init_point || response.body.init_point;
    if (!initPoint) {
      console.error("MP preapproval response completa:", response.body);
      return res.status(500).json({ error: 'Falha ao criar assinatura. Nenhum init_point retornado.', mp_response: response.body });
    }

    // Salva o preapproval_id no banco para futuras consultas ou cancelamentos
    // response.body.id é o preapproval_id gerado pelo Mercado Pago.
    await db.savePreapprovalId(userId, response.body.id);
    
    // Retorna o link para que o usuário aprove a assinatura
    return res.json({ initPoint });
  } catch (error) {
    console.error('Erro ao criar assinatura Mercado Pago:', error);
    res.status(500).json({ error: 'Erro ao criar assinatura' });
  }
};


/**
 * Endpoint de retorno (back_url) para assinaturas recorrentes
 * Após o usuário aprovar ou cancelar a assinatura, o MP redireciona para essa rota.
 */
exports.subscriptionReturn = async (req, res) => {
  try {
    const { user_id, preapproval_id } = req.query;
    if (!user_id || !preapproval_id) {
      return res.status(400).send('Parâmetros ausentes (user_id ou preapproval_id).');
    }

    // Consulta o status da assinatura utilizando o preapproval_id
    const preapproval = await mercadopago.preapproval.findById(preapproval_id);
    const info = preapproval.body;
    console.log('Retorno de assinatura:', info);

    // Atualiza o status do usuário no banco conforme o status da assinatura
    if (info.status === 'authorized') {
      await db.updateUserStatus(user_id, 'active');
      return res.send('Assinatura aprovada e usuário ativado!');
    } else {
      await db.updateUserStatus(user_id, 'pending');
      return res.send(`Assinatura com status: ${info.status}. Usuário marcado como pending.`);
    }
  } catch (error) {
    console.error('Erro no subscriptionReturn:', error);
    res.status(500).send('Erro interno ao verificar assinatura');
  }
};



exports.checkSubscriptionStatus = async (req, res) => {
  try {
    const { user_id, preapproval_id } = req.query;
    if (!user_id || !preapproval_id) {
      return res.status(400).json({ error: 'Parâmetros ausentes (user_id ou preapproval_id).' });
    }

    // Consulta os detalhes da assinatura (preapproval) no Mercado Pago
    const preapproval = await mercadopago.preapproval.findById(preapproval_id);
    const info = preapproval.body;
    console.log('Status atual da assinatura:', info.status);

    // Se o status for "authorized", atualizamos para "active"; caso contrário, mantemos "pending"
    if (info.status === 'authorized') {
      await db.updateUserStatus(user_id, 'active');
      return res.json({ message: 'Assinatura autorizada e usuário atualizado para active!', status: info.status });
    } else {
      await db.updateUserStatus(user_id, 'pending');
      return res.json({ message: `Assinatura com status: ${info.status}. Usuário marcado como pending.`, status: info.status });
    }
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    res.status(500).json({ error: 'Erro ao verificar assinatura.' });
  }
};


