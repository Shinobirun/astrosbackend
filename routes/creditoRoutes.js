const express = require('express');
const { protect } = require('../middleware/autMiddleware.js');  
const creditoController = require('../controllers/creditoControlers.js');
const router = express.Router();

// Crear un nuevo crédito
router.post('/', protect, creditoController.createCredito);

// Obtener créditos de un usuario
router.get('/usuario/:userId', protect, creditoController.getCreditosByUser);

// Eliminar créditos vencidos (esto se ejecuta automáticamente cada día)
router.delete('/vencidos', protect, creditoController.deleteExpiredCreditos);

// Obtener crédito por ID
router.get('/:id', protect, creditoController.getCreditoById);

// ** NUEVA RUTA: eliminar crédito más viejo del usuario logueado **
router.delete('/oldest', protect, creditoController.deleteOldestCredito);

// Eliminar crédito por ID
router.delete('/:id', protect, creditoController.deleteCreditoById);



module.exports = router;
