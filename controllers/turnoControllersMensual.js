const Turno = require('../models/TurnoMensual');
const User = require('../models/User');
const Credito = require('../models/creditos');
const mongoose = require('mongoose');
const moment = require('moment');

// Listar turnos disponibles
const getTurnosDisponibles = async (req, res) => {
  try {
    const turnos = await Turno.find({
      $expr: { $lt: [{ $size: '$ocupadoPor' }, '$cuposDisponibles'] },
      activo: true
    }).populate('ocupadoPor', 'firstName lastName role');

    res.json(turnos);
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({ message: 'Error al obtener los turnos', error: error.message });
  }
};

// Liberar turno
// - Admin/Profesor puede liberar cualquiera (pasando userId opcional).
// - Usuario normal solo puede liberar sus propios turnos.

const liberarTurno = async (req, res) => {
  const { turnoId, userId } = req.body;
  const rol = req.user.role;
  const idSolicitante = req.user.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(turnoId)) {
      return res.status(400).json({ message: 'ID de turno inválido' });
    }

    const turno = await Turno.findById(turnoId);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    const idAEliminar = (['Admin', 'Profesor'].includes(rol) && userId)
      ? userId
      : idSolicitante;

    // Si no es Admin/Profesor, asegurarse que el turno le pertenezca
    if (!['Admin', 'Profesor'].includes(rol)) {
      const estaEnTurno = turno.ocupadoPor.some(uid => uid.toString() === idAEliminar);
      if (!estaEnTurno) {
        return res.status(403).json({ message: 'No puedes liberar un turno que no te pertenece' });
      }
    }

    // Verificamos si efectivamente estaba asignado
    const estabaAsignado = turno.ocupadoPor.some(uid => uid.toString() === idAEliminar);
    if (!estabaAsignado) {
      return res.status(400).json({ message: 'El usuario no está asignado a este turno' });
    }

    // Quitamos al usuario del turno
    turno.ocupadoPor = turno.ocupadoPor.filter(uid => uid.toString() !== idAEliminar);
    turno.cuposDisponibles += 1;
    await turno.save();

    // Removemos el turno del usuario y le damos el crédito
    const usuario = await User.findById(idAEliminar);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    usuario.turnosMensuales = usuario.turnosMensuales.filter(
      tid => tid.toString() !== turnoId
    );

    // Crear el crédito
    const nuevoCredito = new Credito({ usuario: idAEliminar });
    await nuevoCredito.save();

    // Asociar el crédito al usuario
    usuario.creditos.push(nuevoCredito._id);
    await usuario.save();

    return res.status(200).json({ message: 'Turno liberado correctamente y crédito generado' });

  } catch (error) {
    console.error('Error al liberar turno:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};


// Obtener turno por ID
const getTurnoById = async (req, res) => {
  try {
    const turno = await Turno.findById(req.params.id);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }
    return res.status(200).json(turno);
  } catch (error) {
    console.error('Error al obtener el turno:', error);
    return res.status(500).json({ message: 'Error al obtener el turno', error: error.message });
  }
};

// Crear turno
const crearTurno = async (req, res) => {
  try {
    const { sede, nivel, hora, cuposDisponibles, fecha, repetirDosMeses } = req.body;
    if (!sede || !nivel || !hora || !fecha) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    const sedesValidas = ['Palermo', 'Fulgor'];
    const nivelesValidos = ['Blanco', 'Azul', 'Violeta'];
    if (!sedesValidas.includes(sede)) {
      return res.status(400).json({ message: 'Sede inválida' });
    }
    if (!nivelesValidos.includes(nivel)) {
      return res.status(400).json({ message: 'Nivel inválido' });
    }
    if (!/^\d{2}:\d{2}$/.test(hora)) {
      return res.status(400).json({ message: 'La hora debe tener formato HH:mm' });
    }

    const fechaTurno = moment(fecha);
    if (!fechaTurno.isValid()) {
      return res.status(400).json({ message: 'La fecha proporcionada no es válida' });
    }
    if (fechaTurno.isBefore(moment(), 'day')) {
      return res.status(400).json({ message: 'No se pueden crear turnos en el pasado' });
    }

    const CUPOS_POR_SEDE = { Palermo: 10, Fulgor: 12 };
    const cupos = cuposDisponibles !== undefined
      ? Number(cuposDisponibles)
      : (CUPOS_POR_SEDE[sede] || 0);
    if (!Number.isInteger(cupos) || cupos <= 0) {
      return res.status(400).json({ message: 'Cupos disponibles debe ser un número mayor a 0' });
    }

    const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let turnosCreados = [];

    if (repetirDosMeses) {
      for (let i = 0; i < 8; i++) {
        const nuevaFecha = fechaTurno.clone().add(i, 'weeks');
        const diaAuto = diaSemana[nuevaFecha.day()];

        const yaExiste = await Turno.findOne({
          sede, nivel, hora, fecha: nuevaFecha.toDate()
        });
        if (yaExiste) continue;

        const nuevoTurno = new Turno({
          sede,
          nivel,
          dia: diaAuto,
          hora,
          fecha: nuevaFecha.toDate(),
          cuposDisponibles: cupos,
        });
        await nuevoTurno.save();
        turnosCreados.push(nuevoTurno);
      }

      turnosCreados.sort((a, b) => a.fecha - b.fecha);
      if (turnosCreados.length === 0) {
        return res.status(400).json({ message: 'Ya existen todos los turnos en las fechas indicadas' });
      }

      return res.status(201).json({
        message: 'Turnos creados para 2 meses',
        turnos: turnosCreados,
      });
    } else {
      const diaAuto = diaSemana[fechaTurno.day()];
      const yaExiste = await Turno.findOne({
        sede, nivel, hora, fecha: fechaTurno.toDate()
      });
      if (yaExiste) {
        return res.status(400).json({ message: 'Ya existe un turno con esa combinación' });
      }

      const nuevoTurno = new Turno({
        sede,
        nivel,
        dia: diaAuto,
        hora,
        fecha: fechaTurno.toDate(),
        cuposDisponibles: cupos,
      });
      await nuevoTurno.save();
      return res.status(201).json({
        message: 'Turno creado exitosamente',
        turno: nuevoTurno,
      });
    }
  } catch (error) {
    console.error('Error al crear el turno:', error);
    return res.status(500).json({ message: 'Error al crear el turno', error: error.message });
  }
};

// Obtener todos los turnos
const getTodosLosTurnos = async (req, res) => {
  try {
    const turnos = await Turno.find();
    return res.json(turnos);
  } catch (error) {
    console.error('Error al obtener todos los turnos:', error);
    return res.status(500).json({ message: 'Error al obtener los turnos', error: error.message });
  }
};

// DELETE /api/turnos/:id?modo=uno|todos
const eliminarTurno = async (req, res) => {
  try {
    if (!['Admin', 'Profesor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar turnos' });
    }

    const { id } = req.params;
    const { modo = 'uno' } = req.query;

    const turno = await Turno.findById(id);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    if (modo === 'uno') {
      await Turno.findByIdAndDelete(id);
      return res.json({ message: 'Turno eliminado correctamente' });
    }

    if (modo === 'todos') {
      const turnosEliminados = await Turno.deleteMany({
        sede: turno.sede,
        hora: turno.hora,
        dia: turno.dia,
        fecha: { $gte: turno.fecha }, // futuros o igual
      });
      return res.json({
        message: `Se eliminaron ${turnosEliminados.deletedCount} turnos.`,
      });
    }

    return res.status(400).json({ message: 'Modo inválido. Usa "uno" o "todos"' });
  } catch (error) {
    console.error('Error al eliminar turno:', error);
    return res.status(500).json({ message: 'Error al eliminar el turno', error: error.message });
  }
};

