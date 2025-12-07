const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Doctor = sequelize.define("Doctor", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstName} ${this.lastName}`;
    },
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Availability details (normalized)
  availableDay: {
    type: DataTypes.STRING, // e.g., "Mon-Fri" or single day like "Monday"
    allowNull: true,
  },
  availableStartTime: {
    type: DataTypes.STRING, // store 24h format like "09:00"
    allowNull: true,
  },
  availableEndTime: {
    type: DataTypes.STRING, // store 24h format like "17:00"
    allowNull: true,
  },
  availableDate: {
    type: DataTypes.DATEONLY, // optional specific date for availability
    allowNull: true,
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  qualification: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Availability state and working hours text
  availability: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  workingHours: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Doctor;
