const express = require('express');
const creditoController = require('../controllers/creditoControlers.js');
const router = express.Router();

// Obtener crédito por ID
router.get('/:id', creditoController.getCreditoById);

// Obtener créditos de un usuario
router.get('/usuario/:userId', creditoController.getCreditosByUser);

// Crear un nuevo crédito
router.post('/', creditoController.createCredito);

// Eliminar crédito por ID
router.delete('/:id', creditoController.deleteCreditoById);

// Eliminar créditos vencidos (esto se ejecuta automáticamente cada día)
router.delete('/vencidos', creditoController.deleteExpiredCreditos);

module.exports = router;
