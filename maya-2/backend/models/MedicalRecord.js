const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MedicalRecord = sequelize.define('MedicalRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  visitDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  treatment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prescriptions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  testResults: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  followUpDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  medications: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = MedicalRecord;