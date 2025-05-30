const Credito = require('../models/creditos');
const dayjs = require('dayjs');
const User = require('../models/User');

// Obtener crédito por ID
const getCreditoById = async (req, res) => {
  try {
    const { id } = req.params;
    const credito = await Credito.findById(id);

    if (!credito) {
      return res.status(404).json({ message: 'Crédito no encontrado' });
    }

    res.json(credito);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el crédito', error });
  }
};

// Obtener créditos por usuario
const getCreditosByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const creditos = await Credito.find({ usuario: userId });

    res.json(creditos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los créditos', error });
  }
};

//Crea creditos

const createCredito = async (req, res) => {
  try {
    const { usuario, venceEn } = req.body;

    // 1️⃣ Validar que se pase el usuario
    if (!usuario) {
      return res.status(400).json({ message: 'El campo "usuario" es obligatorio.' });
    }

    // 2️⃣ Crear el crédito
    const nuevoCredito = new Credito({
      usuario,
      // Si viene venceEn, lo convertimos; si no, el default del esquema se encargará
      ...(venceEn && { venceEn: new Date(venceEn) }),
    });
    await nuevoCredito.save();

    // 3️⃣ Asociar el crédito al usuario
    const user = await User.findById(usuario);
    if (user) {
      user.creditos = user.creditos || [];
      user.creditos.push(nuevoCredito._id);
      await user.save();
    }

    // 4️⃣ Devolver respuesta
    res.status(201).json({
      message: 'Crédito creado correctamente.',
      credito: nuevoCredito,
    });
  } catch (error) {
    console.error('Error al crear el crédito:', error);
    res.status(500).json({ message: 'Error al crear el crédito', error: error.message });
  }
};

// Eliminar crédito por ID
const deleteCreditoById = async (req, res) => {
  try {
    const { id } = req.params;
    await Credito.findByIdAndDelete(id);

    res.json({ message: 'Crédito eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el crédito', error });
  }
};

const deleteOldestCredito = async (req, res) => {
  try {
    const userId = req.user.id; 

    // Buscamos el crédito más viejo según creadoEn
    const oldestCredito = await Credito.findOne({ userId }).sort({ creadoEn: 1 }); // Ascendente = más viejo primero

    if (!oldestCredito) {
      return res.status(404).json({ message: 'No hay créditos para eliminar' });
    }

    await Credito.findByIdAndDelete(oldestCredito._id);

    res.json({ message: 'Crédito más viejo eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el crédito más viejo', error });
  }
};


// Eliminar créditos vencidos automáticamente
const deleteExpiredCreditos = async (req, res) => {
  try {
    const fechaHoy = dayjs().toDate();
    const result = await Credito.deleteMany({ venceEn: { $lt: fechaHoy } });

    console.log(`Créditos vencidos eliminados: ${result.deletedCount}`);
    res.json({ message: 'Créditos vencidos eliminados', eliminados: result.deletedCount });
  } catch (error) {
    console.error('Error al eliminar créditos vencidos', error);
    res.status(500).json({ message: 'Error al eliminar créditos vencidos', error });
  }
};
// Ejecutar la eliminación automática cada día a medianoche
setInterval(deleteExpiredCreditos, 24 * 60 * 60 * 1000);

module.exports = {
  getCreditoById,
  getCreditosByUser,
  createCredito,
  deleteCreditoById,
  deleteExpiredCreditos,
  deleteOldestCredito
};
