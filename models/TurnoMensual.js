const mongoose = require('mongoose');

const turnoMensualSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: true,
  },
  sede: {
    type: String,
    required: true,
    enum: ['Palermo', 'Fulgor'],
  },
  nivel: {
    type: String,
    required: true,
    enum: ['Blanco', 'Azul', 'Violeta'],
  },
  dia: {
    type: String,
    required: true,
    enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  },
  hora: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
      },
      message: props => `${props.value} no es un formato de hora válido (debe ser HH:mm en 24 horas)`,
    },
  },
  cuposDisponibles: {
    type: Number,
    required: true,
    min: [1, 'Debe haber al menos 1 cupo disponible'],
  },
  ocupadoPor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  activo: {
    type: Boolean,
    default: true,
  }
});

// Validación: que los usuarios no superen los cupos
turnoMensualSchema.pre('save', function (next) {
  if (this.ocupadoPor.length > this.cuposDisponibles) {
    return next(new Error('La cantidad de usuarios no puede exceder los cupos disponibles'));
  }
  next();
});

module.exports = mongoose.model('TurnoMensual', turnoMensualSchema);