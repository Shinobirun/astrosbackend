const mongoose = require('mongoose');
const cron = require('node-cron');
const TurnoSemanal = require('../models/TurnoSemanal');
const TurnoMensual = require('../models/TurnoMensual');

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/astros_fulgor_test4', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado a MongoDB');

  // Cron: todos los domingos a las 00:00 (hora del sistema)
  cron.schedule('0 0 * * 0', async () => {
    try {
      console.log(`[${new Date().toLocaleString()}] Sincronizando turnos...`);

      // Borramos todos los turnos Semanales
      await TurnoSemanal.deleteMany();

      // Obtenemos todos los turnos mensuales
      const turnosMensuales = await TurnoMensual.find();

      // Los copiamos a la colección TurnoSemanal
      for (const turnoMensual of turnosMensuales) {
        const nuevoTurnoSemanal = new TurnoSemanal({
          turnoMensualId: turnoMensual._id,
          sede: turnoMensual.sede,
          nivel: turnoMensual.nivel,
          dia: turnoMensual.dia,
          hora: turnoMensual.hora,
          cuposDisponibles: turnoMensual.cuposDisponibles,
          activo: turnoMensual.activo,
        });

        await nuevoTurnoSemanal.save();
      }

      console.log('✔️ Turnos sincronizados correctamente.');
    } catch (error) {
      console.error('❌ Error durante la sincronización:', error);
    }
  });

}).catch(err => {
  console.error('Error al conectar a MongoDB:', err);
});