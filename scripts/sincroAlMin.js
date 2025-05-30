const mongoose = require('mongoose');
const TurnoSemanal = require('../models/TurnoSemanal');
const TurnoMensual = require('../models/TurnoMensual');
const Credito = require('../models/creditos'); // ajustá el path según tu estructura
const User = require('../models/User');
require('dotenv').config();


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






const deleteExpiredCreditos = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const hoy = new Date();

    // Buscar créditos vencidos
    const vencidos = await Credito.find({ venceEn: { $lt: hoy } });

    if (vencidos.length === 0) {
      console.log('No hay créditos vencidos.');
      await mongoose.disconnect();
      return process.exit(0);
    }

    const idsVencidos = vencidos.map(c => c._id);
    const usuariosAfectados = vencidos.map(c => c.usuario);

    // 1. Eliminar créditos de la colección Credito
    const result = await Credito.deleteMany({ _id: { $in: idsVencidos } });
    console.log(`Se eliminaron ${result.deletedCount} créditos vencidos.`);

    // 2. Eliminar las referencias en los usuarios
    const updateResult = await User.updateMany(
      { _id: { $in: usuariosAfectados } },
      { $pull: { creditos: { $in: idsVencidos } } }
    );
    console.log(`Usuarios actualizados: ${updateResult.modifiedCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error al eliminar créditos vencidos:', error);
    process.exit(1);
  }
};

deleteExpiredCreditos();
