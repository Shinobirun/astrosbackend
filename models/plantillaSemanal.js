const mongoose = require('mongoose');

const plantillaSemanalSchema = new mongoose.Schema({
  diaSemana: {
    type: String,
    enum: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    required: true
  },
  hora: { type: String, required: true }, 
  sede: { type: String, required: true },
  nivel: { type: String, required: true }, 
  cuposDisponibles: { type: Number, required: true }
});

module.exports = mongoose.model('PlantillaSemanal', plantillaSemanalSchema);