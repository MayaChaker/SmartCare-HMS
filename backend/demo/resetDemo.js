// Restores the public demo to a known state: demo accounts, sample doctors,
// a few patients, and appointments around today so every dashboard has data.
const crypto = require("crypto");
const { sequelize } = require("../config/db");
const { User, Patient, Doctor, Appointment, MedicalRecord } = require("../models");
const { DEMO_PASSWORD, DEMO_ACCOUNTS } = require("../config/demo");
const { SAMPLE_DOCTORS, toDoctorProfile } = require("./sampleData");
const { isSlotAllowedByWorkingHours } = require("../utils/schedule");
const { clinicToday } = require("../utils/clinicTime");

const DEMO_PATIENT_PROFILE = {
  firstName: "Jana",
  lastName: "Khalil",
  email: "jana.khalil@example.com",
  phone: "+961 70 000 101",
  dateOfBirth: "1994-03-12",
  gender: "Female",
  address: "Hamra, Beirut",
  emergencyContact: "+961 70 000 102",
  bloodType: "O+",
  allergies: "Penicillin",
  insurance: "Standard",
};

const OTHER_PATIENTS = [
  { username: "patient.omar.fares", firstName: "Omar", lastName: "Fares", gender: "Male", dateOfBirth: "1986-07-21", bloodType: "A+" },
  { username: "patient.lea.saab", firstName: "Lea", lastName: "Saab", gender: "Female", dateOfBirth: "2001-11-02", bloodType: "B+" },
  { username: "patient.hassan.itani", firstName: "Hassan", lastName: "Itani", gender: "Male", dateOfBirth: "1972-01-30", bloodType: "O-" },
  { username: "patient.dima.rahal", firstName: "Dima", lastName: "Rahal", gender: "Female", dateOfBirth: "1990-05-17", bloodType: "AB+" },
  { username: "patient.elias.matar", firstName: "Elias", lastName: "Matar", gender: "Male", dateOfBirth: "1965-09-08", bloodType: "A-" },
];

// Login is never used for these accounts, so they get a random password
const randomPassword = () => crypto.randomBytes(24).toString("hex");

