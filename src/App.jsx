import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import ResumeBuilder from './pages/ResumeBuilder';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import SkillAnalysis from './pages/SkillAnalysis';
import ApplicationTracker from './pages/ApplicationTracker';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import InterviewPrep from './pages/InterviewPrep';
import Welcome from './pages/Welcome';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="app-container">
      <div className="mesh-bg" />
      <Navigation />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Welcome />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
      <Route path="/job/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
      <Route path="/skill-analysis/:id" element={<ProtectedRoute><SkillAnalysis /></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute><ApplicationTracker /></ProtectedRoute>} />
      <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
