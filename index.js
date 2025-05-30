require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

// Modelos
const TurnoSemanal = require('./models/TurnoSemanal');
const TurnoMensual = require('./models/TurnoMensual');
const Credito = require('./models/creditos');

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

  // Inicializar turnos base
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

 cron.schedule('* * * * *', async () => {
  try {
    const ahora = new Date();

    // Paso 1: Buscar créditos vencidos
    const vencidos = await Credito.find({ venceEn: { $lt: ahora } });

    if (vencidos.length === 0) {
      console.log(`[${new Date().toLocaleString()}] 🧹 No hay créditos vencidos para eliminar.`);
    } else {
      const idsVencidos = vencidos.map(c => c._id);
      const usuariosAfectados = vencidos.map(c => c.usuario);

      // Paso 2: Eliminar créditos vencidos
      const result = await Credito.deleteMany({ _id: { $in: idsVencidos } });
      console.log(`[${new Date().toLocaleString()}] 🧹 Créditos vencidos eliminados: ${result.deletedCount}`);

      // Paso 3: Eliminar referencias en usuarios
      const updateResult = await User.updateMany(
        { _id: { $in: usuariosAfectados } },
        { $pull: { creditos: { $in: idsVencidos } } }
      );
      console.log(`[${new Date().toLocaleString()}] 👤 Usuarios actualizados (refs vencidas): ${updateResult.modifiedCount}`);
    }

    // Paso 4: Limpiar referencias rotas en general
    const creditosExistentes = await Credito.find({}, '_id');
    const idsValidos = creditosExistentes.map(c => c._id);

    const resultadoLimpieza = await User.updateMany(
      {},
      { $pull: { creditos: { $nin: idsValidos } } }
    );
    console.log(`[${new Date().toLocaleString()}] 🧼 Limpieza general: usuarios con referencias rotas limpiados: ${resultadoLimpieza.modifiedCount}`);

  } catch (error) {
    console.error(`[${new Date().toLocaleString()}] ❌ Error en el cron de limpieza de créditos:`, error);
  }
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