// `days` days after the clinic's today, as YYYY-MM-DD (calendar maths in UTC so it never shifts a day)
const clinicDateFromToday = (days) => {
  const date = new Date(`${clinicToday()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

// Nearest date from `offset` days away (moving away from today) on which the doctor works at `time`
function findWorkingDate(doctor, offset, time) {
  const step = offset < 0 ? -1 : 1;
  for (let i = 0; i < 14; i++) {
    const ymd = clinicDateFromToday(offset + i * step);
    if (isSlotAllowedByWorkingHours(doctor, ymd, time).ok) return ymd;
    if (offset === 0) return null;
  }
  return null;
}

async function upsertUser(username, password, role, transaction) {
  const user = await User.findOne({ where: { username }, transaction });
  if (!user) {
    return User.create({ username, password, role }, { transaction });
  }
  user.password = password;
  user.role = role;
  await user.save({ transaction });
  return user;
}

async function createPatient(username, password, profile, transaction) {
  const user = await User.create({ username, password, role: "patient" }, { transaction });
  return Patient.create(
    { email: `${username}@example.com`, phone: "+961 70 000 000", ...profile, userId: user.id },
    { transaction },
  );
}

async function resetDemoData() {
  await sequelize.transaction(async (transaction) => {
    // Visits, records and every patient account are recreated from scratch
    await MedicalRecord.destroy({ where: {}, transaction });
    await Appointment.destroy({ where: {}, transaction });
    await Patient.destroy({ where: {}, transaction });
    await User.destroy({ where: { role: "patient" }, transaction });

    const doctors = {};
    for (const d of SAMPLE_DOCTORS) {
      const isDemoDoctor = d.username === DEMO_ACCOUNTS.doctor;
      let user = await User.findOne({ where: { username: d.username }, transaction });
      if (!user) {
        user = await User.create(
          { username: d.username, password: isDemoDoctor ? DEMO_PASSWORD : randomPassword(), role: "doctor" },
          { transaction },
        );
      } else if (isDemoDoctor) {
        user.password = DEMO_PASSWORD;
        await user.save({ transaction });
      }

      const profile = toDoctorProfile(d);
      let doctor = await Doctor.findOne({ where: { userId: user.id }, transaction });
      if (doctor) {
        await doctor.update(profile, { transaction });
      } else {
        doctor = await Doctor.create({ ...profile, userId: user.id }, { transaction });
      }
      doctors[d.username] = doctor;
    }

    await upsertUser(DEMO_ACCOUNTS.admin, DEMO_PASSWORD, "admin", transaction);
    await upsertUser(DEMO_ACCOUNTS.receptionist, DEMO_PASSWORD, "receptionist", transaction);

    const demoPatient = await createPatient(DEMO_ACCOUNTS.patient, DEMO_PASSWORD, DEMO_PATIENT_PROFILE, transaction);
    const others = [];
    for (const p of OTHER_PATIENTS) {
      const { username, ...profile } = p;
      others.push(await createPatient(username, randomPassword(), profile, transaction));
    }

    const karim = doctors["dr.karim.mansour"];
    const plan = [
      // Demo patient: a finished visit with a record, and two upcoming ones
      { patient: demoPatient, doctor: karim, offset: -3, time: "10:00:00", status: "completed", reason: "Chest pain follow-up",
        record: { diagnosis: "Mild hypertension", treatment: "Low-salt diet and daily walks", prescriptions: "Amlodipine 5 mg once daily", notes: "Recheck blood pressure in 4 weeks" } },
      { patient: demoPatient, doctor: karim, offset: 1, time: "11:00:00", status: "scheduled", reason: "Blood pressure check" },
      { patient: demoPatient, doctor: doctors["dr.lina.kanaan"], offset: 2, time: "12:00:00", status: "scheduled", reason: "Skin rash" },
      // Today, for the receptionist and doctor dashboards
      { patient: others[0], doctor: karim, offset: 0, time: "09:20:00", status: "checked-in", reason: "Routine checkup" },
      { patient: others[1], doctor: karim, offset: 0, time: "14:00:00", status: "scheduled", reason: "Palpitations" },
      { patient: others[2], doctor: doctors["dr.ziad.sfeir"], offset: 0, time: "10:40:00", status: "scheduled", reason: "Flu symptoms" },
      { patient: others[3], doctor: doctors["dr.nour.haidar"], offset: 0, time: "11:00:00", status: "scheduled", reason: "Annual exam" },
      { patient: others[4], doctor: doctors["dr.samir.daher"], offset: 0, time: "15:00:00", status: "scheduled", reason: "Knee pain" },
      // History for reports
      { patient: others[2], doctor: karim, offset: -6, time: "13:00:00", status: "completed", reason: "ECG review",
        record: { diagnosis: "Normal sinus rhythm", treatment: "No treatment needed", notes: "Annual review recommended" } },
      { patient: others[0], doctor: doctors["dr.rania.nasr"], offset: -2, time: "09:00:00", status: "cancelled", reason: "Vaccination" },
      { patient: others[3], doctor: karim, offset: -1, time: "11:00:00", status: "no-show", reason: "Follow-up" },
    ];

    for (const visit of plan) {
      const date = findWorkingDate(visit.doctor, visit.offset, visit.time);
      if (!date) continue;
      const appointment = await Appointment.create(
        {
          patientId: visit.patient.id,
          doctorId: visit.doctor.id,
          appointmentDate: date,
          appointmentTime: visit.time,
          status: visit.status,
          reason: visit.reason,
        },
        { transaction },
      );
      if (visit.record) {
        await MedicalRecord.create(
          { appointmentId: appointment.id, patientId: visit.patient.id, doctorId: visit.doctor.id, visitDate: date, ...visit.record },
          { transaction },
        );
      }
    }
  });
}

module.exports = { resetDemoData };
