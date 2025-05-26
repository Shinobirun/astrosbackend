require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const TurnoSemanal = require('./models/TurnoSemanal');
const TurnoMensual = require('./models/TurnoMensual');
const inicializarTurnosBase = require('./scripts/iniciadorTurnosBase.js');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Conexión a la base de datos
connectDB().then(async () => {
  console.log('Conectado a la base de datos');
  
  // Inicializar los turnos base
  await inicializarTurnosBase();

  // 🔁 CRON: Todos los domingos a las 00:00
  process.env.TZ = 'America/Argentina/Buenos_Aires';
  cron.schedule('0 20 * * 1', async () => {
    try {
      console.log(`[${new Date().toLocaleString()}] ⏳ Sincronizando turnos semanales...`);
      await TurnoSemanal.deleteMany();
      const turnosMensuales = await TurnoMensual.find();

      for (const turno of turnosMensuales) {
        await new TurnoSemanal({
          turnoMensualId: turno._id,
          sede: turno.sede,
          nivel: turno.nivel,
          dia: turno.dia,
          hora: turno.hora,
          cuposDisponibles: turno.cuposDisponibles,
          activo: turno.activo,
        }).save();
      }

      console.log('✔️ Turnos semanales sincronizados');
    } catch (error) {
      console.error('❌ Error durante sincronización:', error);
    }
  });
});

// Rutas
const userRoutes = require('./routes/userRoutes.js');
const turnoRoutes = require('./routes/turnoRoutes');
const creditoRoutes = require('./routes/creditoRoutes.js');
const turnoRouteSema = require('./routes/turnoRouSema.js');

app.use('/api/users', userRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/creditos', creditoRoutes);
app.use('/api/turnosSemanales', turnoRouteSema);

// Iniciar Servidor
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
console.log('JWT_SECRET:', process.env.JWT_SECRET);
