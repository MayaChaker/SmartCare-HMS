const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appointmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  appointmentTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled'),
    defaultValue: 'scheduled',
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Consultation'
  }
}, {
  // Not unique: cancelled visits keep their slot row, so double booking is checked in the controllers
  indexes: [
    {
      fields: ['doctorId', 'appointmentDate', 'appointmentTime']
    }
  ]
});

module.exports = Appointment;
