const express = require('express');
const { protect } = require('../middleware/autMiddleware.js');  
const { asignarUsuarioDesdePlantilla, obtenerPlantillaPorUsuario, obtenerTurnosSemana } = require('../controllers/plantMensController.js');
const {obtenerPlantillaGeneral} = require('../controllers/plantillaTurnoUsuarioController.js')
const router = express.Router();

router.post('/asignarDesdePlantilla', protect, asignarUsuarioDesdePlantilla);
router.get("/:userId", protect, obtenerPlantillaPorUsuario);
router.get('/turnosSemana', protect, obtenerTurnosSemana);
router.get('/general', protect, obtenerPlantillaGeneral);


module.exports = router;