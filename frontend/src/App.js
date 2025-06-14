import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Web3Provider } from './contexts/Web3Context';
import { UserProvider } from './contexts/UserContext';
import { PensionerProvider } from './contexts/PensionerContext';
import { OfflineProvider } from './contexts/OfflineContext';
import LoadingScreen from './components/LoadingScreen';
import ThemeToggle from './components/ThemeToggle';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import PensionerDashboard from './pages/PensionerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Verification from './pages/Verification';
import RegisterPensioner from './pages/RegisterPensioner';
import RegisterDeath from './pages/RegisterDeath';
import NotFound from './pages/NotFound';
import VerificationSetup from './pages/VerificationSetup';
import Contact from './pages/Contact';
import VerificationGuide from './pages/VerificationGuide';

// User roles
import { ROLES } from './contexts/UserContext';

// Toast notifications
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [loading, setLoading] = useState(true);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Create theme based on dark mode preference
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#9c27b0',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Simulated 2-second loading time

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Web3Provider>
        <UserProvider>
          <PensionerProvider>
            <OfflineProvider>
              <Router>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Login />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  
                  {/* Pensioner Routes */}
                  <Route 
                    path="/pensioner-dashboard" 
                    element={
                      <ProtectedRoute requiredRole={ROLES.PENSIONER}>
                        <PensionerDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/pensioner" 
                    element={
                      <ProtectedRoute requiredRole={ROLES.PENSIONER}>
                        <PensionerDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/verification-setup" 
                    element={
                      <ProtectedRoute requiredRole={ROLES.PENSIONER}>
                        <VerificationSetup />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/verification-guide" 
                    element={
                      <ProtectedRoute requiredRole={ROLES.PENSIONER}>
                        <VerificationGuide />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/contact" 
                    element={
                      <ProtectedRoute>
                        <Contact />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/verification/:pensionerId" 
                    element={
                      <ProtectedRoute requiredRole={ROLES.DOCTOR}>
                        <Verification />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Admin Routes */}
                  <Route 
                    path="/admin-dashboard" 
                    element={
                      <ProtectedRoute requiredRole={ROLES.ADMIN}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/register-pensioner" 
                    element={
                      <ProtectedRoute requiredRole={ROLES.ADMIN}>
                        <RegisterPensioner />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Doctor Routes */}
                  <Route 
                    path="/doctor-dashboard" 
                    element={
                      <ProtectedRoute requiredRole={ROLES.DOCTOR}>
                        <DoctorDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/register-death" 
                    element={
                      <ProtectedRoute requiredRole={ROLES.DOCTOR}>
                        <RegisterDeath />
                      </ProtectedRoute>
                    } 
                  />

                  {/* 404 and redirects */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
                
                {/* Theme Toggle */}
                <ThemeToggle darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
              </Router>
            </OfflineProvider>
          </PensionerProvider>
        </UserProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App; 