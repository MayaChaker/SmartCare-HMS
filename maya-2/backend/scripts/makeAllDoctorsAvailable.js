require('dotenv').config();
const { sequelize } = require('../config/db');
const { Doctor } = require('../models');
const { Op } = require('sequelize');

async function run() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected. Marking all doctors as available...');
    const [availabilityUpdated] = await Doctor.update({ availability: true }, { where: {} });
    console.log(`Updated ${availabilityUpdated} doctor records to availability = true`);

    console.log('Assigning workingHours to doctors without schedules...');
    const groupA = 'Tuesday, Wednesday, Thursday 09:00 - 14:00';
    const groupB = 'Monday, Friday, Saturday 10:00 - 15:00';

    const missing = await Doctor.findAll({
      where: {
        [Op.or]: [{ workingHours: null }, { workingHours: '' }]
      },
      order: [['id', 'ASC']]
    });

    let a = 0, b = 0;
    for (let i = 0; i < missing.length; i++) {
      const doc = missing[i];
      const assignA = i % 2 === 0;
      const wh = assignA ? groupA : groupB;
      doc.workingHours = wh;
      doc.availability = true;
      doc.availableDay = assignA
        ? 'Tuesday, Wednesday, Thursday'
        : 'Monday, Friday, Saturday';
      doc.availableStartTime = assignA ? '09:00' : '10:00';
      doc.availableEndTime = assignA ? '14:00' : '15:00';
      await doc.save();
      if (assignA) a++; else b++;
    }
    console.log(`Assigned workingHours to ${missing.length} doctors: GroupA=${a}, GroupB=${b}`);
  } catch (err) {
    console.error('Error making all doctors available:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
    console.log('Done. Connection closed.');
  }
}

run();
