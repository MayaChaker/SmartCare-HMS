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
  indexes: [
    {
      unique: true,
      fields: ['doctorId', 'appointmentDate', 'appointmentTime']
    }
  ]
});

module.exports = Appointment;
