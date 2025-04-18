const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    //console.log(`MongoDB conectado en:`, conn.connection);
    //console.log(`Nombre de la base de datos: ${conn.connection?.name}`);
    //console.log(`Estado de la conexión: ${mongoose.connection.readyState}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Detener el servidor si falla la conexión
  }
};

module.exports = connectDB;
