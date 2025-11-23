const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, testConnection } = require('./config/db');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const receptionistRoutes = require('./routes/receptionistRoutes');
// Dev routes (mounted only in development)
let devRoutes = null;
try {
  devRoutes = require('./routes/devRoutes');
} catch (e) {
  // devRoutes may not exist in some environments; ignore
}

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
let server;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:4173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));
// Ensure preflight requests are handled for all routes (handled below)
// Basic request logger to observe preflight and POST traffic
app.use((req, res, next) => {
  const origin = req.headers.origin || 'unknown-origin';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${origin}`);
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());

// Serve uploaded files statically at /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test database connection and sync models
testConnection();

// Sync database models - skip alter to avoid key conflicts
sequelize.sync({ alter: false })
  .then(() => {
    console.log('Database models synchronized successfully.');
    // Create admin user after sync
    return createAdminUser();
  })
  .then(() => {
    console.log('Admin user created successfully.');
    return createDoctorUser();
  })
  .then(() => {
    console.log('Dev doctor user ensured.');
    // Start server only after database operations are complete
    startServer();
  })
  .catch((error) => {
    console.error('Error synchronizing database models:', error);
    // Start server even if database sync fails (for development)
    startServer();
  });

// Function to create admin user
async function createAdminUser() {
  const { User } = require('./models');

  try {
    // Provide plain password; User model hooks handle hashing
    await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Dev helper: ensure a doctor user exists for testing
async function createDoctorUser() {
  const { User, Doctor } = require('./models');
  try {
    const username = 'doc';
    const password = 'doc123';
    const role = 'doctor';
    const [user, created] = await User.findOrCreate({
      where: { username },
      defaults: { username, password, role },
    });
    let changed = false;
    if (!created) {
      if (user.role !== role) {
        user.role = role;
        changed = true;
      }
      if (password) {
        user.password = password;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }
    let doctor = await Doctor.findOne({ where: { userId: user.id } });
    if (!doctor) {
      await Doctor.create({
        firstName: 'Dr.',
        lastName: 'Demo',
        specialization: 'General Medicine',
        email: username,
        phone: '000-000-0000',
        licenseNumber: 'DOC-DEMO',
        experience: 3,
        qualification: 'MD',
        userId: user.id,
      });
    }
  } catch (error) {
    console.error('Error ensuring dev doctor user:', error);
  }
}

// Function to start the server
function startServer() {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/receptionist', receptionistRoutes);
// Mount dev routes when available (development convenience)
if (devRoutes) {
  app.use('/api/dev', devRoutes);
  console.log('Dev routes mounted at /api/dev');
}

// Public doctor route for patients (no authentication required)
const patientController = require('./controllers/patientController');
app.get('/api/doctors', patientController.getAllDoctors);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'SmartCare Hospital Management System API',
    status: 'running',
    version: '1.0.0'
  });
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  console.warn('API 404:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Keep server alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
