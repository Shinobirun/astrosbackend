// controllers/plantillaController.js
const PlantillaTurno = require('../models/plantillaturno');
const Turno = require('../models/TurnoMensual');
const User = require('../models/User');
const mongoose = require('mongoose');
const { getFechasRestantesDelMes } = require('../utils/fechaUtils');

// Función principal
const asignarUsuarioDesdePlantilla = async (req, res) => {
  try {
    const { plantillaId, usuarioId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(plantillaId) || !mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const plantilla = await PlantillaTurno.findById(plantillaId);
    if (!plantilla) return res.status(404).json({ error: 'Plantilla no encontrada' });

    const fechas = getFechasRestantesDelMes(plantilla.dia);
    const turnosAsignados = [];

    for (const fecha of fechas) {
      const turnoExistente = await Turno.findOne({
        fecha,
        hora: plantilla.hora,
        sede: plantilla.sede,
        nivel: plantilla.nivel
      });

      if (turnoExistente) {
        // Ya existe el turno, verificar si hay lugar y si no está asignado
        const yaAsignado = turnoExistente.ocupadoPor.includes(usuarioId);
        if (!yaAsignado && turnoExistente.ocupadoPor.length < plantilla.cuposDisponibles) {
          turnoExistente.ocupadoPor.push(usuarioId);
          await turnoExistente.save();
          turnosAsignados.push(turnoExistente);
        }
      } else {
        // Crear turno nuevo y asignar usuario
        const nuevoTurno = new Turno({
          fecha,
          hora: plantilla.hora,
          sede: plantilla.sede,
          nivel: plantilla.nivel,
          ocupadoPor: [usuarioId]
        });
        await nuevoTurno.save();
        turnosAsignados.push(nuevoTurno);
      }
    }

    res.status(200).json({ mensaje: 'Asignaciones realizadas', turnos: turnosAsignados });
  } catch (error) {
    console.error('Error al asignar usuario desde plantilla:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const obtenerPlantillaPorUsuario = async (req, res) => {
  try {
    const { userId } = req.params;

    const plantilla = await PlantillaTurnoUsuario.find({ userId });

    if (!plantilla.length) {
      return res.status(404).json({ message: "No hay turnos en la plantilla para este usuario" });
    }

    res.json(plantilla);
  } catch (error) {
    console.error("Error al obtener plantilla:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

const obtenerTurnosSemana = async (req, res) => {
  try {
    const hoy = new Date();
    const primerDiaSemana = new Date(hoy);
    primerDiaSemana.setDate(hoy.getDate() - hoy.getDay()); // Domingo

    const ultimoDiaSemana = new Date(hoy);
    ultimoDiaSemana.setDate(hoy.getDate() + (6 - hoy.getDay())); // Sábado

    // Ajuste para empezar el lunes si querés Lunes a Domingo (no Domingo a Sábado)
    primerDiaSemana.setDate(primerDiaSemana.getDate() + 1);
    ultimoDiaSemana.setDate(primerDiaSemana.getDate() + 6);

    // Limpiamos las horas
    primerDiaSemana.setHours(0, 0, 0, 0);
    ultimoDiaSemana.setHours(23, 59, 59, 999);

    const turnos = await Turno.find({
      fecha: {
        $gte: primerDiaSemana,
        $lte: ultimoDiaSemana
      }
    }).populate('ocupadoPor', 'first_name last_name email'); // Opcional: mostrar datos del usuario

    res.status(200).json(turnos);
  } catch (error) {
    console.error('Error al obtener turnos de la semana:', error);
    res.status(500).json({ error: 'Error del servidor al obtener turnos' });
  }
};

module.exports = {
  asignarUsuarioDesdePlantilla,
  obtenerPlantillaPorUsuario,
  obtenerTurnosSemana,
};
