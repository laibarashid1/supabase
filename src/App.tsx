import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Box, LogOut, User as UserIcon } from 'lucide-react';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DocumentUpload from './pages/DocumentUpload';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const Navbar = () => {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="glass" style={{
      position: 'fixed',
      top: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '2rem',
      padding: '0.75rem 2rem',
      zIndex: 100,
      width: 'fit-content'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: 'white' }}>
        <Box className="primary-text" size={24} color="hsl(var(--primary))" />
        <span>Supabase</span>
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>
        <Link to="/" style={{ transition: 'color 0.2s' }}>Home</Link>
        <Link to="/tasks" style={{ transition: 'color 0.2s' }}>Tasks</Link>
        <Link to="/documents" style={{ transition: 'color 0.2s' }}>Documents</Link>
      </div>
      
      {session ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'white' }}>
            <UserIcon size={16} />
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.user.email}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="glass"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: 'calc(var(--radius) - 2px)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/login" style={{
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: 'calc(var(--radius) - 2px)',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            Sign In
          </Link>
          <Link to="/signup" className="primary-btn" style={{
            background: 'hsl(var(--primary))',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1.25rem',
            borderRadius: 'calc(var(--radius) - 2px)',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div style={{ position: 'relative' }}>
          <Navbar />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/documents" 
              element={
                <ProtectedRoute>
                  <DocumentUpload />
                </ProtectedRoute>
              } 
            />
          </Routes>

          {/* Footer */}
          <footer style={{
            padding: '4rem 2rem',
            borderTop: '1px solid hsl(var(--border))',
            background: 'rgba(0,0,0,0.2)',
            textAlign: 'center',
            color: 'hsl(var(--muted-foreground))',
            fontSize: '0.9rem'
          }}>
            <p>&copy; 2026 Supabase Inc. All rights reserved.</p>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