// Eliminar desde fecha determinada
const eliminarDesdeFecha = async (req, res) => {
  try {
    if (!['Admin', 'Profesor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar turnos' });
    }

    const { fecha } = req.params;
    const { sede, hora, dia } = req.query;
    if (!sede || !hora || !dia) {
      return res.status(400).json({
        message: 'Faltan parámetros: sede, hora y día son obligatorios',
      });
    }

    const fechaConsulta = new Date(fecha);
    const turnosEncontrados = await Turno.find({
      fecha: { $gte: fechaConsulta },
      sede,
      hora,
      dia,
    });

    if (turnosEncontrados.length === 0) {
      return res.json({
        message: `No se encontraron turnos para eliminar desde la fecha ${fecha} con sede ${sede}, hora ${hora} y día ${dia}.`,
      });
    }

    const idsAEliminar = turnosEncontrados.map(t => t._id);
    await Turno.deleteMany({ _id: { $in: idsAEliminar } });

    return res.json({
      message: `Se eliminaron ${idsAEliminar.length} turnos desde la fecha ${fecha} con sede ${sede}, hora ${hora} y día ${dia}.`,
      idsEliminados: idsAEliminar,
    });
  } catch (error) {
    console.error('Error al eliminar desde fecha:', error);
    return res.status(500).json({
      message: 'Error al eliminar los turnos desde la fecha',
      error: error.message,
    });
  }
};

