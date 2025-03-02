// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rota para listar todos os usuários
router.get('/', userController.getUsers);

// Rota para buscar um usuário pelo id
router.get('/:id', userController.getUserById);

// Rota para atualizar um usuário (utilize o método PUT)
router.put('/:id', userController.updateUser);

// Rota para excluir um usuário (DELETE)
router.delete('/:id', userController.deleteUser);

// Rota para atualização do perfil (pode ser /profile/:id para diferenciar, se preferir)
router.put('/profile/:id', userController.updateProfile);

module.exports = router;
