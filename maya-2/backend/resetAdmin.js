const { User } = require('./models');

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');
    
    // Find the admin user
    const admin = await User.findOne({ where: { username: 'maya@example.com' } });
    
    if (admin) {
      // Update password - this will trigger the beforeUpdate hook to hash it
      admin.password = 'Maya123';
      await admin.save();
      console.log('Admin password reset successfully!');
    } else {
      console.log('Admin user not found');
    }
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  }
}

resetAdminPassword().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});