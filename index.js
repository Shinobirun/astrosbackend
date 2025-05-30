require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

// Modelos
const TurnoSemanal = require('./models/TurnoSemanal');
const TurnoMensual = require('./models/TurnoMensual');
const Credito = require('./models/creditos');
const User = require('./models/User');

// Scripts y conexión
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

  await inicializarTurnosBase();

  // Zona horaria
  process.env.TZ = 'America/Argentina/Buenos_Aires';

  // 🔁 CRON 1: Sincronizar turnos semanales → todos los domingos a la 01:00 AM
  cron.schedule('0 1 * * 0', async () => {
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
      console.error('❌ Error sincronizando turnos semanales:', error);
    }
  });

  // 🔁 CRON 2: Eliminar créditos vencidos → cada minuto
  cron.schedule('0 * * * *', async () => {
    try {
      const hoy = new Date();
      const vencidos = await Credito.find({ venceEn: { $lt: hoy } });

      if (vencidos.length > 0) {
        const idsVencidos = vencidos.map(c => c._id);
        const usuariosAfectados = vencidos.map(c => c.usuario);

        const result = await Credito.deleteMany({ _id: { $in: idsVencidos } });
        console.log(`🧹 Créditos vencidos eliminados: ${result.deletedCount}`);

        const updateResult = await User.updateMany(
          { _id: { $in: usuariosAfectados } },
          { $pull: { creditos: { $in: idsVencidos } } }
        );
        console.log(`👤 Usuarios actualizados: ${updateResult.modifiedCount}`);
      } else {
        console.log('🟢 No hay créditos vencidos');
      }
    } catch (error) {
      console.error('❌ Error eliminando créditos vencidos:', error);
    }
  });

  // 🔁 CRON 3: Limpiar referencias rotas → cada minuto
  cron.schedule('0 * * * *', async () => {
    try {
      const creditosValidos = await Credito.find({}, '_id');
      const idsValidos = creditosValidos.map(c => c._id.toString());

      const usuarios = await User.find({}, '_id creditos');

      let modificados = 0;

      for (const usuario of usuarios) {
        const creditosLimpios = usuario.creditos.filter(c => idsValidos.includes(c.toString()));
        if (creditosLimpios.length !== usuario.creditos.length) {
          usuario.creditos = creditosLimpios;
          await usuario.save();
          modificados++;
        }
      }

      if (modificados > 0) {
        console.log(`🧼 Usuarios con referencias rotas limpiados: ${modificados}`);
      }
    } catch (error) {
      console.error('❌ Error limpiando referencias rotas:', error);
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

// Iniciar servidor
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