// Asignar turno manualmente (solo Admin/Profesor)
const asignarTurnoManual = async (req, res) => {
  const { turnoId, userId } = req.body;
  if (!['Admin', 'Profesor'].includes(req.user.role)) {
    return res.status(403).json({ message: 'No tienes permiso para asignar turnos manualmente' });
  }

  if (!mongoose.Types.ObjectId.isValid(turnoId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'ID de turno o usuario inválido' });
  }

  try {
    const turno = await Turno.findById(turnoId);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    const usuario = await User.findById(userId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    turno.ocupadoPor = turno.ocupadoPor || [];
    if (turno.ocupadoPor.includes(userId)) {
      return res.status(400).json({ message: 'El usuario ya tiene este turno asignado' });
    }
    if (turno.ocupadoPor.length >= turno.cuposDisponibles) {
      return res.status(400).json({ message: 'No hay cupos disponibles' });
    }

    usuario.turnosMensuales = usuario.turnosMensuales || [];
    const yaTieneTurno = usuario.turnosMensuales.some(
      tid => tid.toString() === turnoId.toString()
    );
    if (!yaTieneTurno) {
      turno.ocupadoPor.push(userId);
      usuario.turnosMensuales.push(turnoId);
      await Promise.all([turno.save(), usuario.save()]);
      return res.status(200).json({ message: 'Turno asignado correctamente' });
    } else {
      return res.status(400).json({ message: 'El usuario ya tiene este turno en su lista' });
    }
  } catch (error) {
    console.error('Error al asignar turno manualmente:', error);
    return res.status(500).json({ message: 'Error al asignar turno manualmente', error: error.message });
  }
};

// Obtener los turnos asignados a un usuario por su ID (Admin/Profesor o el propio usuario)
const getTurnosPorUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    // Solo Admin/Profesor o el propio usuario pueden acceder aquí. Usar middleware correspondiente al montar la ruta.
    const turnos = await Turno.find({ ocupadoPor: id });
    return res.status(200).json(turnos);
  } catch (error) {
    console.error('Error obteniendo turnos por usuario:', error);
    return res.status(500).json({ message: 'Error obteniendo los turnos del usuario', error: error.message });
  }
};

// Obtener los turnos asignados al usuario autenticado (usando token)
const getMisTurnos = async (req, res) => {
  try {
    const userId = req.user.id;
    const turnos = await Turno.find({ ocupadoPor: userId });
    return res.status(200).json(turnos);
  } catch (error) {
    console.error('Error obteniendo mis turnos:', error);
    return res.status(500).json({
      message: 'Error obteniendo los turnos del usuario',
      error: error.message,
    });
  }
};

//Turno según rol


const getTurnoByIdSegunRol = async (req, res) => {
  const turnoId = req.params.id;
  const rolUsuario = req.user.rol;

  try {
    const turno = await Turno.findById(turnoId);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    // Validar si el turno corresponde al rol del usuario
    if (turno.nivel !== rolUsuario) {
      return res.status(403).json({ message: 'No tenés acceso a este turno' });
    }

    res.json(turno);
  } catch (error) {
    console.error('Error al obtener turno por ID según rol:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getTurnosDisponibles,
  liberarTurno,
  getTurnoById,
  crearTurno,
  getTodosLosTurnos,
  eliminarTurno,
  eliminarDesdeFecha,
  asignarTurnoManual,
  getTurnosPorUsuario,
  getMisTurnos,
  getTurnoByIdSegunRol,
};
