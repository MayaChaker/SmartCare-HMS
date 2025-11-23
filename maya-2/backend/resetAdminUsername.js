const { User } = require('./models');

async function resetAdminUsernamePassword() {
  try {
    console.log('Resetting admin (username="admin") password...');

    const admin = await User.findOne({ where: { username: 'admin' } });

    if (admin) {
      // Set plain password; model hooks will hash on save
      admin.password = 'admin123';
      await admin.save();
      console.log('Admin (username="admin") password reset successfully!');
    } else {
      console.log('Admin user with username "admin" not found');
    }
  } catch (error) {
    console.error('Error resetting admin (username="admin") password:', error);
  }
}

resetAdminUsernamePassword()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });