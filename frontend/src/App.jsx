import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./context/AuthContext";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Activate from "./pages/Activate/Activate";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import NotFound from "./pages/NotFound/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import Loader from "./components/Loader";

// Each portal is downloaded only when someone opens it, so visitors of the website do not load them
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const AdminPanel = lazy(() => import("./pages/Admin/AdminPanel"));
const DoctorPanel = lazy(() => import("./pages/Doctor/DoctorPanel"));
const ReceptionistPanel = lazy(() => import("./pages/Receptionist/ReceptionistPanel"));

const portalLoading = (
  <div className="site min-h-screen bg-ivory">
    <Loader label="Opening your portal…" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <Suspense fallback={portalLoading}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/activate" element={<Activate />} />
              <Route path="/change-password" element={<ChangePassword />} />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;
