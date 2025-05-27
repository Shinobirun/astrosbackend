const express = require('express');
const {
  getTurnosDisponibles,
  liberarTurno,
  getTurnoById,
  getTodosLosTurnos,
  eliminarTurno,
  asignarTurnoManual,
  
  getTurnosSemanalesDisponibles,
} = require('../controllers/turnoControllersSemanal');

const { protect, adminOrProfesor } = require('../middleware/autMiddleware');

const router = express.Router();

// ✅ Rutas accesibles para cualquier usuario logueado
router.get('/sema', protect, getTurnosDisponibles);       // Ver turnos disponibles
router.get('/turno/:id', protect, getTurnoById);      // Ver un turno específico
router.get('/disponibles', protect, getTurnosSemanalesDisponibles);

// 🔒 Rutas solo para Admins o Profesores
router.get('/todoSema', protect, adminOrProfesor, getTodosLosTurnos);  // Ver todos los turnos

router.put('/liberarSema', protect, adminOrProfesor, liberarTurno);     // Liberar un turno
router.post('/asignarSema', protect, adminOrProfesor, asignarTurnoManual);        // Tomar un turno
router.delete('/Sema/:id', protect, adminOrProfesor, eliminarTurno);     // Eliminar un turno

module.exports = router;