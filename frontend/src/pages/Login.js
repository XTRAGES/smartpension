import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent,
  CircularProgress,
  Grid,
  Divider,
  Paper,
  Tabs,
  Tab,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Alert,
} from '@mui/material';
import { 
  AccountBalanceWallet, 
  Security, 
  VerifiedUser,
  LocalHospital,
  Person,
  Email,
  Lock,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { useUser, ROLES } from '../contexts/UserContext';
import { keyframes } from '@emotion/react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Define animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Login = () => {
  const navigate = useNavigate();
  const { connectWallet, isConnected, account, isCorrectNetwork, switchNetwork } = useWeb3();
  const { login, isAuthenticated, role, loginWithCredentials } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loginMethod, setLoginMethod] = useState('traditional'); // 'traditional' or 'metamask'
  
  // Form state for traditional login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Handle tab change
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setError('');
  };
  
  // Handle login method toggle
  const handleLoginMethodChange = (method) => {
    setLoginMethod(method);
    setError('');
  };
  
  // Handle traditional login
  const handleTraditionalLogin = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError('');
    setPasswordError('');
    setError('');
    
    // Validate form
    let isValid = true;
    
    // Email validation with better regex pattern
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    
    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }
    
    if (!isValid) return;
    
    try {
      setLoading(true);
      
      // Determine user role based on active tab
      const userRole = activeTab === 0 ? ROLES.PENSIONER : 
                      activeTab === 1 ? ROLES.DOCTOR : ROLES.ADMIN;
      
      // Direct API call to backend
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
        role: userRole
      }, {
        withCredentials: true // Important for cookie-based sessions
      });
      
      if (response.data.success) {
        // Update user context with the user data from response
        const loginSuccess = await loginWithCredentials(
          email, 
          password, 
          userRole,
          response.data.user
        );
        
        if (loginSuccess) {
          toast.success('Login successful!');
          
          // Save to localStorage if remember me is checked
          if (rememberMe) {
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('authMethod', 'traditional');
          }
          
          // Redirect based on role
          switch (userRole) {
            case ROLES.PENSIONER:
              navigate('/pensioner-dashboard');
              break;
            case ROLES.DOCTOR:
              navigate('/doctor-dashboard');
              break;
            case ROLES.ADMIN:
              navigate('/admin-dashboard');
              break;
            default:
              navigate('/');
          }
        } else {
          setError('Failed to update user session. Please try again.');
        }
      } else {
        setError(response.data.message || 'Login failed. Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(error.response.data.message || 'Invalid email or password. Please check your credentials and try again.');
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(error.message || 'An error occurred during login. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle MetaMask login button click
  const handleMetaMaskLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }
      
      // First, connect the wallet if not connected
      if (!isConnected) {
        const connected = await connectWallet();
        if (!connected) {
          setError('Failed to connect wallet. Please make sure MetaMask is unlocked and try again.');
          return;
        }
      }
      
      // Check if we're on the correct network
      if (!isCorrectNetwork) {
        setError('You are on the wrong network. Attempting to switch to the correct network...');
        
        // Try to switch to the correct network
        const switched = await switchNetwork();
        if (!switched) {
          setError('Failed to switch to the correct network. Please switch manually in MetaMask.');
          return;
        }
        
        // If we successfully switched networks, we need to reconnect
        const reconnected = await connectWallet();
        if (!reconnected) {
          setError('Failed to reconnect after switching networks. Please try again.');
          return;
        }
      }
      
      // Send login request with wallet address
      try {
        const response = await axios.post(`${API_URL}/login`, {
          walletAddress: account
        }, {
          withCredentials: true // For sessions
        });
        
        if (response.data.success) {
          // Call context login method with user data
          const success = await login(response.data.user);
          
          if (success) {
            toast.success('Login successful!');
            
            // Save wallet address to localStorage
            localStorage.setItem('userAddress', account);
            localStorage.setItem('userRole', response.data.user.role);
            localStorage.setItem('authMethod', 'metamask');
            
            // Navigate based on role
            switch (response.data.user.role) {
              case ROLES.PENSIONER:
                navigate('/pensioner-dashboard');
                break;
              case ROLES.DOCTOR:
                navigate('/doctor-dashboard');
                break;
              case ROLES.ADMIN:
                navigate('/admin-dashboard');
                break;
              default:
                navigate('/');
            }
          } else {
            setError('Failed to update user session. Please try again.');
          }
        } else {
          setError(response.data.message || 'Login failed with MetaMask.');
        }
      } catch (error) {
        console.error('MetaMask login error:', error);
        
        if (error.response) {
          setError(error.response.data.message || 'Login failed. Your wallet address might not be registered.');
        } else if (error.request) {
          setError('No response from server. Please check your internet connection.');
        } else {
          setError(error.message || 'An error occurred during login with MetaMask.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Navigate based on user role when authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      switch (role) {
        case ROLES.PENSIONER:
          navigate('/pensioner-dashboard');
          break;
        case ROLES.ADMIN:
          navigate('/admin-dashboard');
          break;
        case ROLES.DOCTOR:
          navigate('/doctor-dashboard');
          break;
        default:
          break;
      }
    }
    
    // Load saved email if available (for "remember me" feature)
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    
  }, [isAuthenticated, role, navigate]);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 2,
        bgcolor: 'background.default',
        animation: `${fadeIn} 0.5s ease-in-out`,
      }}
    >
      <Card
        sx={{
          width: { xs: '95%', sm: '80%', md: '60%', lg: '50%' },
          maxWidth: '800px',
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 8px 40px rgba(0, 0, 0, 0.5)' 
            : '0 8px 40px rgba(0, 0, 0, 0.1)',
          borderRadius: 4,
          overflow: 'hidden',
          animation: `${slideUp} 0.7s ease-out`,
        }}
      >
        <Grid container>
          {/* Left panel with app info and features */}
          <Grid 
            item 
            xs={12} 
            md={5} 
            sx={{ 
              bgcolor: 'primary.main',
              color: 'white',
              p: 4,
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                fontFamily: 'Montserrat, sans-serif',
                mb: 3,
              }}
            >
              Smart Pension
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              Secure pension verification using blockchain and facial recognition technology.
            </Typography>
            
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Security sx={{ mr: 2 }} />
              <Typography variant="body2">Blockchain-secured verification</Typography>
            </Box>
            
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <VerifiedUser sx={{ mr: 2 }} />
              <Typography variant="body2">Prevent pension fraud</Typography>
            </Box>
            
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <LocalHospital sx={{ mr: 2 }} />
              <Typography variant="body2">Digital death registration</Typography>
            </Box>
          </Grid>
          
          {/* Right panel with login form */}
          <Grid item xs={12} md={7}>
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h5" 
                component="h2" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  textAlign: 'center',
                  mb: 3,
                }}
              >
                Login to Your Account
              </Typography>
              
              <Paper sx={{ mb: 4 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab icon={<Person />} label="Pensioner" />
                  <Tab icon={<LocalHospital />} label="Doctor" />
                  <Tab icon={<VerifiedUser />} label="Admin" />
                </Tabs>
              </Paper>
              
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                {activeTab === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Pensioners can verify identity and check pension status.
                  </Typography>
                )}
                
                {activeTab === 1 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Doctors can register deaths and update pensioner status.
                  </Typography>
                )}
                
                {activeTab === 2 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Administrators can register pensioners and manage the system.
                  </Typography>
                )}
              </Box>

              {/* Login method selector */}
              <Box sx={{ display: 'flex', mb: 3, justifyContent: 'center' }}>
                <Button 
                  variant={loginMethod === 'traditional' ? 'contained' : 'outlined'}
                  size="small"
                  sx={{ mr: 1 }}
                  onClick={() => handleLoginMethodChange('traditional')}
                >
                  Email & Password
                </Button>
                <Button 
                  variant={loginMethod === 'metamask' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => handleLoginMethodChange('metamask')}
                >
                  MetaMask Wallet
                </Button>
              </Box>
              
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Traditional login form */}
                {loginMethod === 'traditional' && (
                  <Box component="form" onSubmit={handleTraditionalLogin} sx={{ width: '100%', mb: 2 }}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={!!emailError}
                      helperText={emailError}
                      InputProps={{
                        startAdornment: <Email color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      margin="normal"
                      name="password"
                      label="Password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={!!passwordError}
                      helperText={passwordError}
                      InputProps={{
                        startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            value="remember" 
                            color="primary"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                        }
                        label="Remember me"
                      />
                      <Link href="#" variant="body2">
                        Forgot password?
                      </Link>
                    </Box>
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{ 
                        py: 1.5, 
                        fontSize: '1rem',
                      }}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                          Signing in...
                        </>
                      ) : 'Sign In'}
                    </Button>
                    
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography variant="body2">
                        Don't have an account?{' '}
                        <Link component={RouterLink} to="/signup" variant="body2">
                          Sign Up
                        </Link>
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {/* MetaMask login */}
                {loginMethod === 'metamask' && (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AccountBalanceWallet />}
                    onClick={handleMetaMaskLogin}
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      px: 4,
                      mb: 2,
                      fontSize: '1rem',
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                        Connecting...
                      </>
                    ) : (
                      <>Connect with MetaMask</>
                    )}
                  </Button>
                )}
                
                {error && (
                  <Typography 
                    variant="body2" 
                    color="error" 
                    sx={{ mt: 2, textAlign: 'center' }}
                  >
                    {error}
                  </Typography>
                )}
                
                {loginMethod === 'metamask' && account && (
                  <Typography 
                    variant="body2" 
                    sx={{ mt: 2, wordBreak: 'break-all', textAlign: 'center' }}
                  >
                    Connected: {account}
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                Need help setting up? See our <a href="https://github.com/yourusername/smart-pension/blob/main/SETUP-METAMASK.md" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 'bold' }}>
                  MetaMask Setup Guide
                </a>
              </Typography>
            </CardContent>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default Login; 