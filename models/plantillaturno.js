const mongoose = require('mongoose');

const PlantillaTurnoSchema = new mongoose.Schema({
  dia: {
    type: String, // 'Lunes', 'Martes', etc.
    required: true
  },
  hora: {
    type: String, // formato 'HH:mm'
    required: true
  },
  sede: {
    type: String,
    required: true
  },
  nivel: {
    type: String,
    required: true
  },
  cuposDisponibles: {
    type: Number,
    required: true
  },

  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activo: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.models.PlantillaTurno || mongoose.model('PlantillaTurno', PlantillaTurnoSchema);