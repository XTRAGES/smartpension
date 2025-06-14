import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import {
  CheckCircle,
  ArrowForward,
  AccountBalance,
  PhotoCamera,
  Fingerprint,
  People,
  CalendarToday,
  Help
} from '@mui/icons-material';
import Header from '../components/Header';
import { useUser } from '../contexts/UserContext';
import { toast } from 'react-toastify';

const VerificationGuide = () => {
  const navigate = useNavigate();
  const { logout } = useUser();
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      console.error('Error during logout:', err);
      toast.error('Logout failed. Please try again.');
    }
  };
  
  // Requirements for verification
  const requirements = [
    { 
      icon: <People />, 
      title: 'Personal Information', 
      description: 'Your full name, date of birth, and government ID will be required.' 
    },
    { 
      icon: <AccountBalance />, 
      title: 'Wallet Address', 
      description: 'Connect your Ethereum wallet to receive pension payments.' 
    },
    { 
      icon: <PhotoCamera />, 
      title: 'Photo Verification', 
      description: 'A photo of yourself and your ID will be needed to verify your identity.' 
    },
    { 
      icon: <Fingerprint />, 
      title: 'Identity Proof', 
      description: 'Your facial features will be verified against government records.' 
    },
    { 
      icon: <CalendarToday />, 
      title: 'Regular Verification', 
      description: 'You will need to verify every 180 days to continue receiving payments.' 
    }
  ];
  
  // Verification steps
  const steps = [
    'Register and create an account',
    'Fill in your personal information',
    'Connect your Ethereum wallet',
    'Complete identity verification with photo ID',
    'Submit your verification',
    'Wait for approval',
    'Begin receiving pension payments'
  ];
  
  return (
    <>
      <Header onLogout={handleLogout} title="Verification Guide" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        {/* Hero section */}
        <Paper 
          sx={{ 
            p: { xs: 3, md: 6 }, 
            mb: 4, 
            textAlign: 'center',
            backgroundImage: 'linear-gradient(to right, #1976d2, #42a5f5)',
            color: 'white',
            borderRadius: 2
          }}
        >
          <Typography variant="h3" gutterBottom fontWeight="bold">
            Smart Pension Verification Guide
          </Typography>
          <Typography variant="h6" paragraph sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
            Learn how to complete the verification process to start receiving your pension payments securely through our blockchain system.
          </Typography>
          <Button 
            variant="contained" 
            color="secondary"
            size="large"
            onClick={() => navigate('/verification-setup')}
            endIcon={<ArrowForward />}
            sx={{ py: 1.5, px: 4, fontSize: 16 }}
          >
            Start Verification Process
          </Button>
        </Paper>
        
        {/* Why verify section */}
        <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom color="primary" fontWeight="medium">
            Why Verification Is Important
          </Typography>
          <Typography variant="body1" paragraph>
            Our blockchain-based pension system requires verification to ensure that pension payments 
            are delivered to the correct recipients. This helps prevent fraud and ensures the sustainability 
            of the pension system for all participants.
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.light'
                  }}
                >
                  <CheckCircle sx={{ fontSize: 64, color: 'white' }} />
                </CardMedia>
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    Ensure Correct Payments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verification ensures that your pension is paid to you and not to someone else.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'success.light'
                  }}
                >
                  <Fingerprint sx={{ fontSize: 64, color: 'white' }} />
                </CardMedia>
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    Prevent Fraud
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Regular verification prevents fraudulent claims and protects the pension system.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'info.light'
                  }}
                >
                  <CalendarToday sx={{ fontSize: 64, color: 'white' }} />
                </CardMedia>
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    Maintain Eligibility
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Regular verification confirms your continued eligibility for pension benefits.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Requirements section */}
        <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom color="primary" fontWeight="medium">
            Verification Requirements
          </Typography>
          <Typography variant="body1" paragraph>
            To complete the verification process, you will need to have the following:
          </Typography>
          
          <Grid container spacing={3}>
            {requirements.map((req, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 2,
                  height: '100%',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    mb: 2
                  }}>
                    {req.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {req.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {req.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
        
        {/* Steps section */}
        <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom color="primary" fontWeight="medium">
            Verification Process Steps
          </Typography>
          <Typography variant="body1" paragraph>
            Follow these steps to complete your verification:
          </Typography>
          
          <List>
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    <Box 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}
                    >
                      {index + 1}
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </ListItem>
                {index < steps.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
        
        {/* FAQ section */}
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom color="primary" fontWeight="medium">
            Frequently Asked Questions
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              How often do I need to verify my identity?
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              You need to complete the verification process every 180 days (approximately 6 months) to 
              maintain active status in the pension system.
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              What happens if I miss a verification deadline?
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              If you miss a verification deadline, your pension payments will be temporarily suspended 
              until you complete the verification process.
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Is my personal information secure?
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Yes, we use industry-standard encryption and security practices to protect your personal 
              information. Your blockchain transactions are secure and anonymous.
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              What if I don't have a smartphone or webcam?
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              If you don't have access to a smartphone or webcam, please contact our support team for 
              alternative verification options.
            </Typography>
          </Box>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Help />}
              onClick={() => navigate('/contact')}
              sx={{ mr: 2 }}
            >
              Contact Support
            </Button>
            <Button
              variant="contained"
              color="secondary"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/verification-setup')}
            >
              Start Verification
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default VerificationGuide; 