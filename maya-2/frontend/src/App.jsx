import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute/RoleBasedRoute';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import AdminPanel from './pages/Admin/AdminPanel';
import DoctorPanel from './pages/Doctor/DoctorPanel';
import ReceptionistPanel from './pages/Receptionist/ReceptionistPanel';
import TestConnection from './pages/TestConnection/TestConnection';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <RoleBasedRoute allowedRoles={['patient']}>
                  <Dashboard />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/doctor" 
              element={
                <RoleBasedRoute allowedRoles={['doctor']}>
                  <DoctorPanel />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/receptionist" 
              element={
                <RoleBasedRoute allowedRoles={['receptionist']}>
                  <ReceptionistPanel />
                </RoleBasedRoute>
              } 
            />
            <Route path="/test" element={<TestConnection />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
