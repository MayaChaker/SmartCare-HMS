require('dotenv').config();
const { sequelize } = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function clearAllDataKeepAdmin() {
    try {
        console.log('Starting database cleanup...');
        
        // Connect to database
        await sequelize.authenticate();
        console.log('Database connected successfully');
        
        // Get list of existing tables
        const [tables] = await sequelize.query("SHOW TABLES");
        const tableNames = tables.map(table => Object.values(table)[0]);
        console.log('Existing tables:', tableNames);
        
        // Clear tables in the correct order (respecting foreign key constraints)
        // Only delete from tables that exist
        
        if (tableNames.includes('appointments')) {
            console.log('Clearing appointments...');
            await sequelize.query('DELETE FROM appointments');
        }
        
        if (tableNames.includes('medical_records')) {
            console.log('Clearing medical records...');
            await sequelize.query('DELETE FROM medical_records');
        }
        
        if (tableNames.includes('patients')) {
            console.log('Clearing patients...');
            await sequelize.query('DELETE FROM patients');
        }
        
        if (tableNames.includes('doctors')) {
            console.log('Clearing doctors...');
            await sequelize.query('DELETE FROM doctors');
        }
        
        if (tableNames.includes('users')) {
            console.log('Clearing all users except admin...');
            await sequelize.query("DELETE FROM users WHERE username != 'maya@example.com'");
        }
        
        // Ensure admin user exists with correct credentials
        console.log('Ensuring admin user exists...');
        const [admin, created] = await User.findOrCreate({
            where: { username: 'maya@example.com' },
            defaults: {
                username: 'maya@example.com',
                password: 'Maya123',
                role: 'admin'
            }
        });
        
        if (created) {
            console.log('Admin user created');
        } else {
            // Update existing admin user to ensure correct password
            admin.password = 'Maya123';
            admin.role = 'admin';
            await admin.save();
            console.log('Admin user updated');
        }
        
        console.log('Database cleanup completed successfully!');
        
        // Show final database state
        const userCount = await User.count();
        console.log(`\n=== FINAL DATABASE STATE ===`);
        console.log(`Total Users: ${userCount}`);
        console.log(`Admin user: maya@example.com (password: Maya123)`);
        console.log(`Login with username: maya@example.com`);
        console.log(`Login with password: Maya123`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('Error during database cleanup:', error);
        process.exit(1);
    }
}

// Run the cleanup
clearAllDataKeepAdmin();