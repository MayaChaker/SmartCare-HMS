# SmartCare Hospital Management System - MySQL Database Schema

## Overview
This document provides a complete overview of the MySQL database structure for the SmartCare Hospital Management System, including all tables, their columns, data types, constraints, and relationships.

---

## Table of Contents
1. [Database Schema Overview](#database-schema-overview)
2. [Tables Structure](#tables-structure)
3. [Table Relationships](#table-relationships)
4. [Indexes and Constraints](#indexes-and-constraints)
5. [Sample Data Queries](#sample-data-queries)

---

## Database Schema Overview

The database consists of 5 main tables that manage the hospital management system:
- **Users** - Authentication and role management
- **Patients** - Patient information and medical history
- **Doctors** - Doctor profiles and qualifications
- **Appointments** - Appointment scheduling and management
- **MedicalRecords** - Medical history and treatment records

---

## Tables Structure

### 1. Users Table
**Purpose**: Central authentication and user management

```sql
CREATE TABLE Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'receptionist', 'patient') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Columns Description:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| username | VARCHAR(255) | UNIQUE, NOT NULL | Login username |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| role | ENUM | NOT NULL | User role (admin/doctor/receptionist/patient) |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

### 2. Patients Table
**Purpose**: Patient personal and medical information

```sql
CREATE TABLE Patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT UNIQUE NOT NULL,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    dateOfBirth DATE,
    gender VARCHAR(20),
    address TEXT,
    emergencyContact VARCHAR(100),
    bloodType VARCHAR(10),
    allergies TEXT,
    insurance VARCHAR(255),
    medicalHistory TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
```

**Columns Description:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique patient identifier |
| userId | INT | UNIQUE, NOT NULL, FOREIGN KEY | Links to Users table |
| firstName | VARCHAR(255) | NOT NULL | Patient's first name |
| lastName | VARCHAR(255) | NOT NULL | Patient's last name |
| email | VARCHAR(255) | - | Patient's email address |
| phone | VARCHAR(50) | - | Contact phone number |
| dateOfBirth | DATE | - | Date of birth |
| gender | VARCHAR(20) | - | Gender information |
| address | TEXT | - | Full address |
| emergencyContact | VARCHAR(100) | - | Emergency contact details |
| bloodType | VARCHAR(10) | - | Blood group information |
| allergies | TEXT | - | Medical allergies |
| insurance | VARCHAR(255) | - | Insurance information |
| medicalHistory | TEXT | - | Past medical history |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

### 3. Doctors Table
**Purpose**: Doctor profiles and professional information

```sql
CREATE TABLE Doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT UNIQUE NOT NULL,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    licenseNumber VARCHAR(100),
    experience INT,
    qualification VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
```

**Columns Description:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique doctor identifier |
| userId | INT | UNIQUE, NOT NULL, FOREIGN KEY | Links to Users table |
| firstName | VARCHAR(255) | NOT NULL | Doctor's first name |
| lastName | VARCHAR(255) | NOT NULL | Doctor's last name |
| specialization | VARCHAR(255) | NOT NULL | Medical specialization |
| phone | VARCHAR(50) | - | Contact phone number |
| email | VARCHAR(255) | - | Professional email |
| licenseNumber | VARCHAR(100) | - | Medical license number |
| experience | INT | - | Years of experience |
| qualification | VARCHAR(255) | - | Academic qualifications |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

### 4. Appointments Table
**Purpose**: Appointment scheduling and management

```sql
CREATE TABLE Appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patientId INT NOT NULL,
    doctorId INT NOT NULL,
    appointmentDate DATE NOT NULL,
    appointmentTime TIME,
    status ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    type VARCHAR(100) DEFAULT 'Consultation',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctorId) REFERENCES Doctors(id) ON DELETE CASCADE
);
```

**Columns Description:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique appointment identifier |
| patientId | INT | NOT NULL, FOREIGN KEY | Links to Patients table |
| doctorId | INT | NOT NULL, FOREIGN KEY | Links to Doctors table |
| appointmentDate | DATE | NOT NULL | Scheduled appointment date |
| appointmentTime | TIME | - | Scheduled appointment time |
| status | ENUM | NOT NULL DEFAULT 'scheduled' | Appointment status |
| reason | TEXT | - | Reason for appointment |
| notes | TEXT | - | Additional notes |
| type | VARCHAR(100) | DEFAULT 'Consultation' | Type of appointment |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

### 5. MedicalRecords Table
**Purpose**: Medical history and treatment documentation

```sql
CREATE TABLE MedicalRecords (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patientId INT NOT NULL,
    doctorId INT NOT NULL,
    visitDate DATE NOT NULL,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    notes TEXT,
    prescriptions TEXT,
    testResults TEXT,
    followUpDate DATE,
    medications TEXT,
    symptoms TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctorId) REFERENCES Doctors(id) ON DELETE CASCADE
);
```

**Columns Description:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique medical record identifier |
| patientId | INT | NOT NULL, FOREIGN KEY | Links to Patients table |
| doctorId | INT | NOT NULL, FOREIGN KEY | Links to Doctors table |
| visitDate | DATE | NOT NULL | Date of medical visit |
| diagnosis | TEXT | - | Medical diagnosis |
| treatment | TEXT | - | Treatment plan |
| prescription | TEXT | - | Prescription details |
| notes | TEXT | - | Additional medical notes |
| prescriptions | TEXT | - | Multiple prescriptions |
| testResults | TEXT | - | Test results as text |
| followUpDate | DATE | - | Next appointment date |
| medications | TEXT | - | Medication information |
| symptoms | TEXT | - | Patient symptoms |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

## Table Relationships

### One-to-One Relationships

#### User → Patient Relationship
```sql
-- One user can have only one patient profile
ALTER TABLE Patients ADD CONSTRAINT unique_patient_user UNIQUE (userId);
```

#### User → Doctor Relationship
```sql
-- One user can have only one doctor profile
ALTER TABLE Doctors ADD CONSTRAINT unique_doctor_user UNIQUE (userId);
```

### One-to-Many Relationships

#### Patient → Appointments
```sql
-- One patient can have many appointments
-- Foreign key: Appointments.patientId → Patients.id
```

#### Patient → MedicalRecords
```sql
-- One patient can have many medical records
-- Foreign key: MedicalRecords.patientId → Patients.id
```

#### Doctor → Appointments
```sql
-- One doctor can have many appointments
-- Foreign key: Appointments.doctorId → Doctors.id
```

#### Doctor → MedicalRecords
```sql
-- One doctor can create many medical records
-- Foreign key: MedicalRecords.doctorId → Doctors.id
```

---

## Indexes and Constraints

### Primary Keys
All tables have `id` as PRIMARY KEY with AUTO_INCREMENT:
```sql
PRIMARY KEY (id)
```

### Unique Constraints
```sql
-- Users table
UNIQUE KEY unique_username (username)

-- Patients table
UNIQUE KEY unique_patient_user (userId)

-- Doctors table
UNIQUE KEY unique_doctor_user (userId)
```

### Foreign Key Constraints
```sql
-- Patients table
CONSTRAINT fk_patient_user FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE

-- Doctors table
CONSTRAINT fk_doctor_user FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE

-- Appointments table
CONSTRAINT fk_appointment_patient FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE
CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctorId) REFERENCES Doctors(id) ON DELETE CASCADE

-- MedicalRecords table
CONSTRAINT fk_medicalrecord_patient FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE
CONSTRAINT fk_medicalrecord_doctor FOREIGN KEY (doctorId) REFERENCES Doctors(id) ON DELETE CASCADE
```

### Enum Constraints
```sql
-- Users role constraint
CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient'))

-- Appointments status constraint
CHECK (status IN ('scheduled', 'completed', 'cancelled'))
```

---

## Sample Data Queries

### View All Tables Structure
```sql
-- Show all tables in the database
SHOW TABLES;

-- Describe each table structure
DESCRIBE Users;
DESCRIBE Patients;
DESCRIBE Doctors;
DESCRIBE Appointments;
DESCRIBE MedicalRecords;
```

### Sample Join Queries

#### Get Patient with User Information
```sql
SELECT 
    p.id, 
    p.firstName, 
    p.lastName, 
    p.email, 
    p.phone,
    u.username,
    u.role
FROM Patients p
JOIN Users u ON p.userId = u.id;
```

#### Get Doctor with User Information
```sql
SELECT 
    d.id, 
    d.firstName, 
    d.lastName, 
    d.specialization, 
    d.phone,
    u.username,
    u.role
FROM Doctors d
JOIN Users u ON d.userId = u.id;
```

#### Get Appointments with Patient and Doctor Details
```sql
SELECT 
    a.id,
    a.appointmentDate,
    a.appointmentTime,
    a.status,
    a.reason,
    CONCAT(p.firstName, ' ', p.lastName) AS patientName,
    CONCAT(d.firstName, ' ', d.lastName) AS doctorName,
    d.specialization
FROM Appointments a
JOIN Patients p ON a.patientId = p.id
JOIN Doctors d ON a.doctorId = d.id
ORDER BY a.appointmentDate DESC;
```

#### Get Medical Records with Full Details
```sql
SELECT 
    mr.id,
    mr.visitDate,
    mr.diagnosis,
    mr.treatment,
    mr.prescription,
    mr.testResults,
    CONCAT(p.firstName, ' ', p.lastName) AS patientName,
    CONCAT(d.firstName, ' ', d.lastName) AS doctorName,
    d.specialization
FROM MedicalRecords mr
JOIN Patients p ON mr.patientId = p.id
JOIN Doctors d ON mr.doctorId = d.id
ORDER BY mr.visitDate DESC;
```

### Check Table Relationships
```sql
-- Show foreign key relationships
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME IS NOT NULL
AND TABLE_SCHEMA = 'your_database_name';
```

### Get Table Sizes and Row Counts
```sql
-- Get row counts for all tables
SELECT 
    table_name AS 'Table',
    table_rows AS 'Rows',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'your_database_name'
ORDER BY (data_length + index_length) DESC;
```

---

## Notes on File Storage

**Current Implementation**: The system uses TEXT fields to store medical information as text rather than binary files:

- `testResults` stores test result descriptions as text
- `prescription` stores prescription details as text
- `medicalHistory` stores medical history as text descriptions
- `notes` stores additional notes as text

**File Storage Options for Future Enhancement**:
1. **BLOB Storage**: Store actual files in MySQL using LONGBLOB
2. **File Path Storage**: Store file paths and metadata, keep files on disk
3. **Cloud Storage**: Use services like AWS S3 for file storage

---

**Database**: MySQL 8.0+  
**ORM**: Sequelize 6.37.7  
**Created**: Final Year Project - SmartCare HMS  
**Last Updated**: [Current Date]