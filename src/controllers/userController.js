// controllers/userController.js
const { queryDatabase, getUserById } = require('../models/db');
const bcrypt = require('bcryptjs');

/**
 * Lista todos os usuários (exceto a senha, se desejar)
 */
exports.getUsers = async (req, res) => {
  try {
    // Seleciona somente os campos relevantes
    const users = await queryDatabase(
      "SELECT id, name, email, role, subscription_status, created_at FROM users"
    );
    res.json({ users });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
};

/**
 * Busca um usuário pelo id
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getUserById(id);
    if (!result) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.json({ user: result });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
};

/**
 * Atualiza dados do usuário.
 * Se o password for fornecido, ele será hasheado antes de atualizar.
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, subscription_status } = req.body;
    
    // Cria um array com os campos a atualizar
    const fields = [];
    const params = [];
    
    if (name) {
      fields.push("name = ?");
      params.push(name);
    }
    if (email) {
      fields.push("email = ?");
      params.push(email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push("password = ?");
      params.push(hashedPassword);
    }
    if (role) {
      fields.push("role = ?");
      params.push(role);
    }
    if (subscription_status) {
      fields.push("subscription_status = ?");
      params.push(subscription_status);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }
    
    params.push(id);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    await queryDatabase(query, params);
    res.json({ message: "Usuário atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
};

/**
 * Exclui um usuário pelo id.
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await queryDatabase("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    res.status(500).json({ error: "Erro ao excluir usuário" });
  }
};

/**
 * Atualiza o perfil do usuário.
 * Permite atualizar nome, email, senha, foto e idioma.
 * O id do usuário é passado via parâmetro (ex: /api/users/profile/:id)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, photo, language } = req.body;

    // Monta dinamicamente os campos a atualizar
    const fields = [];
    const params = [];

    if (name) {
      fields.push("name = ?");
      params.push(name);
    }
    if (email) {
      fields.push("email = ?");
      params.push(email.trim().toLowerCase());
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push("password = ?");
      params.push(hashedPassword);
    }
    if (photo) {
      fields.push("photo = ?");
      params.push(photo);
    }
    if (language) {
      fields.push("language = ?");
      params.push(language);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }

    params.push(id);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    await queryDatabase(query, params);

    return res.json({ message: "Perfil atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
};
