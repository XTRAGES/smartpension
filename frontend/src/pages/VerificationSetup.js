import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  TextField,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Divider,
  IconButton
} from '@mui/material';
import {
  VerifiedUser,
  AccountBalance,
  PhotoCamera,
  Send,
  WifiOff,
  AddPhotoAlternate,
  CameraAlt,
  DeleteOutline,
  CheckCircle
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { useWeb3 } from '../contexts/Web3Context';
import { usePensioners } from '../contexts/PensionerContext';
import { useOffline } from '../contexts/OfflineContext';
import Header from '../components/Header';
import { toast } from 'react-toastify';

// Steps in the verification process
const steps = ['Personal Information', 'Wallet Connection', 'Identity Verification', 'Submit Verification'];

// VerificationSetup Component
const VerificationSetup = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useUser();
  const { isConnected, connectWallet, account } = useWeb3();
  const { addPensioner, verifyPensioner } = usePensioners();
  const { isOnline, queueVerification } = useOffline();
  
  // Refs for accessing camera input
  const idPhotoInputRef = useRef(null);
  const facePhotoInputRef = useRef(null);
  
  // State
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    dateOfBirth: '',
    nationalId: '',
    pensionerId: '',
    walletAddress: user?.walletAddress || account || '',
    // Split photo types
    idPhoto: null,
    facePhoto: null
  });
  const [errors, setErrors] = useState({});
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
    }
  };
  
  // Validate current step
  const validateStep = () => {
    const newErrors = {};
    
    switch (activeStep) {
      case 0: // Personal Information
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.nationalId.trim()) newErrors.nationalId = 'National ID is required';
        break;
        
      case 1: // Wallet Connection
        if (!formData.walletAddress) newErrors.walletAddress = 'Wallet address is required';
        if (!isConnected && !formData.walletAddress) {
          newErrors.wallet = 'You must connect your wallet';
        }
        break;
        
      case 2: // Identity Verification
        if (!formData.idPhoto) {
          newErrors.idPhoto = 'Personal ID photo is required';
        }
        if (!formData.facePhoto) {
          newErrors.facePhoto = 'Facial photo is required';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Go to next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  // Go to previous step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      const connected = await connectWallet();
      
      if (connected) {
        setFormData(prev => ({ ...prev, walletAddress: account }));
        toast.success('Wallet connected successfully');
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      toast.error('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file selection for ID photo
  const handleIdPhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ 
          ...prev, 
          idPhoto: e.target.result
        }));
        toast.success('ID photo uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle file selection for face photo
  const handleFacePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ 
          ...prev, 
          facePhoto: e.target.result
        }));
        toast.success('Facial photo uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Trigger ID photo file dialog
  const triggerIdPhotoUpload = () => {
    idPhotoInputRef.current.click();
  };
  
  // Trigger face photo file dialog
  const triggerFacePhotoUpload = () => {
    facePhotoInputRef.current.click();
  };
  
  // Handle capturing ID photo from webcam (mock implementation)
  const captureIdPhoto = () => {
    setFormData(prev => ({ 
      ...prev, 
      idPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg=='
    }));
    toast.success('ID photo captured successfully');
  };
  
  // Handle capturing face photo from webcam (mock implementation)
  const captureFacePhoto = () => {
    setFormData(prev => ({ 
      ...prev, 
      facePhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg=='
    }));
    toast.success('Facial photo captured successfully');
  };
  
  // Reset ID photo
  const resetIdPhoto = () => {
    setFormData(prev => ({ ...prev, idPhoto: null }));
  };
  
  // Reset face photo
  const resetFacePhoto = () => {
    setFormData(prev => ({ ...prev, facePhoto: null }));
  };
  
  // Submit verification
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const verificationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        nationalId: formData.nationalId,
        walletAddress: formData.walletAddress,
        idPhoto: formData.idPhoto,
        facePhoto: formData.facePhoto,
        pensionerName: `${formData.firstName} ${formData.lastName}`,
        timestamp: new Date().getTime(),
        userId: user?.id
      };
      
      // Check if online or offline
      if (isOnline) {
        // Online submission - send to backend API
        try {
          // Create form data for submission
          const formDataToSubmit = new FormData();
          formDataToSubmit.append('firstName', formData.firstName);
          formDataToSubmit.append('lastName', formData.lastName);
          formDataToSubmit.append('dateOfBirth', formData.dateOfBirth);
          formDataToSubmit.append('nationalId', formData.nationalId);
          formDataToSubmit.append('walletAddress', formData.walletAddress);
          
          // Convert base64 images to files
          if (formData.idPhoto) {
            const idPhotoBlob = await fetch(formData.idPhoto).then(r => r.blob());
            formDataToSubmit.append('idPhoto', idPhotoBlob, 'id-photo.jpg');
          }
          
          if (formData.facePhoto) {
            const facePhotoBlob = await fetch(formData.facePhoto).then(r => r.blob());
            formDataToSubmit.append('facePhoto', facePhotoBlob, 'face-photo.jpg');
          }
          
          // Create pensioner entry (if needed)
          const pensionerAdded = await addPensioner({
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
            nationalId: formData.nationalId,
            walletAddress: formData.walletAddress,
            // Assign a mock pensioner ID
            pensionerId: '1001'
          });
          
          if (pensionerAdded) {
            // Make API call to backend to verify pensioner with photos
            const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/verify-pensioner`;
            
            const response = await fetch(apiUrl, {
              method: 'POST',
              body: formDataToSubmit,
              credentials: 'include',
            });
            
            if (response.ok) {
              toast.success('Verification submitted successfully');
              setTimeout(() => {
                navigate('/pensioner-dashboard');
              }, 2000);
            } else {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to verify pensioner');
            }
          }
        } catch (err) {
          console.error('Online submission error:', err);
          toast.error('Verification submission failed. Trying offline mode...');
          
          // If online submission fails, try to queue it for later
          const queued = await queueVerification(verificationData);
          if (queued) {
            toast.info('Verification will be submitted when connection is restored');
            setTimeout(() => {
              navigate('/pensioner-dashboard');
            }, 2000);
          }
        }
      } else {
        // Offline submission - queue for later
        const queued = await queueVerification(verificationData);
        
        if (queued) {
          toast.info('You are currently offline. Verification will be submitted when connection is restored');
          setTimeout(() => {
            navigate('/pensioner-dashboard');
          }, 2000);
        } else {
          toast.error('Failed to save verification for later submission');
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
      toast.error('Verification submission failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Content for each step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                error={!!errors.dateOfBirth}
                helperText={errors.dateOfBirth}
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="National ID"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                error={!!errors.nationalId}
                helperText={errors.nationalId}
                disabled={loading}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Connect your Ethereum wallet to receive pension payments
              </Alert>
              <TextField
                fullWidth
                label="Wallet Address"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                error={!!errors.walletAddress}
                helperText={errors.walletAddress}
                disabled={loading || isConnected}
                InputProps={{
                  readOnly: isConnected,
                }}
                sx={{ mb: 3 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleConnectWallet}
                disabled={loading || isConnected}
                startIcon={isConnected ? <VerifiedUser /> : <AccountBalance />}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isConnected ? (
                  'Wallet Connected'
                ) : (
                  'Connect MetaMask'
                )}
              </Button>
              {errors.wallet && (
                <FormHelperText error>{errors.wallet}</FormHelperText>
              )}
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                We need to verify your identity with photos. This helps prevent fraud and ensures pension payments go to the right person.
              </Alert>
              <Typography variant="subtitle1" gutterBottom>
                Please provide both:
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                1. A clear photo of your National ID card/document<br />
                2. A current photo of your face (selfie)
              </Typography>
            </Grid>
            
            {/* Hidden file inputs */}
            <input
              type="file"
              ref={idPhotoInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleIdPhotoUpload}
            />
            <input
              type="file"
              ref={facePhotoInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFacePhotoUpload}
            />
            
            {/* ID Photo Section */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    1. ID Document Photo
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Your national ID, passport, or driver's license
                  </Typography>
                  
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 200, 
                      bgcolor: 'grey.100', 
                      border: '1px dashed grey.500',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {formData.idPhoto ? (
                      <>
                        <Box
                          component="img"
                          src={formData.idPhoto}
                          alt="ID Document"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                        <IconButton
                          color="error"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'rgba(255,255,255,0.7)'
                          }}
                          onClick={resetIdPhoto}
                        >
                          <DeleteOutline />
                        </IconButton>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            bgcolor: 'success.main',
                            color: 'white',
                            borderRadius: 5,
                            display: 'flex',
                            alignItems: 'center',
                            px: 1,
                            py: 0.5
                          }}
                        >
                          <CheckCircle fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="caption">Uploaded</Typography>
                        </Box>
                      </>
                    ) : (
                      <AddPhotoAlternate color="disabled" sx={{ fontSize: 64 }} />
                    )}
                  </Box>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={triggerIdPhotoUpload}
                        disabled={loading}
                        startIcon={<AddPhotoAlternate />}
                        color="primary"
                      >
                        Upload
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={captureIdPhoto}
                        disabled={loading}
                        startIcon={<CameraAlt />}
                        color="secondary"
                      >
                        Capture
                      </Button>
                    </Grid>
                  </Grid>
                  
                  {errors.idPhoto && (
                    <FormHelperText error sx={{ mt: 1, textAlign: 'center' }}>
                      {errors.idPhoto}
                    </FormHelperText>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Face Photo Section */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    2. Face Photo (Selfie)
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    A clear photo of your face, looking directly at the camera
                  </Typography>
                  
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 200, 
                      bgcolor: 'grey.100', 
                      border: '1px dashed grey.500',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {formData.facePhoto ? (
                      <>
                        <Box
                          component="img"
                          src={formData.facePhoto}
                          alt="Face Photo"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                        <IconButton
                          color="error"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'rgba(255,255,255,0.7)'
                          }}
                          onClick={resetFacePhoto}
                        >
                          <DeleteOutline />
                        </IconButton>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            bgcolor: 'success.main',
                            color: 'white',
                            borderRadius: 5,
                            display: 'flex',
                            alignItems: 'center',
                            px: 1,
                            py: 0.5
                          }}
                        >
                          <CheckCircle fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="caption">Uploaded</Typography>
                        </Box>
                      </>
                    ) : (
                      <PhotoCamera color="disabled" sx={{ fontSize: 64 }} />
                    )}
                  </Box>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={triggerFacePhotoUpload}
                        disabled={loading}
                        startIcon={<AddPhotoAlternate />}
                        color="primary"
                      >
                        Upload
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={captureFacePhoto}
                        disabled={loading}
                        startIcon={<CameraAlt />}
                        color="secondary"
                      >
                        Capture
                      </Button>
                    </Grid>
                  </Grid>
                  
                  {errors.facePhoto && (
                    <FormHelperText error sx={{ mt: 1, textAlign: 'center' }}>
                      {errors.facePhoto}
                    </FormHelperText>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Important:
                </Typography>
                <Typography variant="body2">
                  • Your face must be clearly visible<br />
                  • The ID photo must be legible<br />
                  • These photos will be used for identity verification every 180 days<br />
                  • Verification will compare your face to ensure you are still actively using the pension
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review and Submit Verification
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Personal Information</Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {formData.firstName} {formData.lastName}
                </Typography>
                <Typography variant="body2">
                  <strong>Date of Birth:</strong> {formData.dateOfBirth}
                </Typography>
                <Typography variant="body2">
                  <strong>National ID:</strong> {formData.nationalId}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Wallet Information</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  <strong>Wallet Address:</strong> {formData.walletAddress}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1">Identity Photos</Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>ID Document</strong>
                      </Typography>
                      {formData.idPhoto ? (
                        <Box
                          component="img"
                          src={formData.idPhoto}
                          alt="ID Document"
                          sx={{
                            width: '100%', 
                            maxHeight: 120,
                            objectFit: 'contain',
                            border: '1px solid #ddd',
                            borderRadius: 1
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="error">
                          No ID photo provided
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Face Photo</strong>
                      </Typography>
                      {formData.facePhoto ? (
                        <Box
                          component="img"
                          src={formData.facePhoto}
                          alt="Face Photo"
                          sx={{
                            width: '100%', 
                            maxHeight: 120,
                            objectFit: 'contain',
                            border: '1px solid #ddd',
                            borderRadius: 1
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="error">
                          No face photo provided
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
              
              {!isOnline && (
                <Grid item xs={12}>
                  <Alert 
                    severity="warning" 
                    icon={<WifiOff />}
                    sx={{ mt: 2 }}
                  >
                    You are currently offline. Your verification will be queued and submitted automatically when your connection is restored.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <>
      <Header onLogout={handleLogout} title="Verification Setup" />
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Paper sx={{ p: { xs: 2, md: 4 }, boxShadow: 3, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="medium">
            Pension Verification Process
          </Typography>
          
          <Box sx={{ width: '100%', mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          
          <Box sx={{ mt: 4, mb: 4 }}>
            {getStepContent(activeStep)}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {loading ? 'Processing...' : activeStep === steps.length - 1 ? 'Submit Verification' : 'Next Step'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default VerificationSetup; 