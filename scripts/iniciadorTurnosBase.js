const Turno = require('../models/TurnoMensual');
const PlantillaTurno = require('../models/plantillaturno'); // Modelo para la plantilla base

const diasSemana = {
  'Lunes': 1,
  'Martes': 2,
  'Miércoles': 3,
  'Jueves': 4,
  'Viernes': 5,
  'Sábado': 6
};

const generarFechasDelMes = (anio, mes, diaSemana) => {
  const fechas = [];
  const date = new Date(anio, mes, 1);
  while (date.getMonth() === mes) {
    if (date.getDay() === diaSemana) {
      fechas.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return fechas;
};

const inicializarTurnosBase = async () => {
  try {
    // Traer todos los turnos base desde PlantillaTurno
    const turnosBase = await PlantillaTurno.find().lean();

    if (turnosBase.length === 0) {
      console.log('No hay turnos base en PlantillaTurno para generar.');
      return;
    }

    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();

    const turnosConFechas = [];

    for (const base of turnosBase) {
      const diaNumero = diasSemana[base.dia];
      if (diaNumero === undefined) {
        console.warn(`Día inválido en plantilla: ${base.dia}`);
        continue;
      }

      const fechas = generarFechasDelMes(anio, mes, diaNumero);

      for (const fecha of fechas) {
        turnosConFechas.push({
          sede: base.sede,
          nivel: base.nivel,
          dia: base.dia,
          hora: base.hora,
          cuposDisponibles: base.cuposDisponibles,
          fecha: fecha
        });
      }
    }

    const turnosExistentes = await Turno.countDocuments({
      fecha: { $gte: new Date(anio, mes, 1), $lt: new Date(anio, mes + 1, 1) }
    });

    if (turnosExistentes === 0) {
      await Turno.insertMany(turnosConFechas);
      console.log('✅ Turnos mensuales generados correctamente desde PlantillaTurno.');
    } else {
      console.log('⚠️ Ya existen turnos mensuales para este mes.');
    }

  } catch (error) {
    console.error('❌ Error al generar turnos mensuales:', error);
  }
};

module.exports = inicializarTurnosBase;