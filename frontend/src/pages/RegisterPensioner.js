import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Snackbar,
} from '@mui/material';
import {
  Person,
  AccountBalance,
  Assignment,
  Check,
  ArrowBack,
  ArrowForward,
  CameraAlt,
  ContentCopy,
  Save,
  Info,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { useUser } from '../contexts/UserContext';
import { usePensioners } from '../contexts/PensionerContext';
import { ethers } from 'ethers';
import Header from '../components/Header';

// Mock function to simulate blockchain transaction
const mockBlockchainRegister = async (data) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 90% success rate for demo
  if (Math.random() < 0.9) {
    return {
      success: true,
      txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      blockNumber: Math.floor(Math.random() * 1000000),
    };
  } else {
    throw new Error('Transaction failed. The network might be congested. Please try again.');
  }
};

const RegisterPensioner = () => {
  const navigate = useNavigate();
  const { account, connectWallet, isConnected, sendTransaction, contract } = useWeb3();
  const { logout } = useUser();
  const { addPensioner, loading: pensionerLoading } = usePensioners();
  
  // Steps for the registration process
  const steps = ['Personal Information', 'Payment Details', 'Verification', 'Confirmation'];
  
  // State
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationalId: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    email: '',
    phone: '',
    walletAddress: '',
    pensionAmount: '',
    startDate: '',
    paymentFrequency: 'monthly',
    additionalNotes: '',
    termsAccepted: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    // Clear error for the field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  // Generate random wallet address
  const generateWalletAddress = () => {
    const randomWallet = ethers.Wallet.createRandom();
    setFormData({
      ...formData,
      walletAddress: randomWallet.address,
    });
  };
  
  // Copy wallet address to clipboard
  const copyWalletAddress = () => {
    if (formData.walletAddress) {
      navigator.clipboard.writeText(formData.walletAddress);
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
      
      setSnackbarMessage('Wallet address copied to clipboard');
      setSnackbarOpen(true);
    }
  };
  
  // Validate form data for each step
  const validateStep = () => {
    let errors = {};
    let isValid = true;
    
    switch (activeStep) {
      case 0: // Personal Information
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
        } else {
          const birthDate = new Date(formData.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          
          if (age < 60) {
            errors.dateOfBirth = 'Pensioner must be at least 60 years old';
            isValid = false;
          }
        }
        
        if (!formData.nationalId.trim()) {
          errors.nationalId = 'National ID is required';
          isValid = false;
        }
        
        break;
        
      case 1: // Payment Details
        if (!formData.walletAddress.trim()) {
          errors.walletAddress = 'Wallet address is required';
          isValid = false;
        } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress)) {
          errors.walletAddress = 'Invalid Ethereum wallet address';
          isValid = false;
        }
        
        if (!formData.pensionAmount.trim()) {
          errors.pensionAmount = 'Pension amount is required';
          isValid = false;
        } else if (isNaN(formData.pensionAmount) || parseFloat(formData.pensionAmount) <= 0) {
          errors.pensionAmount = 'Pension amount must be a positive number';
          isValid = false;
        }
        
        if (!formData.startDate) {
          errors.startDate = 'Start date is required';
          isValid = false;
        } else {
          const startDate = new Date(formData.startDate);
          const today = new Date();
          
          if (startDate < today) {
            errors.startDate = 'Start date cannot be in the past';
            isValid = false;
          }
        }
        
        break;
        
      case 2: // Verification
        if (!formData.termsAccepted) {
          errors.termsAccepted = 'You must accept the terms and conditions';
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
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.walletAddress || !formData.pensionAmount || !formData.startDate) {
        setError('Please fill all required fields');
        setLoading(false);
        return;
      }
      
      if (!isConnected || !contract) {
        setError('Blockchain connection not available. Please connect your wallet.');
        setLoading(false);
        return;
      }
      
      // Format data for the smart contract
      const pensionerName = `${formData.firstName} ${formData.lastName}`;
      const pensionAmountWei = ethers.utils.parseEther(formData.pensionAmount.toString());
      const startDateSeconds = Math.floor(new Date(formData.startDate).getTime() / 1000);
      
      // Call smart contract to register pensioner
      const tx = await contract.registerPensioner(
        formData.walletAddress,
        pensionerName,
        pensionAmountWei,
        startDateSeconds
      );
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Add to local context after blockchain confirmation
      const pensionerData = {
        name: pensionerName,
        wallet: formData.walletAddress,
        pensionAmount: formData.pensionAmount,
        startDate: formData.startDate,
        lastVerificationDate: new Date().toISOString(),
        isActive: true,
        isDeceased: false
      };
      
      await addPensioner(pensionerData);
      
      // Show success message
      setSuccess(true);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationalId: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        email: '',
        phone: '',
        walletAddress: '',
        pensionAmount: '',
        startDate: '',
        paymentFrequency: 'monthly',
        additionalNotes: '',
        termsAccepted: false,
      });
      setActiveStep(0);
    } catch (err) {
      console.error('Error registering pensioner:', err);
      setError(`Failed to register pensioner: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize with a random wallet address
  useEffect(() => {
    generateWalletAddress();
    
    // Set today as the default start date
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setFormData(prevData => ({
      ...prevData,
      startDate: formattedDate,
    }));
  }, []);
  
  // Handle dialog close and navigation
  const handleDialogClose = () => {
    setConfirmDialogOpen(false);
    navigate('/admin-dashboard');
  };
  
  // Get form content based on active step
  const getStepContent = () => {
    switch (activeStep) {
      case 0: // Personal Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!formErrors.dateOfBirth}
                helperText={formErrors.dateOfBirth}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="National ID"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                error={!!formErrors.nationalId}
                helperText={formErrors.nationalId}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
        
      case 1: // Payment Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Wallet Address"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={copyWalletAddress} edge="end">
                        {walletCopied ? <Check /> : <ContentCopy />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  readOnly: true,
                }}
                error={!!formErrors.walletAddress}
                helperText={formErrors.walletAddress}
                required
              />
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  onClick={generateWalletAddress}
                  startIcon={<AccountBalance />}
                >
                  Generate New Address
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pension Amount (ETH)"
                name="pensionAmount"
                type="number"
                value={formData.pensionAmount}
                onChange={handleChange}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                }}
                error={!!formErrors.pensionAmount}
                helperText={formErrors.pensionAmount}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!formErrors.startDate}
                helperText={formErrors.startDate}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                name="additionalNotes"
                multiline
                rows={4}
                value={formData.additionalNotes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
        
      case 2: // Verification
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please review the pensioner information before proceeding.
              </Alert>
              
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Full Name</Typography>
                    <Typography variant="body1">{`${formData.firstName} ${formData.lastName}`}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Date of Birth</Typography>
                    <Typography variant="body1">{formData.dateOfBirth}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">National ID</Typography>
                    <Typography variant="body1">{formData.nationalId}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Contact</Typography>
                    <Typography variant="body1">{formData.email || 'Not provided'}</Typography>
                    <Typography variant="body1">{formData.phone || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Address</Typography>
                    <Typography variant="body1">
                      {formData.address ? `${formData.address}, ` : ''}
                      {formData.city ? `${formData.city}, ` : ''}
                      {formData.postalCode ? `${formData.postalCode}, ` : ''}
                      {formData.country || ''}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Payment Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Wallet Address</Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{formData.walletAddress}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Pension Amount</Typography>
                    <Typography variant="body1">{formData.pensionAmount} ETH</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Start Date</Typography>
                    <Typography variant="body1">{formData.startDate}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Additional Notes</Typography>
                    <Typography variant="body1">{formData.additionalNotes || 'None'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              <Box sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      name="termsAccepted"
                      color="primary"
                    />
                  }
                  label="I confirm that all information provided is accurate and complete"
                />
                {formErrors.termsAccepted && (
                  <FormHelperText error>{formErrors.termsAccepted}</FormHelperText>
                )}
              </Box>
            </Grid>
          </Grid>
        );
        
      case 3: // Confirmation
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Check sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                All Ready to Register!
              </Typography>
              <Typography variant="body1" paragraph>
                Click the "Complete Registration" button to finalize the pension registration.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                This will create a blockchain transaction to register the pensioner.
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                onClick={handleSubmit}
                disabled={loading || pensionerLoading}
                sx={{ py: 1.5, px: 4 }}
              >
                {loading || pensionerLoading ? 'Processing...' : 'Complete Registration'}
              </Button>
            </Grid>
          </Grid>
        );
        
      default:
        return null;
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <>
      <Header title="Register New Pensioner" onLogout={handleLogout} showBackButton backTo="/admin-dashboard" />
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 8, py: 2 }}>
        <Paper sx={{ px: 4, py: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Check sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Registration Successful!
              </Typography>
              <Typography variant="body1" paragraph>
                The pensioner has been successfully registered.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/admin-dashboard')}
                sx={{ mt: 2 }}
              >
                Back to Dashboard
              </Button>
            </Box>
          ) : (
            <>
              {getStepContent()}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={activeStep === 0 ? () => navigate('/admin-dashboard') : handleBack}
                  startIcon={<ArrowBack />}
                  disabled={loading}
                >
                  {activeStep === 0 ? 'Cancel' : 'Back'}
                </Button>
                <Button
                  variant="contained"
                  onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                  endIcon={activeStep === steps.length - 1 ? null : <ArrowForward />}
                  disabled={loading}
                >
                  {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
        
        {/* Information card */}
        <Paper sx={{ p: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Info sx={{ mr: 2, mt: 0.5 }} />
            <Box>
              <Typography variant="body2" paragraph>
                Pensioners are required to verify their identity using facial recognition every 6 months to continue receiving payments.
              </Typography>
              <Typography variant="body2">
                Please ensure all information is accurate and the wallet address is correct as it will be used for all pension payments.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Pensioner Registered Successfully</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The pensioner "{formData.firstName} {formData.lastName}" has been successfully registered in the system.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary" autoFocus>
            Back to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};

export default RegisterPensioner; 