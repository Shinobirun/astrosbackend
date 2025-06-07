const express = require('express');
const {
  getTurnosDisponibles,
  getTurnoById,
  crearTurno,
  getTodosLosTurnos,
  eliminarTurno,
  liberarTurno,
  asignarTurnoManual,
  getTurnosPorUsuario,
  eliminarDesdeFecha
} = require('../controllers/turnoControllersMensual');
const { protect } = require('../middleware/autMiddleware');

const router = express.Router();

// Rutas accesibles para cualquier usuario autenticado
router.get('/', protect, getTurnosDisponibles);       // Ver turnos disponibles
router.get('/turno/:id', protect, getTurnoById);      // Ver un turno específico

// Rutas que cualquier Admin/Profesor debería poder usar para administrar turnos
router.get('/todos', protect, getTodosLosTurnos);            // Ver todos los turnos
router.post('/', protect, crearTurno);                       // Crear nuevo turno
router.delete('/:id', protect, eliminarTurno);               // Eliminar un turno
router.delete('/eliminarDesdeFecha/:fecha', protect, eliminarDesdeFecha);
router.post('/asignar', protect, asignarTurnoManual);        // Asignar manualmente

// Liberar turno: 
//   - Si es Admin o Profesor, podrá liberar cualquier turno.
//   - Si es usuario normal, podrá liberar sólo sus propios turnos.
router.put('/liberar', protect, liberarTurno);

// Obtener mis turnos (los turnos en los que el usuario esté en "ocupadoPor")
router.get('/misTurnos', protect, getTurnosPorUsuario);

module.exports = router;
