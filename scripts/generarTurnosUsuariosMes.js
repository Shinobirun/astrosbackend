const Turno = require('../models/TurnoMensual');
const PlantillaTurnoUsuario = require('../models/PlantillaTurnoUsuario');

const diasSemana = {
  'Domingo': 0,
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

async function generarTurnosUsuariosMes() {
  try {
    const plantillas = await PlantillaTurnoUsuario.find({ activo: true }).lean();
    if (plantillas.length === 0) {
      console.log('No hay plantillas de turnos de usuario.');
      return;
    }

    const hoy = new Date();
    let anio = hoy.getFullYear();
    let mes = hoy.getMonth(); // mes actual
    let diaHoy = hoy.getDate();

    const turnosAGenerar = [];

    for (const plantilla of plantillas) {
      const diaNumero = diasSemana[plantilla.dia];
      if (diaNumero === undefined) {
        console.warn(`Día inválido en plantilla: ${plantilla.dia}`);
        continue;
      }

      const fechas = generarFechasDelMes(anio, mes, diaNumero).filter(fecha => fecha.getDate() >= diaHoy);

      for (const fecha of fechas) {
        turnosAGenerar.push({
          sede: plantilla.sede,
          nivel: plantilla.nivel,
          dia: plantilla.dia,
          hora: plantilla.hora,
          fecha: fecha,
          ocupadoPor: [plantilla.usuario], // turno ya asignado al usuario
          activo: true
        });
      }
    }

    await Turno.insertMany(turnosAGenerar);
    console.log(`✅ Turnos individuales generados para lo que queda de ${anio}-${mes + 1}.`);
  } catch (error) {
    console.error('❌ Error generando turnos de usuario:', error);
  }
}

module.exports = generarTurnosUsuariosMes;
