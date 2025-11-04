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
  email: {
    type: DataTypes.STRING,
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
    defaultValue: false,
  },
  workingHours: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Doctor;
