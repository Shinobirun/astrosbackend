const TurnoSemanal = require('../models/TurnoSemanal');
const Turno = require('../models/TurnoSemanal');
const User = require('../models/User');
const Credito = require('../models/creditos');
const mongoose = require('mongoose');

const getTurnosDisponibles = async (req, res) => {
  try {
    const turnos = await Turno.find({
      $expr: { $lt: [{ $size: '$ocupadoPor' }, '$cuposDisponibles'] },
      activo: true
    }).populate('ocupadoPor', 'firstName lastName role'); // solo los campos que quieras mostrar

    res.json(turnos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los turnos', error: error.message });
  }
};

// Liberar turno
const liberarTurno = async (req, res) => {
  const { turnoId, userId } = req.body;
  const esAdminOProfesor = ['Admin', 'Profesor'].includes(req.user.role);

  if (userId && !esAdminOProfesor) {
    return res.status(403).json({ message: 'No tienes permiso para liberar turnos de otros usuarios' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(turnoId)) {
      return res.status(400).json({ message: 'ID de turno inválido' });
    }

    const turno = await TurnoSemanal.findById(turnoId);
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });

    const idUsuario = esAdminOProfesor && userId ? userId : req.user.id;

    if (!turno.ocupadoPor.includes(idUsuario)) {
      return res.status(400).json({ message: 'El usuario no tenía este turno asignado' });
    }

    turno.ocupadoPor = turno.ocupadoPor.filter(uid => uid.toString() !== idUsuario.toString());
    turno.cuposDisponibles += 1;
    await turno.save();

    const user = await User.findById(idUsuario);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.turnosSemanales = user.turnosSemanales.filter(tid => tid.toString() !== turnoId);
    await user.save();

    // 👉 Crear un nuevo crédito para el usuario
    const nuevoCredito = new Credito({ usuario: idUsuario });
    await nuevoCredito.save();

    res.status(200).json({ message: 'Turno liberado correctamente y crédito creado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al liberar el turno' });
  }
};

// Obtener los turnos por usuario
const getTurnosPorUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.findById(id).populate('turnoSemanales');

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(usuario.turnoSemanales);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo los turnos', error: error.message });
  }
};

// Obtener turno por ID
const getTurnoById = async (req, res) => {
  try {
    const turno = await Turno.findById(req.params.id);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }
    res.status(200).json(turno);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el turno', error: error.message });
  }
};




// Obtener todos los turnos
const getTodosLosTurnos = async (req, res) => {
  try {
    const turnos = await Turno.find();
    res.json(turnos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los turnos', error: error.message });
  }
};

// Eliminar turno
const eliminarTurno = async (req, res) => {
  try {
    if (!['Admin', 'Profesor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar turnos' });
    }

    const { id } = req.params;
    const turnoEliminado = await Turno.findByIdAndDelete(id);

    if (!turnoEliminado) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    res.json({ message: 'Turno eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el turno', error: error.message });
  }
};

// Asignar turno manualmente
const asignarTurnoManual = async (req, res) => {
  const { turnoId, userId } = req.body;

  if (!['Admin', 'Profesor'].includes(req.user.role)) {
    return res.status(403).json({ message: 'No tienes permiso para asignar turnos manualmente' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(turnoId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de turno o usuario inválido' });
    }

    const turno = await Turno.findById(turnoId);
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });

    if (!Array.isArray(turno.ocupadoPor)) {
      turno.ocupadoPor = [];
    }

    if (turno.ocupadoPor.includes(userId)) {
      return res.status(400).json({ message: 'El usuario ya tiene este turno asignado' });
    }

    if (turno.ocupadoPor.length >= turno.cuposDisponibles) {
      return res.status(400).json({ message: 'No hay cupos disponibles' });
    }

    turno.ocupadoPor.push(userId);
    await turno.save();

    const usuario = await User.findById(userId);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (!Array.isArray(usuario.turnosSemanales)) {
      usuario.turnosSemanales = [];
    }

    const turnoIdStr = turnoId.toString();
    if (!usuario.turnosSemanales.some(id => id.toString() === turnoIdStr)) {
      usuario.turnosSemanales.push(turnoId);
      await usuario.save();
    }

    res.status(200).json({ message: 'Turno asignado correctamente' });
  } catch (error) {
    console.error('Error al asignar turno manualmente:', error);
    res.status(500).json({ message: 'Error al asignar turno manualmente', error: error.message });
  }
};

