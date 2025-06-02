require('dotenv').config();
process.env.TZ = 'America/Argentina/Buenos_Aires'; // Antes de usar fechas

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

// Modelos
const TurnoSemanal = require('./models/TurnoSemanal');
const TurnoMensual = require('./models/TurnoMensual');
const Credito = require('./models/creditos');
const PlantillaTurno = require('./models/plantillaturno'); // corregido

// Scripts y conexión
const inicializarTurnosBase = require('./scripts/iniciadorTurnosBase');
const inicializarPlantillasBase = require('./scripts/inicializadorplantilla');
const generarTurnosMesSiguiente = require('./scripts/generarTurnosMes');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Rutas (antes de iniciar la conexión)
const userRoutes = require('./routes/userRoutes');
const turnoRoutes = require('./routes/turnoRoutes');
const creditoRoutes = require('./routes/creditoRoutes');
const turnoRouteSema = require('./routes/turnoRouSema');

app.use('/api/users', userRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/creditos', creditoRoutes);


// Conexión a la base de datos y tareas iniciales
connectDB()
  .then(async () => {
    console.log('Conectado a la base de datos');

    await inicializarPlantillasBase();
    await inicializarTurnosBase();

    // Cron para eliminar créditos vencidos cada hora
    cron.schedule('0 * * * *', async () => {
      try {
        const resultado = await Credito.deleteMany({ venceEn: { $lte: new Date() } });
        console.log(`[${new Date().toLocaleString()}] 🧹 Créditos vencidos eliminados: ${resultado.deletedCount}`);
      } catch (error) {
        console.error('❌ Error eliminando créditos vencidos:', error);
      }
    });

    // Cron para crear turnos del mes siguiente cada día 20 a la 1 AM (hora Argentina)
    cron.schedule('0 1 20 * *', async () => {
      try {
        console.log(`[${new Date().toLocaleString()}] ⏳ Iniciando generación de turnos del mes siguiente...`);
        await generarTurnosMesSiguiente();
        console.log(`[${new Date().toLocaleString()}] ✅ Turnos del mes siguiente generados.`);
      } catch (error) {
        console.error('❌ Error generando turnos del mes siguiente:', error);
      }
    }, {
      timezone: 'America/Argentina/Buenos_Aires'
    });

  })
  .catch(err => {
    console.error('Error conectando a la base de datos:', err);
    process.exit(1); // Opcional: salir si no se conecta
  });

// Iniciar servidor
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
