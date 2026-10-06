// Creates sample doctor accounts with profiles and gallery portraits.
// Usage: SEED_DOCTOR_PASSWORD=<8+ chars> npm run seed
// Accounts that already exist are left unchanged, so it is safe to run again.
require("dotenv").config();
const { sequelize } = require("../config/db");
const { User, Doctor } = require("../models");
const { SAMPLE_DOCTORS, toDoctorProfile } = require("../demo/sampleData");

async function seed() {
  const password = process.env.SEED_DOCTOR_PASSWORD || "";
  if (password.length < 8) {
    throw new Error("Set SEED_DOCTOR_PASSWORD (8+ characters) for the sample doctor accounts");
  }

  await sequelize.authenticate();
  await sequelize.sync();

  for (const d of SAMPLE_DOCTORS) {
    const exists = await User.findOne({ where: { username: d.username } });
    if (exists) {
      console.log(`skip    ${d.username} (already exists)`);
      continue;
    }

    await sequelize.transaction(async (transaction) => {
      const user = await User.create(
        { username: d.username, password, role: "doctor" },
        { transaction },
      );
      await Doctor.create({ userId: user.id, ...toDoctorProfile(d) }, { transaction });
    });
    console.log(`created ${d.username}`);
  }
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
