const PlantillaTurnoUsuario = require('../models/PlantillaTurnoUsuario');

// 1. Crear una nueva plantilla de turno para un usuario
const crearPlantillaTurnoUsuario = async (req, res) => {
  try {
    const { usuario, dia, hora, sede, nivel } = req.body;

    const nuevaPlantilla = new PlantillaTurnoUsuario({
      usuario,
      dia,
      hora,
      sede,
      nivel,
      creadoPor: req.user?._id || null // si usás auth
    });

    await nuevaPlantilla.save();
    res.status(201).json(nuevaPlantilla);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la plantilla de turno.' });
  }
};

// 2. Obtener todas las plantillas de turno por usuario (opcional filtro)
const listarPlantillasTurnoUsuario = async (req, res) => {
  try {
    const { usuario } = req.query;
    const filtro = usuario ? { usuario } : {};

    const plantillas = await PlantillaTurnoUsuario.find(filtro).populate('usuario');
    res.status(200).json(plantillas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las plantillas de turno.' });
  }
};

// 3. Eliminar (desactivar) una plantilla de turno
const eliminarPlantillaTurnoUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const plantilla = await PlantillaTurnoUsuario.findById(id);
    if (!plantilla) {
      return res.status(404).json({ error: 'Plantilla no encontrada.' });
    }

    plantilla.activo = false;
    await plantilla.save();

    res.status(200).json({ mensaje: 'Plantilla desactivada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la plantilla de turno.' });
  }
};

module.exports = {
  crearPlantillaTurnoUsuario,
  listarPlantillasTurnoUsuario,
  eliminarPlantillaTurnoUsuario
};