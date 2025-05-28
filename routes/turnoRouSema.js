const express = require('express');
const {
  getTurnosDisponibles,
  liberarTurno,
  getTurnoById,
  getTodosLosTurnos,
  eliminarTurno,
  asignarTurnoManual,
  tomarTurno,
  getMisTurnos,
  getTurnosSemanalesDisponibles,
  getTurnosPorUsuario,
} = require('../controllers/turnoControllersSemanal');

// Si no usás nada de 'turnoSemaController' sacalo o aclaralo
// const { getTurnosSemanalesDisponibles, tomarTurno } = require('../controllers/turnoSemaController');

const { protect, adminOrProfesor } = require('../middleware/autMiddleware');

const router = express.Router();

// Alias para liberar su propio turno (no de otro)
const liberarTurnoUsuario = (req, res) => {
  // Fuerza a usar el id del usuario autenticado (seguramente está en req.user.id)
  req.body.userId = req.user.id; // si no está req.user.id, corregir acá
  return liberarTurno(req, res);
};

// Rutas accesibles para cualquier usuario logueado
router.get('/sema', protect, getTurnosDisponibles);
router.get('/turno/:id', protect, getTurnoById);
router.get('/disponibles', protect, getTurnosSemanalesDisponibles);
router.get('/usuario/:id', protect, getTurnosPorUsuario);
router.post('/tomar/:id', protect, tomarTurno);

// Usar la función alias que forza el userId
router.put('/liberarMiTurno/:id', protect, liberarTurnoUsuario);

router.get('/misTurnos', protect, getMisTurnos);

// Rutas solo para Admins o Profesores
router.get('/todoSema', protect, adminOrProfesor, getTodosLosTurnos);
router.put('/liberarSema', protect, adminOrProfesor, liberarTurno);
router.post('/asignarSema', protect, adminOrProfesor, asignarTurnoManual);
router.delete('/Sema/:id', protect, adminOrProfesor, eliminarTurno);

module.exports = router;
