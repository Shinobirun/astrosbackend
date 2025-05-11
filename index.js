require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const inicializarTurnosBase = require('./scripts/iniciadorTurnosBase.js');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Conexión a la base de datos
const connectDB = require('./config/db');

connectDB().then(async () => {
  console.log('Conectado a la base de datos');
  
  // Inicializar los turnos base
  await inicializarTurnosBase();
});

// Rutas
const userRoutes = require('./routes/userRoutes.js');
const turnoRoutes = require('./routes/turnoRoutes');
const creditoRoutes= require('./routes/creditoRoutes.js');
const turnoRouteSema= require('./routes/turnoRouSema.js')

app.use('/api/users', userRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/creditos', creditoRoutes);
app.use('/api/turnosSemanales',turnoRouteSema)

// Iniciar Servidor
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
