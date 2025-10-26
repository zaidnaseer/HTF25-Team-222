import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // Keep this import for the redirect
import LearnerHubs from './pages/LearnerHubs';
import HubDetail from './pages/HubDetail';
import Trainers from './pages/Trainers';
import TrainerProfile from './pages/TrainerProfile';
import Profile from './pages/Profile';
import Sessions from './pages/Sessions';
import Roadmaps from './pages/Roadmaps';
import RoadmapDetail from './pages/RoadmapDetail';

// --- Import the new trainer pages ---
import TrainerDashboard from './pages/TrainerDashboard';
import AvailabilitySettings from './pages/AvailabilitySettings';

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="text-xl">Loading...</div>
        </div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
}

// --- ADD THIS NEW COMPONENT ---
// Checks user role and redirects to the appropriate dashboard
function DashboardRedirect() {
  const { user } = useAuth();

  // If user data isn't loaded yet, show loading or nothing
  if (!user) return <div>Loading user...</div>;

  if (user.isTrainer) {
    return <Navigate to="/trainer-dashboard" replace />;
  }

  return <Dashboard />; // Render the normal learner dashboard
}

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <Router>
            <div className="min-h-screen bg-background">
                {isAuthenticated && <Navbar />}
                <Routes>
                    <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
                    <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />

                    {/* --- Learner/Common Routes --- */}
                    {/* Use the DashboardRedirect for the main dashboard link */}
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
                    <Route path="/hubs" element={<ProtectedRoute><LearnerHubs /></ProtectedRoute>} />
                    <Route path="/hubs/:id" element={<ProtectedRoute><HubDetail /></ProtectedRoute>} />
                    <Route path="/trainers" element={<ProtectedRoute><Trainers /></ProtectedRoute>} />
                    <Route path="/trainers/:id" element={<ProtectedRoute><TrainerProfile /></ProtectedRoute>} />
                    <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
                    <Route path="/roadmaps" element={<ProtectedRoute><Roadmaps /></ProtectedRoute>} />
                    <Route path="/roadmaps/:id" element={<ProtectedRoute><RoadmapDetail /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                    {/* --- Trainer Specific Routes --- */}
                    <Route path="/trainer-dashboard" element={<ProtectedRoute><TrainerDashboard /></ProtectedRoute>} />
                    <Route path="/availability-settings" element={<ProtectedRoute><AvailabilitySettings /></ProtectedRoute>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
