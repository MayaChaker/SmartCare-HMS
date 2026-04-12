const User = require('./User');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Appointment = require('./Appointment');
const MedicalRecord = require('./MedicalRecord');

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

module.exports = {
  User,
  Patient,
  Doctor,
  Appointment,
  MedicalRecord
};