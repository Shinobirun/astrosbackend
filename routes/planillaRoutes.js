const express = require('express');
const { protect } = require('../middleware/autMiddleware.js');  
const { asignarUsuarioDesdePlantilla } = require('../controllers/plantMensController.js');
const router = express.Router();

router.post('/asignarDesdePlantilla', protect, asignarUsuarioDesdePlantilla);

module.exports = router;