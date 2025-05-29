const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Credito = require('../models/creditos');
const TurnoSemanal = require('../models/TurnoSemanal');
const TurnoMensual = require('../models/TurnoMensual');

// Función para generar JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Registrar o reactivar un usuario
const registerUser = async (req, res) => {
  const { username, email, password, firstName, lastName, role } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      if (!user.activo) {
        user.activo = true;
        user.password = password ? await bcrypt.hash(password, 10) : user.password;
        await user.save();
        return res.json({ message: 'Tu cuenta ha sido reactivada. Por favor, inicia sesión.' });
      }
      return res.status(400).json({ message: 'El usuario ya está registrado y activo.' });
    }

    user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      activo: true,
    });

    // Crear 5 créditos con vencimiento a 15 días
    const creditos = [];
    for (let i = 0; i < 5; i++) {
      const nuevoCredito = await Credito.create({
        usuario: user._id,
        venceEn: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        usado: false,
      });
      creditos.push(nuevoCredito._id);
    }

    user.creditos = creditos;
    await user.save();

    res.status(201).json({ message: 'Registro exitoso. Por favor, inicia sesión.' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
};

// Login de usuario
const loginUser = async (req, res) => {
  const { username, password } = req.body;   // solo username y password

  try {
    // Buscamos únicamente por username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Usamos el método de instancia que ya tenés en tu esquema
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!user.activo) {
      return res.status(403).json({ message: 'Usuario desactivado. Contacta al administrador.' });
    }

    // Devolvemos los datos mínimos + token
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};


// Obtener un usuario por ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'creditos',
        match: { usado: false, venceEn: { $gt: new Date() } },
        select: '_id createdAt venceEn',
      });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const turnosSemanales = await TurnoSemanal.find({
      ocupadoPor: user._id,
      activo: true,
    });

    const turnosMensuales = await TurnoMensual.find({
      ocupadoPor: user._id,
      activo: true,
    });

    res.json({
      _id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      email: user.email,
      
    });
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ message: 'Error al obtener el usuario' });
  }
};



// Obtener perfil del usuario
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'creditos',
        match: { usado: false, venceEn: { $gt: new Date() } },
        select: '_id createdAt venceEn',
      });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const turnosSemanales = await TurnoSemanal.find({
      ocupadoPor: req.user.id,
      activo: true,
    });

    const turnosMensuales = await TurnoMensual.find({
      ocupadoPor: req.user.id,
      activo: true,
    });

    res.json({
      _id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      email: user.email,
      creditos: user.creditos,
      turnosSemanales,
      turnosMensuales,
      activo: user.activo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
  }
};

// Actualizar perfil del usuario
const updateUserProfile = async (req, res) => {
  const {
    id: targetUserId,
    username,
    firstName,
    lastName,
    role,
    password,
    creditos,
    turnosSemanales,
    turnosMensuales,
  } = req.body;

  try {
    let userIdToUpdate = req.user.id;
    if (
      (req.user.role === "Admin" || req.user.role === "Profesor") &&
      targetUserId
    ) {
      userIdToUpdate = targetUserId;
    }

    const user = await User.findById(userIdToUpdate);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    if (username) user.username = username;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role && (req.user.role === "Admin" || req.user.role === "Profesor")) {
      user.role = role;
    }
    if (password) user.password = password;
    if (creditos) user.creditos = creditos;
    if (turnosSemanales) user.turnosSemanales = turnosSemanales;
    if (turnosMensuales) user.turnosMensuales = turnosMensuales;

    await user.save();

    res.json({
      _id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      creditos: user.creditos,
      turnosSemanales: user.turnosSemanales,
      turnosMensuales: user.turnosMensuales,
    });
  } catch (error) {
    console.error("Error al actualizar perfil de usuario:", error);
    res.status(500).json({ message: "Error al actualizar perfil de usuario" });
  }
};

// Activar/desactivar usuario
const desactivarUsuario = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.activo = !user.activo;
    await user.save();

    res.json({ message: `Usuario ${user.activo ? 'reactivado' : 'desactivado'}`, activo: user.activo });
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({ message: 'Error al modificar el estado del usuario' });
  }
};

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('turnosSemanales')
      .populate('turnosMensuales')
      .populate({
        path: 'creditos',
        select: '_id createdAt venceEn usado',
      });

    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
};

// Obtener turnos semanales por usuario
const getTurnosSemanalesPorUsuario = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).populate({
      path: 'turnosSemanales',
      match: { activo: true },
    });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json(user.turnosSemanales);
  } catch (error) {
    console.error('Error al obtener turnos semanales:', error);
    res.status(500).json({ message: 'Error al obtener turnos semanales' });
  }
};

// Obtener turnos mensuales por usuario
const getTurnosMensualesPorUsuario = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).populate({
      path: 'turnosMensuales',
      match: { activo: true },
    });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json(user.turnosMensuales);
  } catch (error) {
    console.error('Error al obtener turnos mensuales:', error);
    res.status(500).json({ message: 'Error al obtener turnos mensuales' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  desactivarUsuario,
  getAllUsers,
  getTurnosSemanalesPorUsuario,
  getTurnosMensualesPorUsuario,
  getUserById,
};
