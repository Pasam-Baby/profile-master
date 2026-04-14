import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import JobTracker from './pages/JobTracker';
import CareerRoadmap from './pages/CareerRoadmap';
import ChatAssistant from './pages/ChatAssistant';
import Navigation from './components/Navigation';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/" />;
  
  return <>{children}</>;
};

function AppContent() {
  return (
    <div className="min-h-screen mesh-gradient flex relative overflow-hidden">
      {/* Project-specific Background Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none grayscale brightness-150"
        style={{ 
          backgroundImage: `url('/background.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'overlay'
        }}
      />
      
      <Navigation />
      <main className="flex-1 ml-64 p-8 min-h-screen relative z-10">
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '-2s' }} />
        
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/resume" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><JobTracker /></ProtectedRoute>} />
            <Route path="/roadmap" element={<ProtectedRoute><CareerRoadmap /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatAssistant /></ProtectedRoute>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
