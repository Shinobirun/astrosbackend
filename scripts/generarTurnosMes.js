const Turno = require('../models/TurnoMensual');
const PlantillaTurno = require('../models/plantillaturno');

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

async function generarTurnosMesSiguiente() {
  try {
    const turnosBase = await PlantillaTurno.find().lean();

    if (turnosBase.length === 0) {
      console.log('No hay turnos base en PlantillaTurno para generar.');
      return;
    }

    const hoy = new Date();
    let anio = hoy.getFullYear();
    let mes = hoy.getMonth() + 1; // mes siguiente

    if (mes > 11) {
      mes = 0;
      anio++;
    }

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
          fecha: fecha,
          activo: true
        });
      }
    }

    const desde = new Date(anio, mes, 1);
    const hasta = new Date(anio, mes + 1, 1);

    const turnosExistentes = await Turno.countDocuments({
      fecha: { $gte: desde, $lt: hasta }
    });

    if (turnosExistentes === 0) {
      await Turno.insertMany(turnosConFechas);
      console.log(`✅ Turnos generados para ${anio}-${mes + 1} correctamente.`);
    } else {
      console.log('⚠️ Ya existen turnos para el mes siguiente.');
    }

  } catch (error) {
    console.error('❌ Error generando turnos:', error);
  }
}

module.exports = generarTurnosMesSiguiente;