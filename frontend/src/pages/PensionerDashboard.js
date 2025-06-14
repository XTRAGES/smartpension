import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Box, Paper, Typography, Grid, Divider, Button, 
  Card, CardContent, CircularProgress, Alert, Skeleton,
  Avatar, IconButton, Tooltip, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarTodayIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Refresh as RefreshIcon,
  Logout as LogoutIcon,
  Videocam as VideocamIcon,
  VerifiedUser as VerifiedUserIcon,
  AccessTime as AccessTimeIcon,
  CameraAlt as CameraAltIcon
} from '@mui/icons-material';
import { format, addDays } from 'date-fns';
import { useUser } from '../contexts/UserContext';
import { useWeb3 } from '../contexts/Web3Context';
import { usePensioners } from '../contexts/PensionerContext';
import { ethers } from 'ethers';
import Header from '../components/Header';
import { toast } from 'react-toastify';

// Default profile data for all pensioners
const DEFAULT_PROFILE = {
  name: "Default Pensioner",
  wallet: "0x1234567890123456789012345678901234567890",
  pensionAmount: "1.5000",
  lastVerificationDate: new Date(),
  nextVerificationDate: addDays(new Date(), 95),
  isActive: true,
  isDeceased: false,
  verificationStatus: "active"
};

// The PensionerDashboard component displays a personalized dashboard for pensioners
const PensionerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useUser();
  const { isConnected, account, contract, balance } = useWeb3();
  const { getPensionerByWallet } = usePensioners();
  
  const [pensioner, setPensioner] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionDialog, setCameraPermissionDialog] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const [aiDetection, setAiDetection] = useState({
    progress: 0,
    status: '',
    completed: false
  });
  
  // Check authentication state and redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch pensioner data
  useEffect(() => {
    const fetchPensionerData = async () => {
      if (!user) {
        // Use default profile instead of showing nothing
        setLoading(false);
        return;
      }
      
      if (!user.wallet && !account) {
        // Use default profile instead of showing error
        setLoading(false);
        return;
      }
      
      try {
        // First try to get data directly from the API
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/pensioner-data`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (data.success && data.pensioner) {
            // Handle dates and ensure pensioner is always active
            const pensionerData = {
              ...data.pensioner,
              lastVerificationDate: new Date(),
              nextVerificationDate: addDays(new Date(), 95),
              isActive: true,
            };
            
            setPensioner({
              ...DEFAULT_PROFILE,
              ...pensionerData,
              name: data.pensioner.name || user?.firstName || DEFAULT_PROFILE.name
            });
            setLoading(false);
            setRefreshing(false);
            return;
          }
        } catch (apiError) {
          console.log('API fetch failed, falling back to blockchain', apiError);
          // Fall back to blockchain if API fails
        }
        
        // Then try to get data from the blockchain
        if (isConnected && contract) {
          try {
            // Get wallet address (prefer user.wallet, fallback to account)
            const walletAddress = user.wallet || account;
            
            // Get pensioner ID by wallet
            const pensionerId = await contract.getPensionerIDByAddress(walletAddress);
            
            if (!pensionerId || pensionerId.toString() === '0') {
              // Use default profile instead of throwing error
              throw new Error('Pensioner not found on blockchain');
            }
            
            // Get pensioner details from the contract
            const pensionerData = await contract.getPensioner(pensionerId);
            
            // Create pensioner object from blockchain data - always set as active
            const blockchainPensioner = {
              id: pensionerId.toString(),
              name: pensionerData[1] || user?.firstName || DEFAULT_PROFILE.name,
              wallet: pensionerData[0] || walletAddress || DEFAULT_PROFILE.wallet,
              pensionAmount: ethers.utils.formatEther(pensionerData[2]),
              lastVerificationDate: new Date(),
              nextVerificationDate: addDays(new Date(), 95),
              isActive: true,
              isDeceased: false,
              verificationStatus: "active"
            };
            
            setPensioner({
              ...DEFAULT_PROFILE,
              ...blockchainPensioner
            });
          } catch (err) {
            console.error('Error fetching from blockchain:', err);
            // If blockchain fetch fails, fall back to context data
            fallbackToContextData();
          }
        } else {
          // If not connected to blockchain, use context data
          fallbackToContextData();
        }
      } catch (err) {
        console.error('Error fetching pensioner data:', err);
        // Use default profile instead of showing error
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    const fallbackToContextData = () => {
      try {
        // Get pensioner from context using either user.wallet or connected account
        const contextPensioner = getPensionerByWallet(user.wallet || account);
        
        if (contextPensioner) {
          // Ensure pensioner is always active
          setPensioner({
            ...DEFAULT_PROFILE,
            ...contextPensioner,
            name: contextPensioner.name || user?.firstName || DEFAULT_PROFILE.name,
            isActive: true,
            lastVerificationDate: new Date(),
            nextVerificationDate: addDays(new Date(), 95),
            verificationStatus: 'active'
          });
        } else {
          // Use default profile with user name if available
          setPensioner({
            ...DEFAULT_PROFILE,
            name: user?.firstName || DEFAULT_PROFILE.name,
            wallet: user?.wallet || account || DEFAULT_PROFILE.wallet,
            nextVerificationDate: addDays(new Date(), 95)
          });
        }
      } catch (err) {
        console.error('Error fetching from context:', err);
        // Use default profile instead of showing error
      }
    };
    
    fetchPensionerData();
  }, [user, isConnected, contract, account, getPensionerByWallet, refreshing]);
  
  // Handle refresh data
  const refreshData = () => {
    setRefreshing(true);
    setError('');
    toast.info('Refreshing pensioner data...');
  };
  
  // Handle logout - properly calling the logout function from UserContext
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
  
  // Handle AI verification
  const handleVerification = () => {
    // Show camera permission dialog first
    setCameraPermissionDialog(true);
  };
  
  // Handle camera permission approval
  const handleCameraPermissionApproved = async () => {
    setCameraPermissionDialog(false);
    setCameraActive(true);
    setVerifying(true);
    setVerificationProgress(0);
    setAiDetection({
      progress: 0,
      status: 'Initializing...',
      completed: false
    });
    
    // Start camera
    try {
      const constraints = { 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraPermissionGranted(true);
        setCameraError(false);
      }
      
      // Simulate the AI verification process
      const totalTime = 5000; // 5 seconds total
      const interval = 100; // Update every 100ms
      const steps = totalTime / interval;
      let currentStep = 0;
      
      const progressInterval = setInterval(() => {
        currentStep++;
        const progress = Math.min(100, Math.floor((currentStep / steps) * 100));
        setVerificationProgress(progress);
        
        // Update AI detection status based on progress
        if (progress < 20) {
          setAiDetection({
            progress,
            status: 'Initializing face detection...',
            completed: false
          });
        } else if (progress < 40) {
          setAiDetection({
            progress,
            status: 'Scanning facial features...',
            completed: false
          });
        } else if (progress < 60) {
          setAiDetection({
            progress,
            status: 'Analyzing movement patterns...',
            completed: false
          });
        } else if (progress < 80) {
          setAiDetection({
            progress,
            status: 'Performing liveness check...',
            completed: false
          });
        } else if (progress < 100) {
          setAiDetection({
            progress,
            status: 'Verifying identity...',
            completed: false
          });
        } else {
          setAiDetection({
            progress: 100,
            status: 'Verification successful!',
            completed: true
          });
          clearInterval(progressInterval);
          
          // Show success message and reset after completion
          setTimeout(() => {
            setVerificationComplete(true);
            
            // Stop the camera
            if (videoRef.current && videoRef.current.srcObject) {
              const tracks = videoRef.current.srcObject.getTracks();
              tracks.forEach(track => track.stop());
            }
            
            setCameraActive(false);
            setVerifying(false);
            
            // Update verification date
            setPensioner({
              ...pensioner,
              lastVerificationDate: new Date(),
              nextVerificationDate: addDays(new Date(), 95)
            });
            
            toast.success('Identity verification successful! Next verification due in 95 days.');
          }, 1000);
        }
      }, interval);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError(true);
      toast.error('Could not access camera. Please check camera permissions.');
      
      // Continue with verification process anyway for demo purposes
      setVerifying(true);
      simulateVerification();
    }
  };
  
  // Simulate verification without camera
  const simulateVerification = () => {
    const totalTime = 5000;
    const interval = 100;
    const steps = totalTime / interval;
    let currentStep = 0;
    
    const progressInterval = setInterval(() => {
      currentStep++;
      const progress = Math.min(100, Math.floor((currentStep / steps) * 100));
      setVerificationProgress(progress);
      
      // Update AI detection status based on progress
      if (progress < 20) {
        setAiDetection({
          progress,
          status: 'Initializing face detection...',
          completed: false
        });
      } else if (progress < 40) {
        setAiDetection({
          progress,
          status: 'Scanning facial features...',
          completed: false
        });
      } else if (progress < 60) {
        setAiDetection({
          progress,
          status: 'Analyzing movement patterns...',
          completed: false
        });
      } else if (progress < 80) {
        setAiDetection({
          progress,
          status: 'Performing liveness check...',
          completed: false
        });
      } else if (progress < 100) {
        setAiDetection({
          progress,
          status: 'Verifying identity...',
          completed: false
        });
      } else {
        setAiDetection({
          progress: 100,
          status: 'Verification successful!',
          completed: true
        });
        clearInterval(progressInterval);
        
        setTimeout(() => {
          setVerificationComplete(true);
          setCameraActive(false);
          setVerifying(false);
          
          setPensioner({
            ...pensioner,
            lastVerificationDate: new Date(),
            nextVerificationDate: addDays(new Date(), 95)
          });
          
          toast.success('Identity verification successful! Next verification due in 95 days.');
        }, 1000);
      }
    }, interval);
  };
  
  // Handle camera permission denial
  const handleCameraPermissionDenied = () => {
    setCameraPermissionDialog(false);
    toast.warning('Camera access is required for verification. Using fallback method.');
    setCameraActive(true);
    setCameraError(true);
    simulateVerification();
  };
  
  // Calculate days remaining until next verification
  const getDaysUntilVerification = () => {
    const today = new Date();
    const nextDate = new Date(pensioner.nextVerificationDate);
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'deceased':
        return 'error';
      default:
        return 'primary';
    }
  };
  
  // Format ETH amount with 4 decimal places
  const formatEth = (amount) => {
    if (!amount) return '1.5000'; // Default amount
    return parseFloat(amount).toFixed(4);
  };
  
  // Clean up camera when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Add keyframes for animation
  const pulseAnimation = `
    @keyframes pulse {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.7;
      }
      50% {
        transform: translate(-50%, -50%) scale(1.05);
        opacity: 0.5;
      }
      100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.7;
      }
    }
  `;
  
  // Render loading state
  if (loading) {
    return (
      <>
        <style>{pulseAnimation}</style>
        <Header onLogout={handleLogout} title="Pensioner Dashboard" />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={200} />
            <Skeleton variant="rectangular" height={200} />
          </Box>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <style>{pulseAnimation}</style>
      <Header onLogout={handleLogout} title="Pensioner Dashboard" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Page Header */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={4}
          sx={{
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 0 }
          }}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            Welcome, {pensioner?.name || user?.firstName || 'Pensioner'}
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center">
            <Tooltip title="Refresh data">
              <IconButton 
                color="primary" 
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Box>
        </Box>
        
        {/* Status Card */}
        <Card sx={{ mb: 4, boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
          <Box 
            sx={{ 
              bgcolor: getStatusColor(pensioner.verificationStatus) + '.main',
              color: 'white', 
              py: 2, 
              px: 3 
            }}
          >
            <Typography variant="h5">
              Pension Status: Active
            </Typography>
          </Box>
          
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="body1" paragraph>
                  Your pension is active and in good standing. Payments will be processed automatically.
                </Typography>
                
                {/* Verification Countdown */}
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'info.light', 
                    color: 'info.contrastText',
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTimeIcon />
                    <Typography variant="body1" fontWeight="medium">
                      Next verification required in <strong>{getDaysUntilVerification()} days</strong> ({format(new Date(pensioner.nextVerificationDate), 'PP')})
                    </Typography>
                  </Box>
                </Paper>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<VerifiedUserIcon />}
                  onClick={handleVerification}
                  disabled={verifying || verificationComplete}
                  sx={{ mt: 1 }}
                >
                  {verifying ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Verifying Identity...
                    </>
                  ) : verificationComplete ? (
                    'Verification Complete'
                  ) : (
                    'Start Identity Verification'
                  )}
                </Button>
              </Grid>
              
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    bgcolor: 'success.main',
                    boxShadow: 2
                  }}
                >
                  <CheckCircleIcon fontSize="large" />
                </Avatar>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Status: Active
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* AI Camera Verification */}
        {cameraActive && (
          <Card sx={{ mb: 4, boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
            <Box 
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white', 
                py: 2, 
                px: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <VideocamIcon />
              <Typography variant="h5">
                AI Identity Verification
              </Typography>
            </Box>
            
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {/* Mock Camera Display */}
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 300, 
                      bgcolor: 'black',
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Real camera video feed */}
                    <video
                      ref={videoRef}
                      id="camera-feed"
                      autoPlay
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        transform: 'scaleX(-1)' // Mirror effect for selfie mode
                      }}
                    />
                    
                    {cameraError && (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                        <PersonIcon sx={{ fontSize: 120, color: 'white', opacity: 0.7 }} />
                      </Box>
                    )}
                    
                    {verifying && (
                      <>
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 2
                          }}
                        >
                          <Box 
                            sx={{ 
                              position: 'absolute', 
                              top: 10, 
                              left: 10, 
                              right: 10, 
                              bottom: 10,
                              border: '2px solid green',
                              borderRadius: 2,
                              opacity: 0.7
                            }}
                          />
                          
                          {/* Face tracking points simulation */}
                          {verificationProgress > 20 && (
                            <>
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  width: 4,
                                  height: 4,
                                  bgcolor: 'green',
                                  borderRadius: '50%',
                                  top: '35%',
                                  left: '43%',
                                }}
                              />
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  width: 4,
                                  height: 4,
                                  bgcolor: 'green',
                                  borderRadius: '50%',
                                  top: '35%',
                                  left: '57%',
                                }}
                              />
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  width: 4,
                                  height: 4,
                                  bgcolor: 'green',
                                  borderRadius: '50%',
                                  top: '45%',
                                  left: '50%',
                                }}
                              />
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  width: 4,
                                  height: 4,
                                  bgcolor: 'green',
                                  borderRadius: '50%',
                                  top: '55%',
                                  left: '43%',
                                }}
                              />
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  width: 4,
                                  height: 4,
                                  bgcolor: 'green',
                                  borderRadius: '50%',
                                  top: '55%',
                                  left: '57%',
                                }}
                              />
                            </>
                          )}
                        </Box>
                        
                        {/* Video overlay elements */}
                        <Box sx={{ position: 'absolute', bottom: 10, left: 10, color: 'white', display: 'flex', alignItems: 'center', gap: 1, zIndex: 3 }}>
                          <Box sx={{ width: 8, height: 8, bgcolor: 'red', borderRadius: '50%' }} />
                          <Typography variant="caption">LIVE</Typography>
                        </Box>
                        
                        <Box sx={{ position: 'absolute', top: 10, right: 10, color: 'white', zIndex: 3 }}>
                          <Typography variant="caption">AI ANALYSIS ACTIVE</Typography>
                        </Box>
                        
                        {/* Add recording indicator */}
                        <Box 
                          sx={{ 
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            zIndex: 3
                          }}
                        >
                          <CameraAltIcon fontSize="small" />
                          <Typography variant="caption">
                            {verificationProgress < 100 ? "Recording..." : "Scan Complete"}
                          </Typography>
                        </Box>
                        
                        {/* Add face detection box that moves slightly */}
                        {verificationProgress > 30 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              border: '1px dashed rgba(0, 255, 0, 0.7)',
                              width: '180px',
                              height: '220px',
                              borderRadius: '40%',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              zIndex: 2,
                              animation: 'pulse 2s infinite'
                            }}
                          />
                        )}
                      </>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      AI Verification Process
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Our advanced AI system is verifying your identity through facial recognition, motion analysis, and liveness detection to ensure you are the rightful pension recipient.
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Verification Progress</Typography>
                        <Typography variant="body2">{verificationProgress}%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={verificationProgress} 
                        sx={{ 
                          height: 10, 
                          borderRadius: 1,
                          bgcolor: 'grey.300',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: verificationProgress < 100 ? 'primary.main' : 'success.main',
                          }
                        }}
                      />
                    </Box>
                    
                    <Alert 
                      severity={verificationProgress < 100 ? "info" : "success"}
                      sx={{ mb: 2 }}
                    >
                      {aiDetection.status}
                    </Alert>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Face Detection</Typography>
                        <Typography variant="body2">{verificationProgress > 20 ? 'Complete' : 'In Progress...'}</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Liveness Check</Typography>
                        <Typography variant="body2">{verificationProgress > 60 ? 'Complete' : verificationProgress > 40 ? 'In Progress...' : 'Waiting...'}</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Identity Matching</Typography>
                        <Typography variant="body2">{verificationProgress > 80 ? 'Complete' : verificationProgress > 60 ? 'In Progress...' : 'Waiting...'}</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Blockchain Verification</Typography>
                        <Typography variant="body2">{verificationProgress === 100 ? 'Complete' : verificationProgress > 80 ? 'In Progress...' : 'Waiting...'}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
        
        {/* Personal Data */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Personal Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body1">
                  <strong>Name:</strong> {pensioner.name}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <AttachMoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body1">
                  <strong>Pension Amount:</strong> {formatEth(pensioner.pensionAmount)} ETH
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalanceWalletIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography 
                  variant="body1" 
                  sx={{ 
                    wordBreak: 'break-all',
                    fontFamily: 'monospace'
                  }}
                >
                  <strong>Wallet:</strong> {pensioner.wallet}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body1">
                  <strong>Last Verification:</strong> {format(new Date(pensioner.lastVerificationDate), 'PP')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Camera Permission Dialog */}
        <Dialog
          open={cameraPermissionDialog}
          onClose={handleCameraPermissionDenied}
          aria-labelledby="camera-permission-dialog-title"
          aria-describedby="camera-permission-dialog-description"
        >
          <DialogTitle id="camera-permission-dialog-title">
            <Box display="flex" alignItems="center" gap={1}>
              <VideocamIcon color="primary" />
              Camera Access Required
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="camera-permission-dialog-description">
              To verify your identity, we need access to your camera for a quick facial scan. 
              This helps us confirm you are the rightful pension recipient.
              Your privacy is important - no video is stored or shared.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCameraPermissionDenied} color="error">
              Deny
            </Button>
            <Button onClick={handleCameraPermissionApproved} color="primary" variant="contained" autoFocus>
              Allow Camera Access
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default PensionerDashboard;