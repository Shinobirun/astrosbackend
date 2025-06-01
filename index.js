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

  

  // 🔁 CRON 2: Eliminar créditos vencidos → cada hora
  cron.schedule('0   * * * *', async () => {
    try {
      const resultado = await Credito.deleteMany({ venceEn: { $lte: new Date() } });
      console.log(`[${new Date().toLocaleString()}] 🧹 Créditos vencidos eliminados: ${resultado.deletedCount}`);
    } catch (error) {
      console.error('❌ Error eliminando créditos vencidos:', error);
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
