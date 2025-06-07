// controllers/plantillaController.js
const PlantillaTurno = require('../models/plantillaturno');
const Turno = require('../models/Turno');
const User = require('../models/User');
const mongoose = require('mongoose');
const { getFechasRestantesDelMes } = require('../utils/fechasUtils');

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

module.exports = {
  asignarUsuarioDesdePlantilla
};
