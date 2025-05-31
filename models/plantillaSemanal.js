const mongoose = require('mongoose');

const plantillaSemanalSchema = new mongoose.Schema({
  diaSemana: {
    type: String,
    enum: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    required: true
  },
  hora: { type: String, required: true }, // Ej: '19:00'
  sede: { type: String, required: true },
  nivel: { type: String, required: true }, // Ej: 'inicial', 'intermedio', etc.
  cuposDisponibles: { type: Number, required: true }
});

module.exports = mongoose.model('PlantillaSemanal', plantillaSemanalSchema);