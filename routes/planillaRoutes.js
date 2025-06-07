const express = require('express');
const { protect } = require('../middleware/autMiddleware.js');  
const { asignarUsuarioDesdePlantilla, obtenerPlantillaPorUsuario, obtenerTurnosSemana } = require('../controllers/plantMensController.js');
const router = express.Router();

router.post('/asignarDesdePlantilla', protect, asignarUsuarioDesdePlantilla);
router.get("/:userId", protect, obtenerPlantillaPorUsuario);
router.get('/turnosSemana', protect, obtenerTurnosSemana);

module.exports = router;