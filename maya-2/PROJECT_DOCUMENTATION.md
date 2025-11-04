# SmartCare Hospital Management System (HMS)
## Final Year Project Documentation

### Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [Authentication System](#authentication-system)
6. [Backend Controllers](#backend-controllers)
7. [API Endpoints](#api-endpoints)
8. [Frontend Components](#frontend-components)
9. [Security Implementation](#security-implementation)
10. [System Features](#system-features)
11. [Installation & Setup](#installation--setup)
12. [Future Enhancements](#future-enhancements)

---

## 1. Project Overview

**SmartCare HMS** is a comprehensive web-based Hospital Management System designed to streamline healthcare operations. The system provides role-based access control for different user types including administrators, doctors, receptionists, and patients.

### Key Objectives:
- Digitize hospital operations and patient management
- Implement secure role-based access control
- Provide real-time appointment scheduling and management
- Maintain comprehensive medical records
- Generate analytics and reports for hospital administration

### Target Users:
- **Administrators**: System management, user creation, analytics
- **Doctors**: Patient management, medical records, appointments
- **Receptionists**: Patient registration, appointment scheduling
- **Patients**: Profile management, appointment booking, medical history

---

## 2. System Architecture

The system follows a **3-tier architecture**:

### Frontend (Presentation Layer)
- **Technology**: React.js with Vite
- **Styling**: Custom CSS with modern UI/UX design
- **Routing**: React Router DOM for SPA navigation
- **State Management**: React Context API for authentication

### Backend (Business Logic Layer)
- **Technology**: Node.js with Express.js framework
- **Architecture**: RESTful API design
- **Middleware**: Custom authentication and authorization
- **Error Handling**: Centralized error management

### Database Layer
- **Primary**: SQLite (Development)
- **Production Ready**: MySQL support via Sequelize ORM
- **ORM**: Sequelize for database operations and migrations

---

## 3. Technology Stack

### Backend Technologies:
```json
{
  "runtime": "Node.js",
  "framework": "Express.js v5.1.0",
  "database": "SQLite3 v5.1.7 / MySQL2 v3.15.3",
  "orm": "Sequelize v6.37.7",
  "authentication": "JWT (jsonwebtoken v9.0.2)",
  "encryption": "bcryptjs v3.0.2",
  "cors": "cors v2.8.5",
  "environment": "dotenv v17.2.3"
}
```

### Frontend Technologies:
```json
{
  "framework": "React v19.1.1",
  "build_tool": "Vite v7.1.7",
  "routing": "React Router DOM v7.9.4",
  "http_client": "Axios v1.12.2",
  "styling": "Custom CSS with modern design patterns"
}
```

---

## 4. Database Design

### Entity Relationship Diagram

The database consists of 5 main entities with the following relationships:

#### 4.1 Users Table (Base Authentication)
```sql
Users {
  id: INTEGER (Primary Key, Auto Increment)
  username: STRING (Unique, Not Null)
  password: STRING (Hashed, Not Null)
  role: ENUM('admin', 'doctor', 'receptionist', 'patient')
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

#### 4.2 Patients Table
```sql
Patients {
  id: INTEGER (Primary Key, Auto Increment)
  userId: INTEGER (Foreign Key -> Users.id)
  firstName: STRING (Not Null)
  lastName: STRING (Not Null)
  email: STRING
  phone: STRING
  dateOfBirth: DATE
  gender: STRING
  address: TEXT
  emergencyContact: STRING
  bloodType: STRING
  allergies: TEXT
  insurance: STRING
  medicalHistory: TEXT
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

#### 4.3 Doctors Table
```sql
Doctors {
  id: INTEGER (Primary Key, Auto Increment)
  userId: INTEGER (Foreign Key -> Users.id)
  firstName: STRING (Not Null)
  lastName: STRING (Not Null)
  specialization: STRING (Not Null)
  phone: STRING
  email: STRING
  licenseNumber: STRING
  experience: INTEGER
  qualification: STRING
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

#### 4.4 Appointments Table
```sql
Appointments {
  id: INTEGER (Primary Key, Auto Increment)
  patientId: INTEGER (Foreign Key -> Patients.id)
  doctorId: INTEGER (Foreign Key -> Doctors.id)
  appointmentDate: DATE (Not Null)
  appointmentTime: TIME
  status: ENUM('scheduled', 'completed', 'cancelled')
  reason: TEXT
  notes: TEXT
  type: STRING (Default: 'Consultation')
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

#### 4.5 Medical Records Table
```sql
MedicalRecords {
  id: INTEGER (Primary Key, Auto Increment)
  patientId: INTEGER (Foreign Key -> Patients.id)
  doctorId: INTEGER (Foreign Key -> Doctors.id)
  visitDate: DATE (Not Null)
  diagnosis: TEXT
  treatment: TEXT
  prescription: TEXT
  notes: TEXT
  testResults: TEXT
  followUpDate: DATE
  medications: TEXT
  symptoms: TEXT
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### 4.6 Database Relationships

**One-to-One Relationships:**
- User → Patient (userId)
- User → Doctor (userId)

**One-to-Many Relationships:**
- Patient → Appointments (patientId)
- Patient → MedicalRecords (patientId)
- Doctor → Appointments (doctorId)
- Doctor → MedicalRecords (doctorId)

**Sequelize Associations:**
```javascript
// User associations
User.hasOne(Patient, { foreignKey: 'userId' });
User.hasOne(Doctor, { foreignKey: 'userId' });

// Patient associations
Patient.belongsTo(User, { foreignKey: 'userId' });
Patient.hasMany(Appointment, { foreignKey: 'patientId' });
Patient.hasMany(MedicalRecord, { foreignKey: 'patientId' });

// Doctor associations
Doctor.belongsTo(User, { foreignKey: 'userId' });
Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
Doctor.hasMany(MedicalRecord, { foreignKey: 'doctorId' });
```

---

## 5. Authentication System

### 5.1 JWT-Based Authentication

The system implements **JSON Web Token (JWT)** based authentication with the following components:

#### Token Structure:
```javascript
{
  id: user.id,
  username: user.username,
  role: user.role,
  iat: issuedAt,
  exp: expiresIn // 24 hours
}
```

#### 5.2 Password Security
- **Hashing Algorithm**: bcryptjs with salt rounds = 10
- **Pre-save Hooks**: Automatic password hashing on user creation/update
- **Password Validation**: Minimum 6 characters required

```javascript
// Password hashing implementation
beforeCreate: async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
}
```

### 5.3 Middleware Implementation

#### Authentication Middleware (`verifyToken`):
```javascript
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

#### Authorization Middleware (`checkRole`):
```javascript
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
```

### 5.4 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, analytics, system settings |
| **Doctor** | Patient records, appointments, medical records creation |
| **Receptionist** | Patient registration, appointment scheduling, basic patient info |
| **Patient** | Personal profile, appointment booking, medical history viewing |

---

## 6. Backend Controllers

### 6.1 Authentication Controller (`authController.js`)

**Purpose**: Handles user login and patient registration

**Key Functions:**
- `login()`: Validates credentials and generates JWT token
- `registerPatient()`: Creates new patient account with user credentials

**Security Features:**
- Password validation and hashing
- Duplicate username prevention
- JWT token generation with 24-hour expiry

### 6.2 Admin Controller (`adminController.js`)

**Purpose**: System administration and user management

**Key Functions:**
- `getAllUsers()`: Retrieve all system users
- `createUser()`: Create doctors, receptionists, or admins
- `updateUser()`: Modify user information
- `deleteUser()`: Remove users with cascade deletion
- `getAnalytics()`: Generate system statistics and reports

**Analytics Provided:**
- Total users, patients, doctors, appointments
- Today's appointments count
- Recent registrations (30 days)
- Appointment status distribution

### 6.3 Doctor Controller (`doctorController.js`)

**Purpose**: Doctor-specific functionalities

**Key Functions:**
- `getAppointments()`: Retrieve doctor's scheduled appointments
- `getSchedule()`: Get doctor's complete schedule
- `getPatientDetails()`: Access patient information and medical history
- `createMedicalRecord()`: Add new medical records for patients
- `updateAppointmentStatus()`: Mark appointments as completed/cancelled

### 6.4 Patient Controller (`patientController.js`)

**Purpose**: Patient profile and appointment management

**Key Functions:**
- `getProfile()`: Retrieve patient profile information
- `updateProfile()`: Update personal information
- `getAppointments()`: View patient's appointments
- `bookAppointment()`: Schedule new appointments
- `getMedicalRecords()`: Access medical history
- `getAllDoctors()`: View available doctors for booking

### 6.5 Receptionist Controller (`receptionistController.js`)

**Purpose**: Front desk operations and patient management

**Key Functions:**
- `registerPatient()`: Register new patients
- `getAllSchedules()`: View all doctors' schedules
- `createAppointment()`: Schedule appointments for patients
- `updateAppointment()`: Modify existing appointments
- `getAllPatients()`: Access patient directory

---

## 7. API Endpoints

### 7.1 Authentication Routes (`/api/auth`)
```
POST /api/auth/login
POST /api/auth/register-patient
```

### 7.2 Admin Routes (`/api/admin`) - Protected: Admin Only
```
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
GET    /api/admin/analytics
GET    /api/admin/doctors
GET    /api/admin/patients
GET    /api/admin/appointments
GET    /api/admin/settings
PUT    /api/admin/settings
```

### 7.3 Doctor Routes (`/api/doctor`) - Protected: Doctor Only
```
GET    /api/doctor/appointments
GET    /api/doctor/schedule
GET    /api/doctor/patients/:id
POST   /api/doctor/medical-records
PUT    /api/doctor/appointments/:id
```

### 7.4 Patient Routes (`/api/patient`) - Protected: Patient Only
```
GET    /api/patient/profile
PUT    /api/patient/profile
GET    /api/patient/appointments
POST   /api/patient/appointments
GET    /api/patient/medical-records
```

### 7.5 Receptionist Routes (`/api/receptionist`) - Protected: Receptionist Only
```
POST   /api/receptionist/patients
GET    /api/receptionist/schedules
POST   /api/receptionist/appointments
PUT    /api/receptionist/appointments/:id
GET    /api/receptionist/patients
```

### 7.6 Public Routes
```
GET    /api/doctors (Available doctors list)
GET    / (API status and version)
```

---

## 8. Frontend Components

### 8.1 Application Structure

The frontend follows a modern React architecture with the following structure:

```
src/
├── components/          # Reusable UI components
├── context/            # React Context providers
├── pages/              # Main application pages
├── styles/             # CSS stylesheets
├── utils/              # Utility functions and API calls
└── App.jsx             # Main application component
```

### 8.2 Authentication Pages

#### Login Page (`Login.jsx`)
- **Purpose**: Universal login for all user roles
- **Features**:
  - Username/password authentication
  - Role-based redirection after login
  - Form validation and error handling
  - Responsive design with modern UI
- **Redirects**: 
  - Admin → `/admin`
  - Doctor → `/doctor`
  - Receptionist → `/receptionist`
  - Patient → `/dashboard`

#### Register Page (`Register.jsx`)
- **Purpose**: Patient self-registration
- **Features**:
  - Comprehensive patient information form
  - Password confirmation validation
  - Medical history collection
  - Real-time form validation
  - Automatic account creation with patient profile

### 8.3 Dashboard Components

#### Patient Dashboard (`Dashboard.jsx`)
- **Features**:
  - **Appointments Tab**: View, book, and manage appointments
  - **Medical Records Tab**: Access complete medical history
  - **Profile Tab**: Update personal information
  - **Appointment Booking Modal**: Select doctor, date, and time
  - **Profile Management**: Update contact info, medical history
- **Key Functions**:
  - Real-time appointment status updates
  - Medical record viewing with detailed information
  - Profile editing with validation

#### Doctor Dashboard (`DoctorPanel.jsx`)
- **Features**:
  - **Dashboard Overview**: Today's appointments and statistics
  - **Appointments Management**: View and update appointment status
  - **Patient Records**: Access patient medical history
  - **Medical Record Creation**: Add new medical records
  - **Schedule Management**: View daily/weekly schedule
- **Key Functions**:
  - Patient search and selection
  - Medical record creation with prescriptions
  - Appointment status updates (completed/cancelled)

#### Receptionist Dashboard (`ReceptionistPanel.jsx`)
- **Features**:
  - **Patient Registration**: Create new patient accounts
  - **Appointment Scheduling**: Book appointments for patients
  - **Queue Management**: Today's appointments and check-ins
  - **Patient Directory**: Search and manage patient information
- **Key Functions**:
  - New patient registration with user account creation
  - Appointment scheduling with doctor availability
  - Daily appointment management

#### Admin Panel (`AdminPanel.jsx`)
- **Features**:
  - **User Management**: Create, update, delete users
  - **System Analytics**: Dashboard with key metrics
  - **Role Management**: Assign roles to users
  - **System Settings**: Configuration management
- **Key Functions**:
  - User creation for doctors, receptionists, admins
  - System-wide analytics and reporting
  - User role and permission management

### 8.4 Shared Components

#### Protected Route (`ProtectedRoute.jsx`)
```javascript
// Ensures user is authenticated before accessing routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  return isAuthenticated() ? children : <Navigate to="/login" />;
};
```

#### Role-Based Route (`RoleBasedRoute.jsx`)
```javascript
// Restricts access based on user roles
const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    return <Navigate to={getRoleBasedRoute(user.role)} />;
  }
  
  return children;
};
```

#### Sidebar Component (`Sidebar.jsx`)
- **Features**:
  - Role-based navigation menu
  - Collapsible design for mobile
  - Active route highlighting
  - User information display
  - Logout functionality

### 8.5 Context Management

#### Authentication Context (`AuthContext.jsx`)
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication methods
  const login = async (credentials) => { /* JWT login */ };
  const register = async (userData) => { /* Patient registration */ };
  const logout = () => { /* Clear tokens and user data */ };
  
  // Helper methods
  const isAuthenticated = () => !!user && !!localStorage.getItem('token');
  const hasRole = (role) => user?.role === role;
  const getUserRole = () => user?.role || null;

  return (
    <AuthContext.Provider value={{
      user, login, register, logout, 
      isAuthenticated, loading, hasRole, getUserRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Key Features**:
- **Token Management**: Automatic token storage and retrieval
- **Session Persistence**: User data persisted in localStorage
- **Role Checking**: Helper functions for role-based access
- **Loading States**: Proper loading state management
- **Error Handling**: Comprehensive error handling for auth operations

### 8.6 Routing Architecture

#### Main App Router (`App.jsx`)
```javascript
<Router>
  <AuthProvider>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['patient']}>
            <Dashboard />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      
      {/* Additional role-based routes */}
    </Routes>
  </AuthProvider>
</Router>
```

### 8.7 State Management Strategy

#### Local State Management:
- **Component State**: useState for component-specific data
- **Form State**: Controlled components with validation
- **Loading States**: Individual loading states for async operations

#### Global State Management:
- **Authentication**: React Context for user authentication
- **API State**: Direct API calls with local state updates
- **Session Management**: localStorage for token persistence

### 8.8 UI/UX Design Principles

#### Design System:
- **Color Scheme**: Professional healthcare color palette
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent spacing using CSS custom properties
- **Responsive Design**: Mobile-first approach with breakpoints

#### User Experience:
- **Loading States**: Proper loading indicators for all async operations
- **Error Handling**: User-friendly error messages and validation
- **Navigation**: Intuitive navigation with breadcrumbs and active states
- **Accessibility**: Semantic HTML and keyboard navigation support

#### Form Design:
- **Validation**: Real-time validation with clear error messages
- **Input Types**: Appropriate input types for different data
- **Layout**: Logical grouping of related fields
- **Submission**: Clear submission states and feedback

---

## 9. Security Implementation

### 9.1 Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Token Expiry**: 24-hour token lifetime
- **Password Hashing**: bcryptjs with salt rounds
- **CORS Configuration**: Restricted origins for API access

### 9.2 Authorization Security
- **Role-Based Access**: Middleware-enforced role checking
- **Route Protection**: Authentication required for sensitive endpoints
- **Data Isolation**: Users can only access their own data

### 9.3 Input Validation
- **Frontend Validation**: Client-side form validation
- **Backend Validation**: Server-side data sanitization
- **SQL Injection Prevention**: Sequelize ORM parameterized queries

### 9.4 Environment Security
- **Environment Variables**: Sensitive data in .env files
- **JWT Secret**: Secure random secret key
- **Database Credentials**: Environment-based configuration

---

## 10. System Features

### 10.1 User Management
- Multi-role user system (Admin, Doctor, Receptionist, Patient)
- Secure registration and authentication
- Profile management for all user types

### 10.2 Appointment System
- Real-time appointment scheduling
- Doctor availability management
- Appointment status tracking (Scheduled, Completed, Cancelled)
- Conflict prevention and validation

### 10.3 Medical Records
- Comprehensive patient medical history
- Doctor-patient record association
- Prescription and treatment tracking
- Test results and follow-up management

### 10.4 Analytics and Reporting
- System usage statistics
- Appointment analytics
- User registration trends
- Real-time dashboard metrics

### 10.5 Responsive Design
- Mobile-friendly interface
- Cross-browser compatibility
- Modern UI/UX with CSS Grid and Flexbox
- Accessible design principles

---

## 11. Installation & Setup

### 11.1 Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- SQLite3 (for development)
- MySQL (for production)

### 11.2 Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run init-db
npm run dev
```

### 11.3 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 11.4 Environment Configuration
```env
# Backend .env
PORT=5000
JWT_SECRET=your_jwt_secret_key
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=smartcare_hms
NODE_ENV=development
```

---

## 12. Future Enhancements

### 12.1 Technical Improvements
- **Real-time Notifications**: WebSocket implementation for live updates
- **File Upload**: Medical document and image upload functionality
- **Email Integration**: Appointment reminders and notifications
- **Mobile App**: React Native mobile application

### 12.2 Feature Enhancements
- **Billing System**: Invoice generation and payment tracking
- **Inventory Management**: Medical supplies and equipment tracking
- **Telemedicine**: Video consultation integration
- **Advanced Analytics**: Predictive analytics and reporting

### 12.3 Security Enhancements
- **Two-Factor Authentication**: Enhanced security for admin accounts
- **Audit Logging**: Comprehensive system activity tracking
- **Data Encryption**: End-to-end encryption for sensitive data
- **Backup System**: Automated database backup and recovery

---

## Conclusion

The SmartCare Hospital Management System demonstrates a comprehensive understanding of modern web development practices, including:

- **Full-stack Development**: React.js frontend with Node.js/Express backend
- **Database Design**: Relational database with proper normalization
- **Security Implementation**: JWT authentication and role-based authorization
- **API Design**: RESTful API architecture with proper HTTP methods
- **Modern UI/UX**: Responsive design with contemporary styling

This project showcases the ability to design, develop, and deploy a complete healthcare management solution that addresses real-world requirements while maintaining security, scalability, and user experience standards.

---

**Project Developed By**: [Your Name]  
**Academic Year**: [Year]  
**Institution**: [University/College Name]  
**Supervisor**: [Professor Name]  
**Date**: [Submission Date]