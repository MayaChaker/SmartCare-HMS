import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import AdminPanel from "./pages/Admin/AdminPanel";
import DoctorPanel from "./pages/Doctor/DoctorPanel";
import ReceptionistPanel from "./pages/Receptionist/ReceptionistPanel";
import TestConnection from "./pages/TestConnection/TestConnection";

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
                <ProtectedRoute allowedRoles={["patient"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <DoctorPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receptionist"
              element={
                <ProtectedRoute allowedRoles={["receptionist"]}>
                  <ReceptionistPanel />
                </ProtectedRoute>
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
