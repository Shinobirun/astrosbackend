const Credito = require('../models/creditos');
const dayjs = require('dayjs');

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

// Crear un nuevo crédito
const createCredito = async (req, res) => {
  try {
    const { usuario, venceEn } = req.body;
    
    const nuevoCredito = new Credito({
      usuario,
      venceEn: venceEn ? new Date(venceEn) : undefined, // Si no se pasa, usa el default del esquema
    });

    await nuevoCredito.save();

    res.status(201).json({ message: 'Crédito creado', credito: nuevoCredito });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el crédito', error });
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
};
