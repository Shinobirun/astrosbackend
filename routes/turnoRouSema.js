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

const { protect, adminOrProfesor } = require('../middleware/autMiddleware');

const router = express.Router();

// Alias para liberar su propio turno (no de otro)
const liberarTurnoUsuario = (req, res) => {
  req.body.userId = undefined; // fuerza a usar el id del usuario autenticado
  return liberarTurno(req, res);
};

// ✅ Rutas accesibles para cualquier usuario logueado
router.get('/sema', protect, getTurnosDisponibles);                   // Ver todos los turnos disponibles
router.get('/turno/:id', protect, getTurnoById);                      // Ver un turno específico
router.get('/disponibles', protect, getTurnosSemanalesDisponibles);   // Ver solo los turnos semanales disponibles
router.get('/usuario/:id', protect, getTurnosPorUsuario);             // Ver los turnos asignados al usuario
router.post('/tomar/:id', protect, tomarTurno);                       // Tomar un turno
router.put('/liberarMiTurno/:id', protect, liberarTurno);             // Liberar su propio turno
router.get('/misTurnos', protect, getMisTurnos);                     // Solo logueados


// 🔒 Rutas solo para Admins o Profesores
router.get('/todoSema', protect, adminOrProfesor, getTodosLosTurnos);       // Ver todos los turnos (sin filtros)
router.put('/liberarSema', protect, adminOrProfesor, liberarTurno);         // Liberar turno de cualquier usuario
router.post('/asignarSema', protect, adminOrProfesor, asignarTurnoManual);  // Asignar turno manualmente
router.delete('/Sema/:id', protect, adminOrProfesor, eliminarTurno);        // Eliminar un turno

module.exports = router;