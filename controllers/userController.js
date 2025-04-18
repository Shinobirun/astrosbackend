const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Credito = require('../models/creditos');

// Generar un token JWT
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

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
  const { username, email, password } = req.body;

  try {
    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!user.activo) {
      return res.status(403).json({ message: 'Usuario desactivado. Contacta al administrador.' });
    }

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

// Obtener perfil del usuario
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'turnosSemanales',
        select: 'sede nivel dia hora cuposDisponibles activo expiraEn',
      })
      .populate({
        path: 'turnosMensuales',
        select: 'sede nivel dias horario cupos',
      })
      .populate({
        path: 'creditos',
        match: { usado: false, venceEn: { $gt: new Date() } },
        select: '_id createdAt venceEn',
      });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      _id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      email: user.email,
      creditos: user.creditos,
      turnosSemanales: user.turnosSemanales,
      turnosMensuales: user.turnosMensuales,
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
  const { firstName, lastName, creditos, turnosSemanales, turnosMensuales } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
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
    console.error('Error al actualizar perfil de usuario:', error);
    res.status(500).json({ message: 'Error al actualizar perfil de usuario' });
  }
};

// Desactivar o reactivar usuario
const desactivarUsuario = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

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

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  desactivarUsuario,
  getAllUsers,
};