const getTurnosSemanalesDisponibles = async (req, res) => {
  try {
    const rolUsuario = req.user.role;

    if (!rolUsuario) {
      return res.status(400).json({ message: 'No se encontró el rol del usuario' });
    }

    // Determinar los niveles permitidos según el rol del usuario
    let nivelesPermitidos = [];
    switch (rolUsuario) {
      case 'Blanco':
        nivelesPermitidos = ['Blanco'];
        break;
      case 'Azul':
        nivelesPermitidos = ['Blanco', 'Azul'];
        break;
      case 'Violeta':
        nivelesPermitidos = ['Azul', 'Violeta'];
        break;
      default:
        return res.status(400).json({ message: 'Rol no válido' });
    }

    // Buscar turnos activos con cupos disponibles, filtrando por nivel
    const turnos = await Turno.find({
      nivel: { $in: nivelesPermitidos },
      activo: true,
      $expr: { $lt: [{ $size: "$ocupadoPor" }, "$cuposDisponibles"] }
    }).lean(); // .lean() devuelve objetos planos en lugar de documentos de Mongoose

    // Agregar campo "cuposRestantes" a cada turno
    const turnosConCupos = turnos.map(t => ({
      ...t,
      cuposRestantes: t.cuposDisponibles - t.ocupadoPor.length
    }));

    res.json(turnosConCupos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los turnos disponibles', error: error.message });
  }
};

const tomarTurno = async (req, res) => {
  const userId = req.user._id;
  const turnoId = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(turnoId)) {
      return res.status(400).json({ message: 'ID de turno inválido' });
    }

    const turno = await Turno.findById(turnoId);
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });

    if (!Array.isArray(turno.ocupadoPor)) turno.ocupadoPor = [];

    if (turno.ocupadoPor.includes(userId.toString())) {
      return res.status(400).json({ message: 'Ya tenés este turno asignado' });
    }

    if (turno.ocupadoPor.length >= turno.cuposDisponibles) {
      return res.status(400).json({ message: 'No hay cupos disponibles' });
    }

    const usuario = await User.findById(userId);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Buscar el crédito más viejo NO usado y NO vencido
    const creditoDisponible = await Credito.findOne({
      usuario: userId,
      usado: false,
      venceEn: { $gte: new Date() }
    }).sort({ creadoEn: 1 });

    if (!creditoDisponible) {
      return res.status(400).json({ message: 'No tenés créditos disponibles' });
    }

    // Marcar el crédito como usado
    creditoDisponible.usado = true;
    await creditoDisponible.save();

    // Asignar el turno
    turno.ocupadoPor.push(userId);
    await turno.save();

    if (!Array.isArray(usuario.turnosSemanales)) usuario.turnosSemanales = [];

    const turnoIdStr = turnoId.toString();
    if (!usuario.turnosSemanales.some(id => id.toString() === turnoIdStr)) {
      usuario.turnosSemanales.push(turnoId);
    }

    await usuario.save();

    res.status(200).json({ message: 'Turno tomado correctamente' });
  } catch (error) {
    console.error('Error al tomar turno:', error);
    res.status(500).json({ message: 'Error al tomar turno', error: error.message });
  }
};



module.exports = {
  getTurnosDisponibles,
  liberarTurno,
  getTurnosPorUsuario,
  getTurnoById,
  getTodosLosTurnos,
  eliminarTurno,
  asignarTurnoManual,
  getTurnosSemanalesDisponibles,
  tomarTurno
};
