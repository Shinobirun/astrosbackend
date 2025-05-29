const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Credito = require('../models/creditos');
const TurnoSemanal = require('../models/TurnoSemanal');
const TurnoMensual = require('../models/TurnoMensual');

// Generar JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Registrar o reactivar usuario
const registerUser = async (req, res) => {
  const { username, email, password, firstName, lastName, role } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      if (!user.activo) {
        user.activo = true;
        if (password) {
          user.password = await bcrypt.hash(password, 10);
        }
        await user.save();
        return res.json({ message: 'Tu cuenta ha sido reactivada. Por favor, inicia sesión.' });
      }
      return res.status(400).json({ message: 'El usuario ya está registrado y activo.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      username,
      email,
      password: hashedPassword,
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

import React, { useState } from "react";
import axios from "axios";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: "", // Cambiado de email a username
    password: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://astrosfrontend.onrender.com/api/users/login",
        formData
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      setSuccessMessage("Inicio de sesión exitoso");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error) {
      setError(error.response?.data.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Iniciar Sesión
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Usuario
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ingrese su nombre de usuario o email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ingrese su contraseña"
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {successMessage && (
            <p className="text-green-500 text-sm mt-2">{successMessage}</p>
          )}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;

// Obtener usuario por ID
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

    // No estás usando turnos para la respuesta, si los quieres puedes agregarlos acá

    res.json({
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      email: user.email,
      creditos: user.creditos,
      cantidadCreditos: user.creditos.length,
    });
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ message: 'Error al obtener el usuario' });
  }
};

// Obtener perfil usuario logueado
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
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      email: user.email,
      creditos: user.creditos,
      cantidadCreditos: user.creditos.length,
      turnosSemanales,
      turnosMensuales,
      activo: user.activo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
  }
};

// Actualizar perfil usuario
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
      (req.user.role === 'Admin' || req.user.role === 'Profesor') &&
      targetUserId
    ) {
      userIdToUpdate = targetUserId;
    }

    const user = await User.findById(userIdToUpdate);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (username) user.username = username;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role && (req.user.role === 'Admin' || req.user.role === 'Profesor')) {
      user.role = role;
    }
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    if (creditos) user.creditos = creditos;
    if (turnosSemanales) user.turnosSemanales = turnosSemanales;
    if (turnosMensuales) user.turnosMensuales = turnosMensuales;

    await user.save();

    res.json({
      _id: user._id,
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

// Activar / desactivar usuario
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
  getUserById,
  getUserProfile,
  updateUserProfile,
  desactivarUsuario,
  getAllUsers,
  getTurnosSemanalesPorUsuario,
  getTurnosMensualesPorUsuario,
};