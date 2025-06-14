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
  AlertTitle,
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Search,
  PersonOff,
  ArrowBack,
  ArrowForward,
  Save,
  Upload,
  InsertDriveFile,
  LocalHospital,
  CalendarToday,
  Assignment,
  Check,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { useUser } from '../contexts/UserContext';
import { format } from 'date-fns';
import Header from '../components/Header';

// Mock function to simulate blockchain transaction
const mockBlockchainRegisterDeath = async (data) => {
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

// Mock data for pensioners
const getMockPensioners = () => {
  return [
    { id: 1, name: "John Smith", wallet: "0x1234...5678", lastVerification: "2023-01-15" },
    { id: 2, name: "Mary Johnson", wallet: "0x2345...6789", lastVerification: "2023-03-22" },
    { id: 3, name: "Robert Williams", wallet: "0x3456...7890", lastVerification: "2023-02-10" },
    { id: 4, name: "Susan Brown", wallet: "0x4567...8901", lastVerification: "2023-05-05" },
    { id: 5, name: "Michael Davis", wallet: "0x5678...9012", lastVerification: "2023-04-18" }
  ];
};

// Steps for the death registration process
const steps = ['Select Pensioner', 'Death Details', 'Upload Documents', 'Confirmation'];

const RegisterDeath = () => {
  const navigate = useNavigate();
  const { reportDeath } = useWeb3();
  const { logout } = useUser();
  
  // State
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pensioners, setPensioners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentFileName, setDocumentFileName] = useState('');
  
  const [formData, setFormData] = useState({
    pensionerId: '',
    pensionerName: '',
    wallet: '',
    dateOfDeath: '',
    causeOfDeath: '',
    deathCertificateNumber: '',
    comments: '',
    documentUploaded: false,
    termsAccepted: false,
  });
  const [formErrors, setFormErrors] = useState({});

  // Load mock pensioners data
  useEffect(() => {
    const loadPensioners = async () => {
      // In a real app, this would fetch from the blockchain
      const mockData = getMockPensioners();
      setPensioners(mockData);
      
      if (searchTerm) {
        handleSearch();
      }
    };
    
    loadPensioners();
  }, []);
  
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
  
  // Search for pensioners
  const handleSearch = () => {
    setSearchLoading(true);
    
    setTimeout(() => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
      } else {
        const term = searchTerm.toLowerCase();
        const results = pensioners.filter(
          pensioner =>
            pensioner.name.toLowerCase().includes(term) ||
            pensioner.id.toString().includes(term) ||
            pensioner.wallet.toLowerCase().includes(term)
        );
        setSearchResults(results);
      }
      setSearchLoading(false);
    }, 500); // Simulate API delay
  };

  // Select a pensioner
  const selectPensioner = (pensioner) => {
    setFormData({
      ...formData,
      pensionerId: pensioner.id,
      pensionerName: pensioner.name,
      wallet: pensioner.wallet,
    });
    setSearchTerm('');
    setSearchResults([]);
  };
  
  // Handle document upload
  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedDocument(file);
      setDocumentFileName(file.name);
      setFormData({
        ...formData,
        documentUploaded: true,
      });
      
      setSnackbarMessage('Document uploaded successfully');
      setSnackbarOpen(true);
    }
  };
  
  // Validate form data for each step
  const validateStep = () => {
    let errors = {};
    let isValid = true;
    
    switch (activeStep) {
      case 0: // Select Pensioner
        if (!formData.pensionerId) {
          errors.pensionerId = 'Please select a pensioner';
          isValid = false;
        }
        break;
        
      case 1: // Death Details
        if (!formData.dateOfDeath) {
          errors.dateOfDeath = 'Date of death is required';
          isValid = false;
        } else {
          // Validate date cannot be in the future
          const deathDate = new Date(formData.dateOfDeath);
          const today = new Date();
          if (deathDate > today) {
            errors.dateOfDeath = 'Date of death cannot be in the future';
            isValid = false;
          }
        }
        
        if (!formData.causeOfDeath.trim()) {
          errors.causeOfDeath = 'Cause of death is required';
          isValid = false;
        }
        
        if (!formData.deathCertificateNumber.trim()) {
          errors.deathCertificateNumber = 'Death certificate number is required';
          isValid = false;
        }
        break;
        
      case 2: // Upload Documents
        if (!formData.documentUploaded) {
          errors.documentUploaded = 'Please upload the death certificate';
          isValid = false;
        }
        
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
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Handle submit
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      // In a real app, we would send the data to the blockchain
      // Also upload the document to IPFS or a secure storage
      const result = await mockBlockchainRegisterDeath({
        pensionerId: formData.pensionerId,
        wallet: formData.wallet,
        dateOfDeath: formData.dateOfDeath
      });
      
      setSuccess(true);
      setConfirmDialogOpen(true);
    } catch (err) {
      console.error('Error registering death:', err);
      setError(err.message || 'An error occurred while registering the death');
    } finally {
      setLoading(false);
    }
  };
  
  // Get form content based on active step
  const getStepContent = () => {
    switch (activeStep) {
      case 0: // Select Pensioner
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body1" paragraph>
                Search for a pensioner by name, ID, or wallet address.
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TextField
                  fullWidth
                  label="Search Pensioners"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ mr: 2 }}
                  InputProps={{
                    endAdornment: searchLoading ? (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    ) : null,
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={handleSearch}
                  disabled={searchLoading || !searchTerm.trim()}
                >
                  Search
                </Button>
              </Box>
              
              {formErrors.pensionerId && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {formErrors.pensionerId}
                </Alert>
              )}
              
              {searchResults.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Search Results ({searchResults.length})
                  </Typography>
                  <List>
                    {searchResults.map((pensioner) => (
                      <Paper 
                        key={pensioner.id} 
                        sx={{ 
                          mb: 1,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: 3,
                          },
                        }}
                      >
                        <ListItem
                          button
                          onClick={() => selectPensioner(pensioner)}
                          selected={formData.pensionerId === pensioner.id}
                          sx={{ 
                            borderLeft: formData.pensionerId === pensioner.id ? 4 : 0,
                            borderColor: 'primary.main'
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {formData.pensionerId === pensioner.id && <Check />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={pensioner.name}
                            secondary={`ID: ${pensioner.id} | Wallet: ${pensioner.wallet}`}
                          />
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                </Box>
              )}

              {formData.pensionerName && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Selected Pensioner:
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {formData.pensionerName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        ID: {formData.pensionerId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Wallet: {formData.wallet}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Grid>
          </Grid>
        );
        
      case 1: // Death Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Medical Professional Responsibility</AlertTitle>
                As a medical professional, you are legally responsible for the accuracy of this information. All submissions are permanently recorded on the blockchain.
              </Alert>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Death"
                name="dateOfDeath"
                type="date"
                value={formData.dateOfDeath}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!formErrors.dateOfDeath}
                helperText={formErrors.dateOfDeath}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Death Certificate Number"
                name="deathCertificateNumber"
                value={formData.deathCertificateNumber}
                onChange={handleChange}
                error={!!formErrors.deathCertificateNumber}
                helperText={formErrors.deathCertificateNumber}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!formErrors.causeOfDeath}>
                <InputLabel id="cause-of-death-label">Cause of Death</InputLabel>
                <Select
                  labelId="cause-of-death-label"
                  name="causeOfDeath"
                  value={formData.causeOfDeath}
                  onChange={handleChange}
                  label="Cause of Death"
                >
                  <MenuItem value="Natural Causes">Natural Causes</MenuItem>
                  <MenuItem value="Heart Disease">Heart Disease</MenuItem>
                  <MenuItem value="Cancer">Cancer</MenuItem>
                  <MenuItem value="Respiratory Disease">Respiratory Disease</MenuItem>
                  <MenuItem value="Stroke">Stroke</MenuItem>
                  <MenuItem value="Accident">Accident</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
                {formErrors.causeOfDeath && (
                  <FormHelperText error>{formErrors.causeOfDeath}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Comments"
                name="comments"
                multiline
                rows={4}
                value={formData.comments}
                onChange={handleChange}
                placeholder="Any additional details about the circumstances of death"
              />
            </Grid>
          </Grid>
        );
        
      case 2: // Upload Documents
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Document Requirements</AlertTitle>
                Please upload a scanned copy or photo of the official death certificate. Acceptable formats are PDF, JPG, or PNG.
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  mb: 3,
                  bgcolor: 'background.default',
                }}
              >
                {documentFileName ? (
                  <>
                    <InsertDriveFile color="primary" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="body1" gutterBottom>
                      {documentFileName}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedDocument(null);
                        setDocumentFileName('');
                        setFormData({
                          ...formData,
                          documentUploaded: false,
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" gutterBottom>
                      Drag and drop your file here, or click to browse
                    </Typography>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<Upload />}
                    >
                      Upload Document
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleDocumentUpload}
                      />
                    </Button>
                  </>
                )}
              </Paper>
              
              {formErrors.documentUploaded && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {formErrors.documentUploaded}
                </Alert>
              )}
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    name="termsAccepted"
                    color="primary"
                  />
                }
                label="I certify that the information provided is accurate and the uploaded document is authentic."
              />
              {formErrors.termsAccepted && (
                <FormHelperText error>{formErrors.termsAccepted}</FormHelperText>
              )}
            </Grid>
          </Grid>
        );
        
      case 3: // Confirmation
        return (
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} textAlign="center">
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CircularProgress />
                  <Typography variant="body1">Registering death on the blockchain...</Typography>
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : success ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Check color="success" sx={{ fontSize: 60 }} />
                  </Box>
                  <Typography variant="h5" gutterBottom>
                    Death Registration Completed
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    The death of {formData.pensionerName} has been successfully registered on the blockchain.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/doctor-dashboard')}
                    sx={{ mt: 2 }}
                  >
                    Return to Dashboard
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <AlertTitle>Important Notice</AlertTitle>
                    You are about to register the death of {formData.pensionerName} on the blockchain. This action is permanent and will stop all pension payments. Please review all information carefully.
                  </Alert>
                  
                  <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Registration Summary
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Pensioner Name</Typography>
                        <Typography variant="body1">{formData.pensionerName}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Pensioner ID</Typography>
                        <Typography variant="body1">{formData.pensionerId}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Date of Death</Typography>
                        <Typography variant="body1">{formData.dateOfDeath}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Cause of Death</Typography>
                        <Typography variant="body1">{formData.causeOfDeath}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Death Certificate</Typography>
                        <Typography variant="body1">{formData.deathCertificateNumber}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Document</Typography>
                        <Typography variant="body1">{documentFileName || 'Not provided'}</Typography>
                      </Grid>
                      {formData.comments && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2">Additional Comments</Typography>
                          <Typography variant="body1">{formData.comments}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                  
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleSubmit}
                    startIcon={<PersonOff />}
                    disabled={loading}
                    size="large"
                    sx={{ mt: 2 }}
                  >
                    Confirm Death Registration
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        );
        
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <>
      <Header title="Register Death" onLogout={logout} />
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Register Death
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Use this form to register the death of a pensioner on the blockchain.
            </Typography>
          </Box>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box sx={{ mb: 4 }}>
            {getStepContent()}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0 || activeStep === steps.length - 1 && success}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              endIcon={activeStep === steps.length - 1 ? null : <ArrowForward />}
              disabled={(activeStep === steps.length - 1 && (loading || success))}
              color={activeStep === steps.length - 1 ? 'primary' : 'primary'}
            >
              {activeStep === steps.length - 1 ? (success ? 'Completed' : 'Register') : 'Next'}
            </Button>
          </Box>
        </Paper>
      </Container>
      
      {/* Success Dialog */}
      <Dialog
        open={confirmDialogOpen && success}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Death Registration Successful</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`The death of ${formData.pensionerName} has been successfully registered on the blockchain. Pension payments will be immediately stopped.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/doctor-dashboard')} variant="contained">
            Return to Dashboard
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

export default RegisterDeath; 