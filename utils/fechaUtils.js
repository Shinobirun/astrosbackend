const { zonedTimeToUtc } = require('date-fns-tz');
const { ZONA_HORARIA_ARG } = require('../config/constantes');

function getFechasRestantesDelMes(diaNombre) {
  const diasSemana = {
    'Domingo': 0,
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6
  };

  const diaObjetivo = diasSemana[diaNombre];
  if (diaObjetivo === undefined) throw new Error('Día inválido');

  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = ahora.getMonth();

  const fechas = [];
  const ultimoDia = new Date(año, mes + 1, 0).getDate();

  for (let dia = ahora.getDate(); dia <= ultimoDia; dia++) {
    const fechaLocal = new Date(año, mes, dia, 0, 0, 0, 0);
    const fechaUTC = zonedTimeToUtc(fechaLocal, ZONA_HORARIA_ARG);

    if (fechaLocal.getDay() === diaObjetivo) {
      fechas.push(fechaUTC);
    }
  }

  return fechas;
}

module.exports = {
  getFechasRestantesDelMes
};