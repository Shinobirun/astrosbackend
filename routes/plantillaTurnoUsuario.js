const express = require('express');
const router = express.Router();
const {
  crearPlantillaTurnoUsuario,
  listarPlantillasTurnoUsuario,
  eliminarPlantillaTurnoUsuario
} = require('../controllers/plantillaTurnoUsuarioController');

// Crear una nueva
router.post('/', crearPlantillaTurnoUsuario);

// Ver todas (o por usuario)
router.get('/', listarPlantillasTurnoUsuario);

// Eliminar (desactivar) por ID
router.delete('/:id', eliminarPlantillaTurnoUsuario);

module.exports = router;
