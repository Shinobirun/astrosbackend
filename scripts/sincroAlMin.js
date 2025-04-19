const mongoose = require('mongoose');
const TurnoSemanal = require('../models/TurnoSemanal');
const TurnoMensual = require('../models/TurnoMensual');

mongoose.connect('mongodb://localhost:27017/astros_fulgor_test4')
  .then(() => {
    console.log('Conectado a MongoDB');

    const sincronizarTurnos = async () => {
      try {
        console.log(`[${new Date().toLocaleString()}] Sincronizando turnos...`);

        await TurnoSemanal.deleteMany();

        const turnosMensuales = await TurnoMensual.find();

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
    };

    // Alinear al próximo minuto
    const now = new Date();
    const delay = (60 - now.getSeconds()) * 1000;

    setTimeout(() => {
      sincronizarTurnos(); // primera ejecución alineada al minuto

      // luego, cada minuto
      setInterval(sincronizarTurnos, 60 * 1000);
    }, delay);

  }).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
  });
