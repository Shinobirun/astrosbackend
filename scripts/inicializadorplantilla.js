require('dotenv').config();
const mongoose = require('mongoose');
const PlantillaTurno = require('../models/plantillaturno');

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

async function inicializarPlantillasBase() {
  try {
    const count = await PlantillaTurno.countDocuments();
    if (count === 0) {
      await PlantillaTurno.insertMany(turnosBase);
      console.log('Turnos base insertados en PlantillaTurno');
    } else {
      console.log('La colección PlantillaTurno ya tiene datos, no se insertaron turnos base.');
    }
  } catch (error) {
    console.error('Error insertando turnos base:', error);
  }
}

module.exports = inicializarPlantillasBase;
