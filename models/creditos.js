const mongoose = require('mongoose');

const creditoSchema = new mongoose.Schema(
  {
    usuario: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },

    // Fecha de creación explícita (opcional si ya usás timestamps)
    creadoEn: { 
      type: Date, 
      default: Date.now 
    },

    // Fecha de vencimiento (15 días después de creado)
    venceEn: { 
      type: Date,
      default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días
      validate: {
        validator: function (v) {
          return v > this.creadoEn;
        },
        message: 'La fecha de vencimiento debe ser posterior a la de creación.',
      }
    },

    usado: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

// Índices para optimizar búsquedas
creditoSchema.index({ usuario: 1 });
creditoSchema.index({ venceEn: 1 });

module.exports = mongoose.model('Credito', creditoSchema);
