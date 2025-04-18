const Turno = require('../models/TurnoMensual');

const inicializarTurnosBase = async () => {
  const turnosBase = [
    // 📍 Lunes - Palermo
    { sede: 'Palermo', nivel: 'Blanco', dia: 'Lunes', hora: '17:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Lunes', hora: '19:00', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Blanco', dia: 'Lunes', hora: '20:30', cuposDisponibles: 10 },

    // 📍 Martes - Palermo
    { sede: 'Palermo', nivel: 'Violeta', dia: 'Martes', hora: '17:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Martes', hora: '19:00', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Martes', hora: '20:30', cuposDisponibles: 10 },

    // 📍 Miércoles - Palermo
    { sede: 'Palermo', nivel: 'Blanco', dia: 'Miércoles', hora: '17:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Miércoles', hora: '19:00', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Blanco', dia: 'Miércoles', hora: '20:30', cuposDisponibles: 10 },

    // 📍 Miércoles - Fulgor
    { sede: 'Fulgor', nivel: 'Azul', dia: 'Miércoles', hora: '17:00', cuposDisponibles: 12 },
    { sede: 'Fulgor', nivel: 'Azul', dia: 'Miércoles', hora: '18:30', cuposDisponibles: 12 },
    { sede: 'Fulgor', nivel: 'Violeta', dia: 'Miércoles', hora: '20:00', cuposDisponibles: 12 },

    // 📍 Jueves - Palermo
    { sede: 'Palermo', nivel: 'Violeta', dia: 'Jueves', hora: '17:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Jueves', hora: '19:00', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Jueves', hora: '20:30', cuposDisponibles: 10 },

    // 📍 Viernes - Palermo
    { sede: 'Palermo', nivel: 'Azul', dia: 'Viernes', hora: '17:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Blanco', dia: 'Viernes', hora: '19:00', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Violeta', dia: 'Viernes', hora: '20:30', cuposDisponibles: 10 },

    // 📍 Viernes - Fulgor
    { sede: 'Fulgor', nivel: 'Azul', dia: 'Viernes', hora: '17:00', cuposDisponibles: 12 },
    { sede: 'Fulgor', nivel: 'Violeta', dia: 'Viernes', hora: '18:30', cuposDisponibles: 12 },
    { sede: 'Fulgor', nivel: 'Azul', dia: 'Viernes', hora: '20:00', cuposDisponibles: 12 },

    // 📍 Sábado - Fulgor
    { sede: 'Fulgor', nivel: 'Blanco', dia: 'Sábado', hora: '14:00', cuposDisponibles: 12 },
    { sede: 'Fulgor', nivel: 'Violeta', dia: 'Sábado', hora: '15:30', cuposDisponibles: 12 },
  ];

  try {
    const turnosExistentes = await Turno.countDocuments();
    if (turnosExistentes === 0) {
      await Turno.insertMany(turnosBase);
      console.log('✅ Turnos base inicializados correctamente.');
    } else {
      console.log('⚠️ Los turnos base ya están definidos.');
    }
  } catch (error) {
    console.error('❌ Error al inicializar los turnos base:', error.message);
  }
};

module.exports = inicializarTurnosBase;
