const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUserProfile, desactivarUsuario, getAllUsers,getTurnosSemanalesPorUsuario,getTurnosMensualesPorUsuario, getUserById, deleteOldestCreditoOfUser } = require('../controllers/userController');
const { protect, adminOrProfesor, admin, userAccess } = require('../middleware/autMiddleware');
const { getTurnosPorUsuario } = require("../controllers/turnoControllersMensual");

const router = express.Router();

// Rutas de registro y login (públicas)
router.post('/register', registerUser);
router.post('/login', loginUser);


// Rutas de perfil del usuario (solo para el usuario autenticado)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/deactivate', protect, desactivarUsuario);

// Rutas protegidas para ver todos los usuarios y turnos (solo Admin o Profesor)
router.get('/usuarios', protect, adminOrProfesor, getAllUsers);  // Admin/Profesor pueden ver todos los usuarios
router.get("/turnos", protect, adminOrProfesor, getTurnosPorUsuario); // Admin/Profesor pueden ver todos los turnos
router.get('/:id', protect, getUserById);


// Rutas protegidas para obtener turnos de un usuario específico
// Si el usuario es Admin o Profesor, puede acceder a los turnos de cualquier usuario
// Si es un usuario normal, solo puede ver sus propios turnos
router.get("/usuario/:id", protect, userAccess, getTurnosPorUsuario);
router.get('/turnosSemanales/:id', protect, getTurnosSemanalesPorUsuario);
router.delete('/creditos/oldest', protect, deleteOldestCreditoOfUser);


// Ruta para mensuales
router.get('/turnosMensuales/:id', protect, getTurnosMensualesPorUsuario);

module.exports = router;