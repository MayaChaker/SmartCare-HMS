const { sequelize } = require('./db');
const { User, Patient, Doctor } = require('../models');

const initializeDatabase = async () => {
  try {
    // Sync all models with the database
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully');

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin user created successfully');

    // Create a doctor user
    const doctorUser = await User.create({
      username: 'doctor',
      password: 'doctor123',
      role: 'doctor'
    });

    // Create doctor profile
    await Doctor.create({
      firstName: 'John',
      lastName: 'Doe',
      specialization: 'General Medicine',
      UserId: doctorUser.id
    });
    console.log('Doctor user created successfully');

    // Create a patient user
    const patientUser = await User.create({
      username: 'patient',
      password: 'patient123',
      role: 'patient'
    });

    // Create patient profile
    await Patient.create({
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1990-01-01',
      contact: '555-123-4567',
      medicalHistory: 'No significant medical history',
      UserId: patientUser.id
    });
    console.log('Patient user created successfully');

    // Create a receptionist user
    await User.create({
      username: 'receptionist',
      password: 'receptionist123',
      role: 'receptionist'
    });
    console.log('Receptionist user created successfully');

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
