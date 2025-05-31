const Turno = require('../models/TurnoMensual');

// Mapea el día en texto al número (0=Domingo, 1=Lunes, ...)
const diasSemana = {
  'Lunes': 1,
  'Martes': 2,
  'Miércoles': 3,
  'Jueves': 4,
  'Viernes': 5,
  'Sábado': 6
};

// Genera todas las fechas de un día de la semana dentro de un mes
const generarFechasDelMes = (anio, mes, diaSemana) => {
  const fechas = [];
  const date = new Date(anio, mes, 1);
  while (date.getMonth() === mes) {
    if (date.getDay() === diaSemana) {
      fechas.push(new Date(date)); // Copia de la fecha
    }
    date.setDate(date.getDate() + 1);
  }
  return fechas;
};

const inicializarTurnosBase = async () => {
  const turnosBase = [
    { sede: 'Palermo', nivel: 'Blanco', dia: 'Lunes', hora: '17:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Lunes', hora: '19:00', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Blanco', dia: 'Lunes', hora: '20:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Violeta', dia: 'Martes', hora: '17:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Martes', hora: '19:00', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Martes', hora: '20:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Blanco', dia: 'Miércoles', hora: '17:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Miércoles', hora: '19:00', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Blanco', dia: 'Miércoles', hora: '20:30', cuposDisponibles: 10 },
    { sede: 'Fulgor', nivel: 'Azul', dia: 'Miércoles', hora: '17:00', cuposDisponibles: 12 },
    { sede: 'Fulgor', nivel: 'Azul', dia: 'Miércoles', hora: '18:30', cuposDisponibles: 12 },
    { sede: 'Fulgor', nivel: 'Violeta', dia: 'Miércoles', hora: '20:00', cuposDisponibles: 12 },
    { sede: 'Palermo', nivel: 'Violeta', dia: 'Jueves', hora: '17:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Jueves', hora: '19:00', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Jueves', hora: '20:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Azul', dia: 'Viernes', hora: '17:30', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Blanco', dia: 'Viernes', hora: '19:00', cuposDisponibles: 10 },
    { sede: 'Palermo', nivel: 'Violeta', dia: 'Viernes', hora: '20:30', cuposDisponibles: 10 },
    { sede: 'Fulgor', nivel: 'Azul', dia: 'Viernes', hora: '17:00', cuposDisponibles: 12 },
    { sede: 'Fulgor', nivel: 'Violeta', dia: 'Viernes', hora: '18:30', cuposDisponibles: 12 },
    { sede: 'Fulgor', nivel: 'Azul', dia: 'Viernes', hora: '20:00', cuposDisponibles: 12 },
    { sede: 'Fulgor', nivel: 'Blanco', dia: 'Sábado', hora: '14:00', cuposDisponibles: 12 },
    { sede: 'Fulgor', nivel: 'Violeta', dia: 'Sábado', hora: '15:30', cuposDisponibles: 12 },
  ];

  // Mes y año a generar (0=Enero, 4=Mayo, etc.)
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth(); // mes actual

  const turnosConFechas = [];

  for (const base of turnosBase) {
    const diaNumero = diasSemana[base.dia];
    const fechas = generarFechasDelMes(anio, mes, diaNumero);

    for (const fecha of fechas) {
      turnosConFechas.push({
        ...base,
        fecha,
      });
    }
  }

  try {
    const turnosExistentes = await Turno.countDocuments({ fecha: { $gte: new Date(anio, mes, 1), $lt: new Date(anio, mes + 1, 1) } });

    if (turnosExistentes === 0) {
      await Turno.insertMany(turnosConFechas);
      console.log('✅ Turnos mensuales generados correctamente.');
    } else {
      console.log('⚠️ Ya existen turnos mensuales para este mes.');
    }
  } catch (error) {
    console.error('❌ Error al generar turnos mensuales:', error.message);
  }
};

module.exports = inicializarTurnosBase;