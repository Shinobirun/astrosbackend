const Credito = require('../models/creditos');
const User = require('../models/User');

module.exports = async () => {
  const hoy = new Date();
  const vencidos = await Credito.find({ venceEn: { $lt: hoy } });

  if (vencidos.length === 0) {
    console.log('🟢 No hay créditos vencidos.');
    return;
  }

  const idsVencidos = vencidos.map(c => c._id);
  const usuariosAfectados = vencidos.map(c => c.usuario);

  const result = await Credito.deleteMany({ _id: { $in: idsVencidos } });
  console.log(`🧹 Créditos vencidos eliminados: ${result.deletedCount}`);

  const updateResult = await User.updateMany(
    { _id: { $in: usuariosAfectados } },
    { $pull: { creditos: { $in: idsVencidos } } }
  );
  console.log(`👤 Usuarios actualizados: ${updateResult.modifiedCount}`);
};
