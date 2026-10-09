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
    type: DataTypes.ENUM('scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show'),
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
  },
  // When the visit reached each step; filled in by the hook below
  checkedInAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  // Not unique: cancelled visits keep their slot row, so double booking is checked in the controllers
  indexes: [
    {
      fields: ['doctorId', 'appointmentDate', 'appointmentTime']
    }
  ],
  hooks: {
    // Stamp the time of each step, whichever controller changes the status
    beforeSave(appointment) {
      if (!appointment.changed('status')) return;
      const stamp = { 'checked-in': 'checkedInAt', 'in-progress': 'startedAt', completed: 'completedAt' }[appointment.status];
      if (stamp && !appointment[stamp]) appointment[stamp] = new Date();
    }
  }
});

module.exports = Appointment;
