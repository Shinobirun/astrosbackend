
const User = require('../models/User');
const Credito = require('../models/creditos');
const Turno = require('../models/TurnoSemanal');
const mongoose = require("mongoose");

// Listar turnos disponibles (modificado para considerar los turnos con cupos restantes)
const getTurnosDisponibles = async (req, res) => {
  try {
    const turnos = await Turno.aggregate([
      {
        $addFields: {
          ocupados: { $size: '$ocupadoPor' }
        }
      },
      {
        $match: {
          activo: true,
          $expr: { $lt: ['$ocupados', '$cuposDisponibles'] }
        }
      }
    ]);

    res.json(turnos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los turnos', error: error.message });
  }
};

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

    // Eliminar al usuario del turno
    turno.ocupadoPor = turno.ocupadoPor.filter(uid => uid.toString() !== idUsuario.toString());

    // Aumentar el cupo disponible
    turno.cuposDisponibles += 1;

    await turno.save();

    // Eliminar el turno del usuario
    const user = await User.findById(idUsuario);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.turnosTomados = user.turnosTomados.filter(tid => tid.toString() !== turnoId);
    await user.save();

    res.status(200).json({ message: 'Turno liberado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al liberar el turno' });
  }
};





/* Tomar un turno
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
    const { id } = req.params;  // Obtiene el ID del usuario desde la URL

    // Buscar el usuario por ID y populando los turnosTomados con la información completa del turno
    const usuario = await User.findById(id).populate('turnosTomados'); 

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Los turnosTomados ya estarán poblados con los datos completos de los turnos
    res.json(usuario.turnosTomados);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo los turnos", error });
  }
};



// Controlador para obtener el turno por ID
const getTurnoById = async (req, res) => {
  try {
    const turno = await Turno.findById(req.params.id); // Buscar por ID
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }
    res.status(200).json(turno); // Retornar el turno encontrado
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el turno', error: error.message });
  }
};

//Crear turno

const crearTurno = async (req, res) => {
  try {
    const { sede, nivel, dia, hora } = req.body;

    if (!sede || !nivel || !dia || !hora) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
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
      cuposDisponibles: CUPOS_POR_SEDE[sede] || 0, // Se asigna automáticamente
    });

    await nuevoTurno.save();
    res.status(201).json({ message: "Turno creado exitosamente", turno: nuevoTurno });

  } catch (error) {
    res.status(500).json({ message: "Error al crear el turno", error: error.message });
  }
};


// Obtener todos los turnos
const getTodosLosTurnos = async (req, res) => {
  try {
    const turnos = await Turno.find(); // Obtiene todos los turnos
    res.json(turnos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los turnos", error: error.message });
  }
};


// Eliminar un turno
const eliminarTurno = async (req, res) => {
  try {
    if (!['Admin', 'Profesor'].includes(req.user.role)) {
      return res.status(403).json({ message: "No tienes permiso para eliminar turnos" });
    }

    const { id } = req.params;
    const turnoEliminado = await Turno.findByIdAndDelete(id);
    if (!turnoEliminado) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }
    res.json({ message: "Turno eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el turno", error: error.message });
  }
};


//Agregar turno manual

const asignarTurnoManual = async (req, res) => {
  const { turnoId, userId } = req.body;

  if (!['Admin', 'Profesor'].includes(req.user.role)) {
    return res.status(403).json({ message: 'No tienes permiso para asignar turnos manualmente' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(turnoId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de turno o usuario inválido' });
    }

    // Buscar el turno en la base de datos
    const turno = await Turno.findById(turnoId);
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });

    // Verificar que el usuario no tenga ya el turno
    if (turno.ocupadoPor.includes(userId)) {
      return res.status(400).json({ message: 'El usuario ya tiene este turno' });
    }

    // Validación de cupos disponibles
    if (turno.ocupadoPor.length >= turno.cuposDisponibles) {
      return res.status(400).json({ message: 'No hay cupos disponibles para este turno' });
    }

    // Asignar el turno al turno
    turno.ocupadoPor.push(userId);

    // Restar un cupo disponible
    //turno.cuposDisponibles -= 1;

    // Guardar los cambios en la base de datos
    const updatedTurno = await turno.save(); // Asegurarse de que el objeto guardado sea el actualizado

    // Agregar el turno al usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Asegurarse de que el turno no esté duplicado en el array de turnosTomados del usuario
    if (!user.turnosTomados.includes(turnoId)) {
      user.turnosTomados.push(turnoId);
      await user.save();
    }

    // Responder con éxito
    res.json({ 
      message: 'Turno asignado manualmente con éxito',
      turno: updatedTurno, // Opcional: incluir la información del turno actualizado
      cuposDisponibles: updatedTurno.cuposDisponibles
    });

  } catch (error) {
    res.status(500).json({ message: 'Error al asignar turno manualmente', error: error.message });
  }
};





module.exports = { 
  getTurnosDisponibles, 
  liberarTurno, 
  //tomarTurno, 
  getTurnosPorUsuario,
  getTurnoById,
  crearTurno,  
  getTodosLosTurnos,
  eliminarTurno,
  asignarTurnoManual
};


