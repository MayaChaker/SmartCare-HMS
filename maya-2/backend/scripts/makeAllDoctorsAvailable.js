require('dotenv').config();
const { sequelize } = require('../config/db');
const { Doctor } = require('../models');

async function run() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected. Marking all doctors as available...');

    const [updatedCount] = await Doctor.update({ availability: true }, { where: {} });
    console.log(`Updated ${updatedCount} doctor records to availability = true`);
  } catch (err) {
    console.error('Error making all doctors available:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
    console.log('Done. Connection closed.');
  }
}

run();