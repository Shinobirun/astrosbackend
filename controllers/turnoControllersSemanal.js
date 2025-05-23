const Turno = require('../models/TurnoSemanal');
const User = require('../models/User');
const Credito = require('../models/creditos');
const mongoose = require('mongoose');

/* Listar turnos disponibles
const getTurnosDisponibles = async (req, res) => {
  try {
    const turnos = await Turno.find({
      $expr: { $lt: [{ $size: '$ocupadoPor' }, '$cuposDisponibles'] },
      activo: true
    });
    res.json(turnos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los turnos', error: error.message });
  }
};   */

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

    const turno = await Turno.findById(turnoId);
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


// Tomar turno (comentado por ahora)
/*
const tomarTurno = async (req, res) => {
  const { turnoId, userId } = req.body;
  const esAdminOProfesor = ['Admin', 'Profesor'].includes(req.user.role);

  if (userId && !esAdminOProfesor) {
    return res.status(403).json({ message: 'No tienes permiso para asignar turnos a otros usuarios' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(turnoId)) {
      return res.status(400).json({ message: 'ID de turno inválido' });
    }

    const turno = await Turno.findById(turnoId);
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });

    const idUsuario = esAdminOProfesor && userId ? userId : req.user.id;

    if (turno.ocupadoPor.includes(idUsuario)) {
      return res.status(400).json({ message: 'El usuario ya tiene este turno' });
    }

    if (turno.ocupadoPor.length >= turno.cuposDisponibles) {
      return res.status(400).json({ message: 'No hay cupos disponibles' });
    }

    const credito = await Credito.findOneAndDelete({ usuario: idUsuario, usado: false });

    if (!credito) {
      return res.status(400).json({ message: 'El usuario no tiene créditos disponibles' });
    }

    turno.ocupadoPor.push(idUsuario);
    await turno.save();

    res.json({
      message: 'Turno tomado exitosamente',
      cuposOcupados: turno.ocupadoPor.length,
      cuposDisponibles: turno.cuposDisponibles - turno.ocupadoPor.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al tomar turno' });
  }
};
*/

// Obtener los turnos por usuario
const getTurnosPorUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.findById(id).populate('turnoSemanal');

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(usuario.turnoSemanal);
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

// Crear turno
const crearTurno = async (req, res) => {
  try {
    const { sede, nivel, dia, hora, cuposDisponibles } = req.body;

    if (!sede || !nivel || !dia || !hora) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const CUPOS_POR_SEDE = {
      Palermo: 10,
      Fulgor: 12
    };

    const nuevoTurno = new Turno({
      sede,
      nivel,
      dia,
      hora,
      cuposDisponibles: cuposDisponibles !== undefined ? cuposDisponibles : (CUPOS_POR_SEDE[sede] || 0)
    });

    await nuevoTurno.save();
    res.status(201).json({ message: 'Turno creado exitosamente', turno: nuevoTurno });

  } catch (error) {
    res.status(500).json({ message: 'Error al crear el turno', error: error.message });
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



module.exports = {
  getTurnosDisponibles,
  liberarTurno,
  getTurnosPorUsuario,
  getTurnoById,
  crearTurno,
  getTodosLosTurnos,
  eliminarTurno,
  asignarTurnoManual,
  // tomarTurno // Solo si lo necesitas descomentar
};
