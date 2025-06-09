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
    // 1) Obtener el ID del usuario
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: 'ID de usuario no encontrado' });
    }

    // 2) Cargar el usuario con su array de creditos
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 3) Verificar que tenga créditos
    if (!user.creditos || user.creditos.length === 0) {
      return res.status(404).json({ message: 'No hay créditos para eliminar' });
    }

    // 4) Buscar el crédito más antiguo entre los que el usuario tiene referenciados
    const creditosDocs = await Credito.find({ 
      _id: { $in: user.creditos } 
    }).sort({ creadoEn: 1 });

    if (creditosDocs.length === 0) {
      return res.status(404).json({ message: 'No hay créditos válidos para eliminar' });
    }

    const oldest = creditosDocs[0];
    // 5) Eliminar el documento del crédito más antiguo
    await Credito.findByIdAndDelete(oldest._id);

    // 6) Quitar esa referencia del array del usuario
    user.creditos = user.creditos.filter(id => id.toString() !== oldest._id.toString());
    await user.save();

    // 7) Eliminar de la colección TODOS los créditos que NO estén en user.creditos
    await Credito.deleteMany({
      usuario: userId,
      _id: { $nin: user.creditos }
    });

    // 8) Responder con la lista actualizada
    return res.json({
      message: 'Crédito más viejo eliminado y sincronizados los restantes',
      creditosRestantes: user.creditos
    });
    
  } catch (error) {
    console.error('Error en deleteOldestCredito:', error);
    return res.status(500).json({ 
      message: 'Error al eliminar el crédito más viejo', 
      error: error.message 
    });
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
