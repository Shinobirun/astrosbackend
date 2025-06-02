const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const plantillaTurnoUsuarioSchema = new Schema({
  dia: {
    type: String,
    enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    required: true
  },
  hora: {
    type: String,
    required: true
  },
  sede: {
    type: String,
    required: true
  },
  usuariosAsignados: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

module.exports = mongoose.model('PlantillaTurnoUsuario', plantillaTurnoUsuarioSchema) ||  mongoose.model('PlantillaTurUsuario', plantillaTurnoUsuarioSchema);
