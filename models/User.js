const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const TurnoMensual = require('./TurnoMensual');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: false,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      validate: {
        validator: function (v) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v);
        },
        message:
          'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.',
      },
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    telefono: { type: String }, // 👉 Agregado (podés hacerlo required si querés)

    role: {
      type: String,
      enum: ['Admin', 'Profesor', 'Violeta', 'Azul', 'Blanco'],
      required: true,
    },

    
    turnosMensuales: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'TurnoMensual' },
    ],

    creditos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Credito' }],
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 🔐 Método para comparar contraseñas
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('Error al comparar contraseñas:', error);
    return false;
  }
};

// 🔐 Middleware para hashear antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
