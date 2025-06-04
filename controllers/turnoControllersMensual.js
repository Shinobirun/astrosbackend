const Turno = require('../models/TurnoMensual');
const User = require('../models/User');
const Credito = require('../models/creditos');
const mongoose = require('mongoose');
const moment = require('moment');

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
}; */

const getTurnosDisponibles = async (req, res) => {
  try {
    const turnos = await Turno.find({
      $expr: { $lt: [{ $size: '$ocupadoPor' }, '$cuposDisponibles'] },
      activo: true
    }).populate('ocupadoPor', 'firstName lastName role');

    console.log('Turnos con populate:', JSON.stringify(turnos, null, 2));
    console.log('Turnos sin stringify:', turnos);
    console.log('Primer ocupadoPor:', turnos[0]?.ocupadoPor);

    res.json(turnos);
  } catch (error) {
    console.error('Error:', error);
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

    user.turnosMensuales = user.turnosMensuales.filter(tid => tid.toString() !== turnoId);
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

//crear turno

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

    // Validar hora en formato HH:mm
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

    const CUPOS_POR_SEDE = {
      Palermo: 10,
      Fulgor: 12,
    };

    const cupos = cuposDisponibles !== undefined ? Number(cuposDisponibles) : (CUPOS_POR_SEDE[sede] || 0);

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
          sede,
          nivel,
          hora,
          fecha: nuevaFecha.toDate(),
        });

        if (yaExiste) {
          // No lo creamos, pero lo dejamos registrado como duplicado si querés
          continue;
        }

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
        sede,
        nivel,
        hora,
        fecha: fechaTurno.toDate(),
      });

      if (yaExiste) {
        return res.status(400).json({ message: 'Ya existe un turno en esa fecha, hora, sede y nivel' });
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
    console.error(error);
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
    res.status(500).json({ message: 'Error al eliminar el turno', error: error.message });
  }
};

// eliminar desde fecha

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

    // 1. Buscar los turnos que coinciden
    const turnos = await Turno.find({
      fecha: { $gte: fechaConsulta },
      sede,
      hora,
      dia,
    });

    if (turnos.length === 0) {
      return res.json({
        message: `No se encontraron turnos para eliminar desde la fecha ${fecha} con sede ${sede}, hora ${hora} y día ${dia}.`,
      });
    }

    // 2. Obtener los IDs de los turnos
    const idsAEliminar = turnos.map(t => t._id);

    // 3. Eliminar todos los turnos con esos IDs
    await Turno.deleteMany({ _id: { $in: idsAEliminar } });

    res.json({
      message: `Se eliminaron ${idsAEliminar.length} turnos desde la fecha ${fecha} con sede ${sede}, hora ${hora} y día ${dia}.`,
      idsEliminados: idsAEliminar,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al eliminar los turnos desde la fecha',
      error: error.message,
    });
  }
};




// Asignar turno manualmente
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
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });

    const usuario = await User.findById(userId);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    turno.ocupadoPor = turno.ocupadoPor || [];
    if (turno.ocupadoPor.includes(userId)) {
      return res.status(400).json({ message: 'El usuario ya tiene este turno asignado' });
    }

    if (turno.ocupadoPor.length >= turno.cuposDisponibles) {
      return res.status(400).json({ message: 'No hay cupos disponibles' });
    }

    usuario.turnosMensuales = usuario.turnosMensuales || [];
    const yaTieneTurno = usuario.turnosMensuales.some(id => id.toString() === turnoId.toString());

    if (!yaTieneTurno) {
      turno.ocupadoPor.push(userId);
      usuario.turnosMensuales.push(turnoId);

      await Promise.all([turno.save(), usuario.save()]);

      return res.status(200).json({ message: 'Turno asignado correctamente' });
    } else {
      return res.status(400).json({ message: 'El usuario ya tiene este turno en su lista' });
    }

  } catch (error) {
    console.error('❌ Error al asignar turno manualmente:', error);
    return res.status(500).json({ message: 'Error al asignar turno manualmente', error: error.message });
  }
};

// Obtener los turnos asignados a un usuario por su ID
const getTurnosPorUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar los turnos donde el usuario figure en el array "ocupadoPor"
    const turnos = await Turno.find({ ocupadoPor: id });

    res.status(200).json(turnos);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo los turnos del usuario', error: error.message });
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
  eliminarDesdeFecha,
  asignarTurnoManual,
  // tomarTurno // Solo si lo necesitas descomentar
};
