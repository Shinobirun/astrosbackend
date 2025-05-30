const Credito = require('../models/creditos');
const User = require('../models/User');

module.exports = async () => {
  const creditosValidos = await Credito.find({}, '_id');
  const idsValidos = creditosValidos.map(c => c._id.toString());

  const usuarios = await User.find({}, '_id creditos');

  let totalUsuariosModificados = 0;

  for (const usuario of usuarios) {
    const creditosUsuario = usuario.creditos.map(id => id.toString());
    const creditosLimpios = creditosUsuario.filter(id => idsValidos.includes(id));

    if (creditosUsuario.length !== creditosLimpios.length) {
      usuario.creditos = creditosLimpios;
      await usuario.save();
      totalUsuariosModificados++;
      console.log(`🧼 Referencias rotas eliminadas para usuario: ${usuario._id}`);
    }
  }

  console.log(`✅ Limpieza completada. Usuarios modificados: ${totalUsuariosModificados}`);
};
