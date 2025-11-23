const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { sequelize } = require('../config/db');
const { Doctor } = require('../models');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected. Updating doctor Alain Sayed...');

    const doctor = await Doctor.findOne({ where: { firstName: 'Alain', lastName: 'Sayed' } });
    if (!doctor) {
      console.error('Doctor Alain Sayed not found');
      process.exitCode = 1;
      return;
    }

    console.log('Before:', { id: doctor.id, firstName: doctor.firstName, lastName: doctor.lastName, specialization: doctor.specialization });

    doctor.firstName = 'Ali T.';
    doctor.lastName = 'Taher';
    doctor.specialization = 'Hematology';
    await doctor.save();

    console.log('After:', { id: doctor.id, firstName: doctor.firstName, lastName: doctor.lastName, specialization: doctor.specialization });
  } catch (err) {
    console.error('Update failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
    console.log('Connection closed.');
  }
}

run();