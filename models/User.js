const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const turnoSemanal = require('./TurnoSemanal');
const TurnoMensual = require('./TurnoMensual')

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Profesor', 'Violeta', 'Azul', 'Blanco'], required: true },
    
    // 🔄 Nuevos campos
    turnosSemanales: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TurnoSemanal' }],
    turnosMensuales: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TurnoMensual' }],

     
    
    creditos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Credito' }],
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Comparar contraseñas
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error("Error al comparar contraseñas:", error);
    return false;
  }
};

// Middleware antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);