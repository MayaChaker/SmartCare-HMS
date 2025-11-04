# SmartCare Hospital Management System - Complete Setup Guide

## 🚀 Prerequisites

Before starting, ensure you have the following installed on your laptop:

### Required Software

1. **Node.js** (v16 or higher)

   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **MySQL Server** (v8.0 or higher)

   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use MySQL Workbench for GUI management

3. **Git** (for cloning repository)

   - Download from: https://git-scm.com/

4. **Code Editor** (VS Code recommended)
   - Download from: https://code.visualstudio.com/

## 📁 Step 1: Project Setup

### 1.1 Clone or Copy Project Files

```bash
# If using git (recommended)
git clone <your-repository-url>
cd maya-2

# Or manually copy the project folder to your new laptop
```

### 1.2 Install Backend Dependencies

```bash
cd backend
npm install
```

### 1.3 Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## 🗄️ Step 2: MySQL Database Setup

### 2.1 Create Database

Open MySQL command line or MySQL Workbench and run:

```sql
-- Create the database
CREATE DATABASE IF NOT EXISTS smartcare_hms;

-- Use the database
USE smartcare_hms;

-- Create a dedicated user (optional but recommended)
CREATE USER IF NOT EXISTS 'smartcare_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON smartcare_hms.* TO 'smartcare_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2.2 Configure Database Connection

#### Option A: Environment Variables (Recommended)

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smartcare_hms
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

#### Option B: Update Database Configuration

If you prefer to update the config file directly, edit `backend/config/db.js`:

```javascript
const sequelize = new Sequelize(
  "smartcare_hms", // Database name
  "root", // MySQL username
  "your_mysql_password", // MySQL password
  {
    host: "localhost",
    dialect: "mysql",
    port: 3306,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);
```

## 🏗️ Step 3: Create Database Tables

### 3.1 Automatic Table Creation (Recommended)

The project includes automatic table creation scripts. Run:

```bash
cd backend
node createTables.js
```

This will create all required tables with proper relationships.

### 3.2 Manual Table Creation (Alternative)

If you prefer to create tables manually, here's the complete SQL:

```sql
-- Users Table
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient', 'doctor', 'receptionist', 'admin') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE Patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT UNIQUE NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    dateOfBirth DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    allergies TEXT,
    medicalHistory TEXT,
    emergencyContact VARCHAR(100),
    emergencyPhone VARCHAR(20),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

-- Doctors Table
CREATE TABLE Doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT UNIQUE NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    licenseNumber VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    department VARCHAR(100),
    experience INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

-- Appointments Table
CREATE TABLE Appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patientId INT NOT NULL,
    doctorId INT NOT NULL,
    appointmentDate DATE NOT NULL,
    appointmentTime TIME NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctorId) REFERENCES Doctors(id) ON DELETE CASCADE
);

-- Medical Records Table
CREATE TABLE MedicalRecords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patientId INT NOT NULL,
    doctorId INT NOT NULL,
    appointmentId INT,
    diagnosis TEXT NOT NULL,
    treatment TEXT,
    prescription TEXT,
    notes TEXT,
    prescriptions TEXT,
    testResults TEXT,
    medications TEXT,
    symptoms TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctorId) REFERENCES Doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (appointmentId) REFERENCES Appointments(id) ON DELETE SET NULL
);
```

## 🔧 Step 4: Create Default Admin User

Run the admin creation script:

```bash
cd backend
node resetAdmin.js
```

This creates a default admin user with:

- **Username**: admin
- **Password**: admin123

⚠️ **Important**: Change this password immediately after first login!

## 🧪 Step 5: Create Test Data (Optional)

To populate your database with sample data:

```bash
cd backend
node createTestData.js
```

This creates sample patients, doctors, appointments, and medical records for testing.

## 🚀 Step 6: Start the Application

### 6.1 Start Backend Server

```bash
cd backend
npm start
```

The backend server should start on port 5000. You'll see:

```
Server running on port 5000
Database connected successfully
All tables created successfully!
```

### 6.2 Start Frontend Development Server

Open a new terminal:

```bash
cd frontend
npm run dev
```

The frontend should start on port 5173 and automatically open in your browser.

## 🔍 Step 7: Verify Installation

### 7.1 Check Backend API

Visit: `http://localhost:5000/api/health`

You should see: `{"message":"Server is running!"}`

### 7.2 Test Database Connection

Run this command to verify database tables:

```bash
cd backend
node -e "
const { sequelize } = require('./config/db');
sequelize.authenticate()
  .then(() => console.log('✅ Database connection successful!'))
  .catch(err => console.error('❌ Database connection failed:', err));
"
```

### 7.3 Login to Application

Visit: `http://localhost:5173`

Try logging in with the admin credentials:

- **Username**: admin
- **Password**: admin123

## 🛠️ Troubleshooting

### Database Connection Issues

#### Error: "Access denied for user"

```bash
# Reset MySQL root password (if needed)
mysql -u root -p
# Then run:
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

#### Error: "Unknown database"

Make sure you created the database:

```sql
CREATE DATABASE smartcare_hms;
```

#### Error: "Cannot connect to MySQL"

1. Check if MySQL service is running:

   - Windows: `net start mysql`
   - Mac/Linux: `sudo service mysql start`

2. Verify MySQL port (default 3306):

```bash
netstat -an | findstr 3306
```

### Port Conflicts

#### Backend Port 5000 Already in Use

Change port in `backend/.env`:

```env
PORT=5001
```

#### Frontend Port 5173 Already in Use

Frontend will automatically use next available port.

### Node.js Issues

#### npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json
npm install
```

#### Permission errors (Linux/Mac)

```bash
sudo npm install -g npm
npm config set unsafe-perm true
```

## 📊 Database Verification Queries

Run these queries to verify your setup:

```sql
-- Check all tables
SHOW TABLES;

-- Check table structure
DESCRIBE Users;
DESCRIBE Patients;
DESCRIBE Doctors;
DESCRIBE Appointments;
DESCRIBE MedicalRecords;

-- Check relationships
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'smartcare_hms' AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Check data count
SELECT 'Users' as table_name, COUNT(*) as count FROM Users
UNION ALL
SELECT 'Patients', COUNT(*) FROM Patients
UNION ALL
SELECT 'Doctors', COUNT(*) FROM Doctors
UNION ALL
SELECT 'Appointments', COUNT(*) FROM Appointments
UNION ALL
SELECT 'MedicalRecords', COUNT(*) FROM MedicalRecords;
```

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Update JWT secret in `.env` file
- [ ] Use strong MySQL passwords
- [ ] Configure firewall rules
- [ ] Enable SSL for production
- [ ] Set up regular database backups

## 📋 Quick Reference Commands

```bash
# Full setup in order:
cd backend && npm install
cd ../frontend && npm install
cd ../backend
# Create .env file with your MySQL credentials
node createTables.js
node resetAdmin.js
npm start

# In new terminal:
cd frontend
npm run dev
```

## 🎉 Success Indicators

✅ **Backend running**: `Server running on port 5000`
✅ **Database connected**: `Database connected successfully`
✅ **Frontend running**: `Local: http://localhost:5173/`
✅ **Admin accessible**: Login with admin/admin123
✅ **All features working**: Test patient, doctor, receptionist, and admin functionalities

---

**🎯 Next Steps**:

- Test all user roles (patient, doctor, receptionist, admin)
- Create additional test data as needed
- Configure backup procedures
- Set up monitoring (optional)

**📞 Need Help?** Check the troubleshooting section above or verify each step sequentially.
