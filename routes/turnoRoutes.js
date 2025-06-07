const express = require('express');
const {
  getTurnosDisponibles,
  liberarTurno,
  getTurnoById,
  crearTurno,
  getTodosLosTurnos,
  eliminarTurno,
  asignarTurnoManual,
  eliminarDesdeFecha, 
  getTurnosPorUsuario,
  getMisTurnos,
  getTurnosSegunRol
} = require('../controllers/turnoControllersMensual');

const { protect, adminOrProfesor } = require('../middleware/autMiddleware');

const router = express.Router();

// ✅ Rutas accesibles para cualquier usuario logueado
router.get('/', protect, getTurnosDisponibles);       // Ver turnos disponibles
router.get('/turno/:id', protect, getTurnoById);      // Ver un turno específico
router.get('/usuario/:id', protect, getTurnosPorUsuario,); 
router.get('/misTurnos', protect, getMisTurnos);


// 🔒 Rutas solo para Admins o Profesores
router.get('/todos', protect, adminOrProfesor, getTodosLosTurnos);            // Ver todos los turnos
router.post('/', protect, adminOrProfesor, crearTurno);                       // Crear nuevo turno
router.put('/liberar', protect, liberarTurno);               // Liberar un turno
router.post('/asignar', protect, asignarTurnoManual);        // Tomar un turno
router.delete('/:id', protect, adminOrProfesor, eliminarTurno);               // Eliminar un turno
router.delete('/eliminarDesdeFecha/:fecha', protect, eliminarDesdeFecha);
router.get('/segunRol', protect, getTurnosSegunRol);

module.exports = router;