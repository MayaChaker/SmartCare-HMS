const { User, Patient, Doctor, Appointment } = require("./models");
const bcrypt = require("bcryptjs"); // Changed to bcryptjs to match User model

async function createTestData() {
  try {
    console.log("Starting test data creation...");

    // Create admin user (password will be automatically hashed by the User model)
    const [admin, adminCreated] = await User.findOrCreate({
      where: { username: "maya@example.com" },
      defaults: {
        username: "maya@example.com",
        password: "Maya123",
        role: "admin",
      },
    });
    console.log("Admin user created/found:", admin.username);

    // Create some test patients (password will be automatically hashed by the User model)
    for (let i = 1; i <= 5; i++) {
      const [user, userCreated] = await User.findOrCreate({
        where: { username: `patient${i}@example.com` },
        defaults: {
          username: `patient${i}@example.com`,
          password: "patient123",
          role: "patient",
        },
      });

      if (userCreated) {
        await Patient.findOrCreate({
          where: { userId: user.id },
          defaults: {
            firstName: `Patient`,
            lastName: `${i}`,
            email: `patient${i}@example.com`,
            phone: `123-456-789${i}`,
            dateOfBirth: new Date(1990 + i, i % 12, 15),
            userId: user.id,
          },
        });
        console.log(`Patient ${i} created`);
      }
    }

    // Create some test doctors (password will be automatically hashed by the User model)
    const specializations = [
      "Cardiology",
      "Neurology",
      "Pediatrics",
      "Orthopedics",
      "Dermatology",
    ];
    for (let i = 1; i <= 5; i++) {
      const [user, userCreated] = await User.findOrCreate({
        where: { username: `doctor${i}@example.com` },
        defaults: {
          username: `doctor${i}@example.com`,
          password: "doctor123",
          role: "doctor",
        },
      });

      if (userCreated) {
        await Doctor.findOrCreate({
          where: { userId: user.id },
          defaults: {
            firstName: `Dr. John`,
            lastName: `Doctor${i}`,
            specialization: specializations[i - 1],
            email: `doctor${i}@example.com`,
            phone: `123-456-780${i}`,
            licenseNumber: `LIC00${i}`,
            experience: 5 + i,
            qualification: "MD",
            userId: user.id,
          },
        });
        console.log(`Doctor ${i} created`);
      }
    }

    // Create some test receptionists (password will be automatically hashed by the User model)
    for (let i = 1; i <= 2; i++) {
      const [user, userCreated] = await User.findOrCreate({
        where: { username: `receptionist${i}@example.com` },
        defaults: {
          username: `receptionist${i}@example.com`,
          password: "receptionist123",
          role: "receptionist",
        },
      });
      console.log(`Receptionist ${i} created/found`);
    }

    // Create some test appointments
    const patients = await Patient.findAll();
    const doctors = await Doctor.findAll();

    if (patients.length > 0 && doctors.length > 0) {
      for (let i = 0; i < Math.min(10, patients.length * doctors.length); i++) {
        const patient = patients[i % patients.length];
        const doctor = doctors[i % doctors.length];

        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + (i % 7)); // Spread over next 7 days
        appointmentDate.setHours(9 + (i % 8), 0, 0, 0); // 9 AM to 4 PM

        const [appointment, appointmentCreated] =
          await Appointment.findOrCreate({
            where: {
              patientId: patient.id,
              doctorId: doctor.id,
              appointmentDate: appointmentDate,
            },
            defaults: {
              patientId: patient.id,
              doctorId: doctor.id,
              appointmentDate: appointmentDate,
              reason: `Consultation ${i + 1}`,
              status: ["scheduled", "completed", "cancelled"][i % 3],
            },
          });

        if (appointmentCreated) {
          console.log(`Appointment ${i + 1} created`);
        }
      }
    }

    console.log("Test data creation completed successfully!");

    // Print summary
    const totalUsers = await User.count();
    const totalPatients = await Patient.count();
    const totalDoctors = await Doctor.count();
    const totalAppointments = await Appointment.count();

    console.log("\n=== DATABASE SUMMARY ===");
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Total Patients: ${totalPatients}`);
    console.log(`Total Doctors: ${totalDoctors}`);
    console.log(`Total Appointments: ${totalAppointments}`);
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}

// Run the function
createTestData()
  .then(() => {
    console.log("Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

async function createTestData() {
  try {
    console.log("Starting test data creation...");

    // Create admin user
    const hashedPassword = await bcrypt.hash("Maya123", 10);
    const [admin, adminCreated] = await User.findOrCreate({
      where: { username: "maya@example.com" },
      defaults: {
        username: "maya@example.com",
        password: hashedPassword,
        role: "admin",
      },
    });
    console.log("Admin user created/found:", admin.username);

    // Create some test patients
    const patientPassword = await bcrypt.hash("patient123", 10);
    for (let i = 1; i <= 5; i++) {
      const [user, userCreated] = await User.findOrCreate({
        where: { username: `patient${i}@example.com` },
        defaults: {
          username: `patient${i}@example.com`,
          password: patientPassword,
          role: "patient",
        },
      });

      if (userCreated) {
        await Patient.findOrCreate({
          where: { userId: user.id },
          defaults: {
            firstName: `Patient`,
            lastName: `${i}`,
            email: `patient${i}@example.com`,
            phone: `123-456-789${i}`,
            dateOfBirth: new Date(1990 + i, i % 12, 15),
            userId: user.id,
          },
        });
        console.log(`Patient ${i} created`);
      }
    }

    // Create some test doctors
    const doctorPassword = await bcrypt.hash("doctor123", 10);
    const specializations = [
      "Cardiology",
      "Neurology",
      "Pediatrics",
      "Orthopedics",
      "Dermatology",
    ];
    for (let i = 1; i <= 5; i++) {
      const [user, userCreated] = await User.findOrCreate({
        where: { username: `doctor${i}@example.com` },
        defaults: {
          username: `doctor${i}@example.com`,
          password: doctorPassword,
          role: "doctor",
        },
      });

      if (userCreated) {
        await Doctor.findOrCreate({
          where: { userId: user.id },
          defaults: {
            firstName: `Dr. John`,
            lastName: `Doctor${i}`,
            specialization: specializations[i - 1],
            email: `doctor${i}@example.com`,
            phone: `123-456-780${i}`,
            licenseNumber: `LIC00${i}`,
            experience: 5 + i,
            qualification: "MD",
            userId: user.id,
          },
        });
        console.log(`Doctor ${i} created`);
      }
    }

    // Create some test receptionists
    const receptionistPassword = await bcrypt.hash("receptionist123", 10);
    for (let i = 1; i <= 2; i++) {
      const [user, userCreated] = await User.findOrCreate({
        where: { username: `receptionist${i}@example.com` },
        defaults: {
          username: `receptionist${i}@example.com`,
          password: receptionistPassword,
          role: "receptionist",
        },
      });
      console.log(`Receptionist ${i} created/found`);
    }

    // Create some test appointments
    const patients = await Patient.findAll();
    const doctors = await Doctor.findAll();

    if (patients.length > 0 && doctors.length > 0) {
      for (let i = 0; i < Math.min(10, patients.length * doctors.length); i++) {
        const patient = patients[i % patients.length];
        const doctor = doctors[i % doctors.length];

        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + (i % 7)); // Spread over next 7 days
        appointmentDate.setHours(9 + (i % 8), 0, 0, 0); // 9 AM to 4 PM

        const [appointment, appointmentCreated] =
          await Appointment.findOrCreate({
            where: {
              patientId: patient.id,
              doctorId: doctor.id,
              appointmentDate: appointmentDate,
            },
            defaults: {
              patientId: patient.id,
              doctorId: doctor.id,
              appointmentDate: appointmentDate,
              reason: `Consultation ${i + 1}`,
              status: ["scheduled", "completed", "cancelled"][i % 3],
            },
          });

        if (appointmentCreated) {
          console.log(`Appointment ${i + 1} created`);
        }
      }
    }

    console.log("Test data creation completed successfully!");

    // Print summary
    const totalUsers = await User.count();
    const totalPatients = await Patient.count();
    const totalDoctors = await Doctor.count();
    const totalAppointments = await Appointment.count();

    console.log("\n=== DATABASE SUMMARY ===");
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Total Patients: ${totalPatients}`);
    console.log(`Total Doctors: ${totalDoctors}`);
    console.log(`Total Appointments: ${totalAppointments}`);
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}

// Run the function
createTestData()
  .then(() => {
    console.log("Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
