require('dotenv').config();
const { sequelize } = require('../config/db');
const { User, Doctor } = require('../models');

// A small catalog of real-looking doctors with photos and specialties
const doctorCatalog = [
  { firstName: 'Alice', lastName: 'Nguyen', specialization: 'Cardiology', email: 'alice.nguyen@example.com', phone: '555-101-0001', experience: 12, qualification: 'MD, FACC', photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { firstName: 'Rahul', lastName: 'Mehta', specialization: 'Neurology', email: 'rahul.mehta@example.com', phone: '555-101-0002', experience: 9, qualification: 'MD, DM (Neuro)', photoUrl: 'https://randomuser.me/api/portraits/men/11.jpg' },
  { firstName: 'Sofia', lastName: 'Martinez', specialization: 'Pediatrics', email: 'sofia.martinez@example.com', phone: '555-101-0003', experience: 7, qualification: 'MD, FAAP', photoUrl: 'https://randomuser.me/api/portraits/women/62.jpg' },
  { firstName: 'Ethan', lastName: 'Clark', specialization: 'Orthopedics', email: 'ethan.clark@example.com', phone: '555-101-0004', experience: 10, qualification: 'MD, FRCS (Ortho)', photoUrl: 'https://randomuser.me/api/portraits/men/52.jpg' },
  { firstName: 'Mina', lastName: 'Hassan', specialization: 'Dermatology', email: 'mina.hassan@example.com', phone: '555-101-0005', experience: 8, qualification: 'MD, FAAD', photoUrl: 'https://randomuser.me/api/portraits/women/19.jpg' },
  { firstName: 'Kenji', lastName: 'Tanaka', specialization: 'Ophthalmology', email: 'kenji.tanaka@example.com', phone: '555-101-0006', experience: 11, qualification: 'MD, FRCOphth', photoUrl: 'https://randomuser.me/api/portraits/men/36.jpg' },
  { firstName: 'Amelia', lastName: 'Brown', specialization: 'Endocrinology', email: 'amelia.brown@example.com', phone: '555-101-0007', experience: 13, qualification: 'MD, FACE', photoUrl: 'https://randomuser.me/api/portraits/women/71.jpg' },
  { firstName: 'Jamal', lastName: 'Okoye', specialization: 'General Surgery', email: 'jamal.okoye@example.com', phone: '555-101-0008', experience: 15, qualification: 'MD, FACS', photoUrl: 'https://randomuser.me/api/portraits/men/7.jpg' },
  { firstName: 'Helena', lastName: 'Kowalski', specialization: 'Gynecology', email: 'helena.kowalski@example.com', phone: '555-101-0009', experience: 9, qualification: 'MD, FACOG', photoUrl: 'https://randomuser.me/api/portraits/women/33.jpg' },
  { firstName: 'Marco', lastName: 'Rossi', specialization: 'Urology', email: 'marco.rossi@example.com', phone: '555-101-0010', experience: 10, qualification: 'MD, FEBU', photoUrl: 'https://randomuser.me/api/portraits/men/22.jpg' },
  { firstName: 'Yara', lastName: 'Salim', specialization: 'Pulmonology', email: 'yara.salim@example.com', phone: '555-101-0011', experience: 6, qualification: 'MD, FCCP', photoUrl: 'https://randomuser.me/api/portraits/women/3.jpg' },
  { firstName: 'Thomas', lastName: 'Berg', specialization: 'Nephrology', email: 'thomas.berg@example.com', phone: '555-101-0012', experience: 14, qualification: 'MD', photoUrl: 'https://randomuser.me/api/portraits/men/28.jpg' }
];

async function seedMoreDoctors() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected. Seeding additional doctors...');

    let createdCount = 0;
    for (const entry of doctorCatalog) {
      // Create or find user by email to attach a proper user account
      const username = entry.email;
      const [user] = await User.findOrCreate({
        where: { username },
        defaults: { username, password: 'doctor123', role: 'doctor' }
      });

      const [doctor, wasCreated] = await Doctor.findOrCreate({
        where: { userId: user.id },
        defaults: {
          firstName: entry.firstName,
          lastName: entry.lastName,
          specialization: entry.specialization,
          email: entry.email,
          phone: entry.phone,
          licenseNumber: `LIC-${String(user.id).padStart(6, '0')}`,
          experience: entry.experience,
          qualification: entry.qualification,
          availability: true,
          workingHours: 'Mon-Fri 09:00 - 17:00',
          photoUrl: entry.photoUrl,
          userId: user.id
        }
      });

      if (wasCreated) {
        createdCount += 1;
        console.log(`Created doctor: ${doctor.firstName} ${doctor.lastName} (${doctor.specialization})`);
      } else {
        // Update missing fields if needed
        let updated = false;
        ['photoUrl', 'availability', 'workingHours'].forEach((field) => {
          if (!doctor[field] && entry[field]) {
            doctor[field] = entry[field];
            updated = true;
          }
        });
        if (updated) {
          await doctor.save();
          console.log(`Updated doctor: ${doctor.firstName} ${doctor.lastName}`);
        }
      }
    }

    console.log(`Seeding complete. ${createdCount} new doctors added.`);
  } catch (err) {
    console.error('Error seeding doctors:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
    console.log('Connection closed.');
  }
}

seedMoreDoctors();