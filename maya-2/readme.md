
**Project:** Full-Stack Hospital Management System ("SmartCare")

**Objective:** Generate a complete full-stack web application based on the provided specifications. The system must manage patients, doctors, receptionists, and administrators with role-specific dashboards and functionalities.

**Technology Stack:**
* **Frontend:** React with Vite (using JavaScript)
* **Backend:** Node.js with Express.js
* **Database:** MySQL
* **ORM:** Sequelize
* **Authentication:** JSON Web Tokens (JWT) for role-based access control.
* **Styling:** Tailwind CSS for a clean, modern, and responsive UI.

---

### **1. Database Schema (MySQL & Sequelize Models)**

Please define the Sequelize models and their associations for the following database schema. This schema is based on the provided class diagrams and functional requirements.

**`User` Model:**
* `id`: `INTEGER`, Primary Key, Auto-increment
* `username`: `STRING`, Unique, Not Null
* `password`: `STRING`, Not Null (will be hashed)
* `role`: `ENUM('admin', 'doctor', 'receptionist', 'patient')`, Not Null

**`Patient` Model:**
* `id`: `INTEGER`, Primary Key, Auto-increment
* `firstName`: `STRING`, Not Null
* `lastName`: `STRING`, Not Null
* `dob`: `DATEONLY` (Date of Birth)
* `contact`: `STRING`
* `medicalHistory`: `TEXT`
* **Association:** `Patient` belongs to one `User` (`userId` as Foreign Key).

**`Doctor` Model:**
* `id`: `INTEGER`, Primary Key, Auto-increment
* `firstName`: `STRING`, Not Null
* `lastName`: `STRING`, Not Null
* `specialization`: `STRING`, Not Null
* **Association:** `Doctor` belongs to one `User` (`userId` as Foreign Key).

**`Appointment` Model:**
* `id`: `INTEGER`, Primary Key, Auto-increment
* `appointmentDate`: `DATETIME`, Not Null
* `status`: `ENUM('scheduled', 'completed', 'cancelled')`, Not Null, Default: `'scheduled'`
* `reason`: `TEXT`
* **Associations:**
    * `Appointment` belongs to one `Patient` (`patientId` as Foreign Key).
    * `Appointment` belongs to one `Doctor` (`doctorId` as Foreign Key).

**`MedicalRecord` Model:**
* `id`: `INTEGER`, Primary Key, Auto-increment
* `visitDate`: `DATE`, Not Null
* `notes`: `TEXT`
* `prescriptions`: `TEXT`
* `testResults`: `TEXT` (e.g., storing text or a URL to an uploaded file)
* **Associations:**
    * `MedicalRecord` belongs to one `Patient` (`patientId` as Foreign Key).
    * `MedicalRecord` belongs to one `Doctor` (`doctorId` as Foreign Key).

---

### **2. Backend API (Node.js, Express, Sequelize, JWT)**

Create a RESTful API with role-based protected routes.

**A. Auth Endpoints (Public)**
* `POST /api/auth/login`: Authenticates a user (any role) and returns a JWT token containing their `id`, `username`, and `role`.
* `POST /api/auth/register-patient`: Allows a new patient to create a `User` account (role: 'patient') and an associated `Patient` profile.

**B. Admin Endpoints (Role: `admin`)**
* `POST /api/admin/users`: Create new users (for Doctors or Receptionists) with specified roles.
* `GET /api/admin/users`: Get a list of all users (doctors, receptionists).
* `PUT /api/admin/users/:id`: Update a user's account details.
* `DELETE /api/admin/users/:id`: Delete a user account.

**C. Patient Endpoints (Role: `patient`)**
* `GET /api/patient/profile`: Get the patient's own profile information.
* `GET /api/patient/appointments`: Get a list of the patient's own past and future appointments.
* `POST /api/patient/appointments`: Schedule a new appointment with a specific doctor.
* `PUT /api/patient/appointments/:id`: Reschedule or cancel an existing appointment.
* `GET /api/patient/records`: View all of the patient's own medical records, including prescriptions and test results.
* `GET /api/doctors`: Get a public list of all doctors and their specializations (for booking).

**D. Doctor Endpoints (Role: `doctor`)**
* `GET /api/doctor/schedule`: View the doctor's own calendar of appointments.
* `GET /api/doctor/patients/:id`: Access a specific patient's complete medical record (history, past visits, test results).
* `POST /api/doctor/records`: Create a new `MedicalRecord` (prescription, test results) for a patient after a visit.
* `PUT /api/doctor/records/:id`: Update an existing medical record.

**E. Receptionist Endpoints (Role: `receptionist`)**
* `POST /api/receptionist/patients`: Register a new patient (create `User` and `Patient` entries).
* `GET /api/receptionist/schedules`: View all doctor's daily appointment schedules.
* `POST /api/receptionist/appointments`: Schedule an appointment for a patient.
* `PUT /api/receptionist/appointments/:id`: Reschedule or cancel a patient's appointment.
* `PUT /api/receptionist/checkin/:appointmentId`: Mark a patient as "checked-in" upon arrival.

---

### **3. Frontend (React, Vite, Tailwind CSS)**

Create a clean, responsive, and simple-to-use UI. Use React Router for navigation and create protected routes that redirect to the login page if the user is not authenticated or does not have the correct role.

**A. Public Pages**
* **`LoginPage`**: A single login form for all user roles.
* **`RegisterPage`**: A registration form for new patients.

**B. Core Components**
* **`Navbar`**: A navigation bar that shows different links based on the user's role (e.g., "Dashboard," "Schedule," "Manage Users").
* **`ProtectedRoute`**: A component that wraps routes to check for a valid JWT and the correct user role.

**C. Patient Dashboard (Role: `patient`)**
* **`PatientDashboard`**: Main page showing upcoming appointments and recent notifications.
* **`AppointmentsPage`**:
    * View a list of past and upcoming appointments.
    * A form to schedule a new appointment (select doctor, date, time).
    * Buttons to cancel or reschedule appointments.
* **`MedicalRecordsPage`**: View-only page listing all medical records, prescriptions, and test results.

**D. Doctor Dashboard (Role: `doctor`)**
* **`DoctorDashboard`**: Main page showing the doctor's schedule for today.
* **`SchedulePage`**: A calendar view (e.g., using `react-big-calendar`) displaying all scheduled appointments.
* **`PatientDetailsPage`**:
    * Search for a patient.
    * View a selected patient's complete medical history.
    * A form to create a new `MedicalRecord` (add notes, prescriptions, and upload test results).

**E. Receptionist Dashboard (Role: `receptionist`)**
* **`ReceptionistDashboard`**: Main page with two primary functions:
    * **Patient Registration**: A form to create a new patient profile.
    * **Appointment Management**: A section to schedule, reschedule, and cancel appointments for any patient with any doctor.
* **`CheckInPage`**: A list of today's appointments with a "Check-in" button for arriving patients.
* **`SchedulesViewPage`**: A view to see the daily schedules for all doctors.

**F. Admin Dashboard (Role: `admin`)**
* **`AdminDashboard`**: Main page for user management.
* **`UserManagementPage`**:
    * A table displaying all doctor and receptionist users.
    * A form to create a new user (doctor/receptionist) and assign their role.
    * Buttons to edit or delete existing users.