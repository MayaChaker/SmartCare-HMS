const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// One line per action that changes patient care or accounts: who, what, on whom, and when.
// Rows are only ever added, never edited, so the log can be trusted.
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  actorUserId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  actorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  actorRole: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  // A fixed key such as "visit.checked_in"; the wording is the frontend's job
  action: {
    type: DataTypes.STRING(40),
    allowNull: false
  },
  targetType: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  targetName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  detail: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  updatedAt: false,
  indexes: [{ fields: ['createdAt'] }, { fields: ['actorRole'] }]
});

module.exports = AuditLog;
