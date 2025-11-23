const { sequelize } = require('./config/db');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const MedicalRecord = require('./models/MedicalRecord');

async function createTables() {
  try {
    console.log('Connecting to MySQL database...');
    
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Define all associations
    console.log('Setting up model associations...');
    
    // User associations
    User.hasOne(Patient, { foreignKey: 'userId' });
    User.hasOne(Doctor, { foreignKey: 'userId' });
    
    // Patient associations
    Patient.belongsTo(User, { foreignKey: 'userId' });
    Patient.hasMany(Appointment, { foreignKey: 'patientId' });
    Patient.hasMany(MedicalRecord, { foreignKey: 'patientId' });
    
    // Doctor associations
    Doctor.belongsTo(User, { foreignKey: 'userId' });
    Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
    Doctor.hasMany(MedicalRecord, { foreignKey: 'doctorId' });
    
    // Appointment associations
    Appointment.belongsTo(Patient, { foreignKey: 'patientId' });
    Appointment.belongsTo(Doctor, { foreignKey: 'doctorId' });
    
    // MedicalRecord associations
    MedicalRecord.belongsTo(Patient, { foreignKey: 'patientId' });
    MedicalRecord.belongsTo(Doctor, { foreignKey: 'doctorId' });
    
    console.log('Creating/updating database tables...');
    
    // Create all tables with force: true to recreate them
    await sequelize.sync({ force: true });
    
    console.log('✅ All tables created successfully!');
    
    // Insert some sample data
    console.log('Inserting sample data...');
    
    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });
    
    // Create doctor user
    const doctorUser = await User.create({
      username: 'doctor1',
      password: 'doctor123',
      role: 'doctor'
    });
    
    // Create patient user
    const patientUser = await User.create({
      username: 'patient1',
      password: 'patient123',
      role: 'patient'
    });
    
    // Create receptionist user
    const receptionistUser = await User.create({
      username: 'receptionist1',
      password: 'receptionist123',
      role: 'receptionist'
    });
    
    // Create doctor profile
    const doctor = await Doctor.create({
      firstName: 'Dr. Sarah',
      lastName: 'Wilson',
      specialization: 'Cardiology',
      phone: '+1-555-0123',
      email: 'sarah.wilson@hospital.com',
      userId: doctorUser.id
    });
    
    // Create patient profile
    const patient = await Patient.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '+1-555-0124',
      dateOfBirth: '1990-05-15',
      gender: 'Male',
      address: '123 Main St, City, State 12345',
      bloodType: 'O+',
      userId: patientUser.id
    });
    
    // Create sample appointment
    await Appointment.create({
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentDate: '2024-02-15',
      appointmentTime: '10:00:00',
      reason: 'Regular checkup',
      status: 'scheduled'
    });
    
    // Create sample medical record
    await MedicalRecord.create({
      patientId: patient.id,
      doctorId: doctor.id,
      diagnosis: 'Hypertension',
      treatment: 'Lifestyle modifications and medication',
      prescription: 'Lisinopril 10mg daily',
      notes: 'Patient advised on diet and exercise',
      visitDate: '2024-01-15'
    });
    
    console.log('✅ Sample data inserted successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Doctor: username=doctor1, password=doctor123');
    console.log('Patient: username=patient1, password=patient123');
    console.log('Receptionist: username=receptionist1, password=receptionist123');
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the setup
createTables();
