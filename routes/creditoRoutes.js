const express = require('express');
const { protect } = require('../middleware/autMiddleware.js');  
const creditoController = require('../controllers/creditoControlers.js');
const {
 createCredito,
 getCreditosByUser,
 deleteExpiredCreditos,
 getCreditoById,
 deleteOldestCredito,
 deleteCreditoById

} = require('../controllers/creditoControlers.js');
const router = express.Router();

// Crear un nuevo crédito
router.post('/', protect, createCredito);

// Obtener créditos de un usuario
router.get('/usuario/:userId', protect, getCreditosByUser);

// Eliminar créditos vencidos (esto se ejecuta automáticamente cada día)
router.delete('/vencidos', protect, deleteExpiredCreditos);

// Obtener crédito por ID
router.get('/:id', protect, getCreditoById);

// Eliminar crédito más viejo del usuario logueado (la ruta específica va primero)
router.delete('/oldest', protect, deleteOldestCredito);

// Eliminar crédito por ID (ruta genérica va al final)
router.delete('/:id', protect, deleteCreditoById);

module.exports = router;



module.exports = router;
