const { sequelize } = require('../config/db');
require('dotenv').config();

async function ensurePhotoUrlColumn() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Checking Doctors.photoUrl column...');

    const [rows] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'Doctors' AND COLUMN_NAME = 'photoUrl'`,
      { replacements: { db: process.env.DB_NAME } }
    );

    if (rows && rows.length > 0) {
      console.log('Column photoUrl already exists on Doctors. No action needed.');
      return;
    }

    console.log('Adding photoUrl column to Doctors...');
    await sequelize.query("ALTER TABLE Doctors ADD COLUMN photoUrl VARCHAR(255) NULL;");
    console.log('✅ Added photoUrl column to Doctors.');
  } catch (err) {
    console.error('❌ Failed to add photoUrl column:', err.message || err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

ensurePhotoUrlColumn();