import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Avatar,
  Link,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Person,
  LockOutlined,
  Visibility,
  VisibilityOff,
  ArrowBack,
  ArrowForward,
  CameraAlt,
  Check,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { useUser, ROLES } from '../contexts/UserContext';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Stepper steps
const steps = ['Personal Details', 'Account Setup', 'Review & Submit'];

const Signup = () => {
  const navigate = useNavigate();
  const { connectWallet, account, isConnected } = useWeb3();
  const { register, loading: userLoading } = useUser();
  
  // State for stepper
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    nationalId: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    password: '',
    confirmPassword: '',
    walletAddress: '',
    useMetaMask: false,
    agreeToTerms: false,
    role: ROLES.PENSIONER // Default role
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({});
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    // Clear error when field is changed
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  // Generate random wallet address
  const generateWalletAddress = () => {
    const randomWallet = ethers.Wallet.createRandom();
    setFormData({
      ...formData,
      walletAddress: randomWallet.address,
    });
  };
  
  // Validate form data for current step
  const validateStep = () => {
    let errors = {};
    let isValid = true;
    
    switch (activeStep) {
      case 0: // Personal Details
        if (!formData.firstName.trim()) {
          errors.firstName = 'First name is required';
          isValid = false;
        }
        
        if (!formData.lastName.trim()) {
          errors.lastName = 'Last name is required';
          isValid = false;
        }
        
        if (!formData.dateOfBirth) {
          errors.dateOfBirth = 'Date of birth is required';
          isValid = false;
        } else if (formData.role === ROLES.PENSIONER) {
          const birthDate = new Date(formData.dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          
          // Check the month and day to account for birthdays that haven't occurred yet this year
          if (
            today.getMonth() < birthDate.getMonth() || 
            (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
          
          if (age < 60) {
            errors.dateOfBirth = 'You must be at least 60 years old to register as a pensioner';
            isValid = false;
          }
        }
        
        if (!formData.email.trim()) {
          errors.email = 'Email is required';
          isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          errors.email = 'Email is invalid';
          isValid = false;
        }
        
        if (!formData.phone.trim()) {
          errors.phone = 'Phone number is required';
          isValid = false;
        }
        
        break;
        
      case 1: // Account Setup
        if (formData.useMetaMask) {
          if (!isConnected || !account) {
            errors.metamask = 'Please connect your MetaMask wallet';
            isValid = false;
          }
        } else {
          if (!formData.walletAddress) {
            errors.walletAddress = 'Wallet address is required';
            isValid = false;
          } else if (!ethers.utils.isAddress(formData.walletAddress)) {
            errors.walletAddress = 'Invalid Ethereum wallet address';
            isValid = false;
          }
          
          if (!formData.password) {
            errors.password = 'Password is required';
            isValid = false;
          } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
            isValid = false;
          } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
            isValid = false;
          }
          
          if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
            isValid = false;
          } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
            isValid = false;
          }
        }
        
        break;
        
      case 2: // Review & Submit
        if (!formData.agreeToTerms) {
          errors.agreeToTerms = 'You must agree to the terms and conditions';
          isValid = false;
        }
        break;
      
      default:
        break;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Create user data object
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        password: formData.useMetaMask ? null : formData.password,
        walletAddress: formData.useMetaMask ? account : formData.walletAddress,
        role: formData.role
      };
      
      // Call register function from UserContext
      const result = await register(userData);
      
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }
      
      toast.success('Registration successful! Please log in.');
      navigate('/login');
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration');
      toast.error(`Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Get content for the current step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Personal Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  label="First Name"
                  fullWidth
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  label="Last Name"
                  fullWidth
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email Address"
                  fullWidth
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="phone"
                  label="Phone Number"
                  fullWidth
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  error={!!formErrors.dateOfBirth}
                  helperText={formErrors.dateOfBirth}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="address"
                  label="Address"
                  fullWidth
                  value={formData.address}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="city"
                  label="City"
                  fullWidth
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="postalCode"
                  label="Postal Code"
                  fullWidth
                  value={formData.postalCode}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="country"
                  label="Country"
                  fullWidth
                  value={formData.country}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Account Setup
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="useMetaMask"
                      checked={formData.useMetaMask}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="Connect with MetaMask"
                />
              </Grid>
              
              {formData.useMetaMask ? (
                <Grid item xs={12}>
                  {isConnected ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Check color="success" sx={{ mr: 1 }} />
                      <Typography>Connected: {account}</Typography>
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AccountBalanceWallet />}
                      onClick={connectWallet}
                      sx={{ mb: 2 }}
                    >
                      Connect Wallet
                    </Button>
                  )}
                  
                  {formErrors.metamask && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {formErrors.metamask}
                    </Alert>
                  )}
                </Grid>
              ) : (
                <>
                  <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      name="walletAddress"
                      label="Ethereum Wallet Address"
                      fullWidth
                      value={formData.walletAddress}
                      onChange={handleChange}
                      error={!!formErrors.walletAddress}
                      helperText={formErrors.walletAddress}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      variant="outlined"
                      sx={{ ml: 1, whiteSpace: 'nowrap' }}
                      onClick={generateWalletAddress}
                    >
                      Generate
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      value={formData.password}
                      onChange={handleChange}
                      error={!!formErrors.password}
                      helperText={formErrors.password}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={togglePasswordVisibility} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      name="confirmPassword"
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      fullWidth
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={!!formErrors.confirmPassword}
                      helperText={formErrors.confirmPassword}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Information
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Name</Typography>
                  <Typography>{`${formData.firstName} ${formData.lastName}`}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography>{formData.email}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Date of Birth</Typography>
                  <Typography>{formData.dateOfBirth}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography>{formData.phone || 'Not provided'}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Address</Typography>
                  <Typography>
                    {formData.address ? 
                      `${formData.address}, ${formData.city || ''} ${formData.postalCode || ''}, ${formData.country || ''}` :
                      'Not provided'
                    }
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Wallet Address</Typography>
                  <Typography>{formData.useMetaMask ? account : formData.walletAddress}</Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="I agree to the terms and conditions"
            />
            
            {formErrors.agreeToTerms && (
              <Typography color="error" variant="body2">
                {formErrors.agreeToTerms}
              </Typography>
            )}
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };
  
  // Handle component unmounting
  useEffect(() => {
    return () => {
      // Clean up any resources if needed
    };
  }, []);
  
  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={6} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlined />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {activeStep === steps.length ? (
          <>
            <Typography variant="h5" gutterBottom>
              Registration Complete
            </Typography>
            <Typography variant="subtitle1">
              Your account has been created. You can now log in.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/login')}
                sx={{ mt: 3, ml: 1 }}
              >
                Go to Login
              </Button>
            </Box>
          </>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box>{getStepContent(activeStep)}</Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
                startIcon={<ArrowBack />}
              >
                Back
              </Button>
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={loading || userLoading}
                    startIcon={loading || userLoading ? <CircularProgress size={20} /> : null}
                  >
                    {loading || userLoading ? 'Submitting...' : 'Submit'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    endIcon={<ArrowForward />}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </>
        )}
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" variant="body2">
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Signup;