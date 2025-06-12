const mongoose = require('mongoose');

const PlantillaTurnoUsuarioSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  activo: {
    type: Boolean,
    default: true
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.models.PlantillaTurnoUsuario || mongoose.model('PlantillaTurnoUsuario', PlantillaTurnoUsuarioSchema);
