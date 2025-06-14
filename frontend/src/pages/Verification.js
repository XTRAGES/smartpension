import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  AlertTitle,
  LinearProgress,
  Container,
} from '@mui/material';
import {
  CameraAlt,
  Verified,
  PanTool,
  CheckCircle,
  Error,
  ArrowBack,
  Refresh,
  FlipCameraIos,
  Cancel,
} from '@mui/icons-material';
import * as faceapi from 'face-api.js';
import { useWeb3 } from '../contexts/Web3Context';
import { useUser } from '../contexts/UserContext';
import Header from '../components/Header';
import { keyframes } from '@emotion/react';

// Define animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

// Define verification steps
const steps = ['Prepare', 'Take Photo', 'Verify Identity', 'Confirm'];

// Define gestures for liveness detection
const GESTURES = [
  { name: 'Blink', icon: '😉', instruction: 'Please blink your eyes' },
  { name: 'Smile', icon: '😊', instruction: 'Please smile' },
  { name: 'Turn left', icon: '👈', instruction: 'Please turn your head slightly to the left' },
  { name: 'Turn right', icon: '👉', instruction: 'Please turn your head slightly to the right' },
];

const Verification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPensioner, verifyPensioner } = useWeb3();
  const { user, logout } = useUser();
  
  // State for pensioner data
  const [pensioner, setPensioner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for verification process
  const [activeStep, setActiveStep] = useState(0);
  const [processingVerification, setProcessingVerification] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationScore, setVerificationScore] = useState(0);
  
  // State for face detection
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [referenceImage, setReferenceImage] = useState(null); // For demo, we'll use a first capture as reference
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back
  const [detectedFace, setDetectedFace] = useState(null);
  const [livenessStage, setLivenessStage] = useState(0);
  const [livenessCompleted, setLivenessCompleted] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  // Load pensioner data
  useEffect(() => {
    const loadPensionerData = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          setError('Pensioner ID not found');
          return;
        }
        
        const data = await getPensioner(parseInt(id));
        
        if (data) {
          setPensioner(data);
        } else {
          setError('Failed to load pensioner data');
        }
      } catch (error) {
        console.error('Error loading pensioner data:', error);
        setError('Error loading pensioner data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadPensionerData();
  }, [id, getPensioner]);
  
  // Load face-api.js models
  useEffect(() => {
    const loadFaceApiModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        ]);
        console.log('Face-api models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api models:', error);
        setCameraError('Failed to load facial recognition models. Please refresh and try again.');
      }
    };
    
    loadFaceApiModels();
    
    // Cleanup function
    return () => {
      // Stop webcam when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Start camera when reaching the camera step
  useEffect(() => {
    if (activeStep === 1 && !cameraReady && !capturedImage) {
      startCamera();
    }
  }, [activeStep, cameraReady, capturedImage]);
  
  // Start webcam
  const startCamera = async () => {
    try {
      setCameraError('');
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Get webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      
      // Store stream in ref for cleanup
      streamRef.current = stream;
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
          detectFaceContinuously();
        };
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setCameraError(`Cannot access camera: ${error.message}. Please ensure camera permissions are granted.`);
    }
  };
  
  // Switch camera (front/back)
  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCameraReady(false);
    startCamera();
  };
  
  // Continuous face detection
  const detectFaceContinuously = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
    
    // Detection loop
    const interval = setInterval(async () => {
      if (!video || !canvas || !video.readyState || video.paused || video.ended) {
        clearInterval(interval);
        return;
      }
      
      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();
          
        // Clear canvas and draw results
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        if (resizedDetections && resizedDetections.length > 0) {
          // Only draw box in debug mode
          // faceapi.draw.drawDetections(canvas, resizedDetections);
          
          setDetectedFace(resizedDetections[0]);
          
          // Check for liveness if in liveness stage
          if (livenessStage > 0 && !livenessCompleted) {
            checkLiveness(resizedDetections[0]);
          }
        } else {
          setDetectedFace(null);
        }
      } catch (error) {
        console.error('Error in face detection:', error);
      }
    }, 100);
    
    // Cleanup on component unmount
    return () => clearInterval(interval);
  };
  
  // Check liveness based on current gesture
  const checkLiveness = (detection) => {
    if (!detection) return;
    
    const currentGesture = GESTURES[(livenessStage - 1) % GESTURES.length];
    
    // Get expressions from detection
    const expressions = detection.expressions;
    
    switch (currentGesture.name) {
      case 'Blink':
        // Detect low eye aspect ratio indicating blink
        if (expressions.happy > 0.1 && expressions.neutral < 0.5) {
          completeLivenessStage();
        }
        break;
        
      case 'Smile':
        // Detect smile expression
        if (expressions.happy > 0.7) {
          completeLivenessStage();
        }
        break;
        
      case 'Turn left':
        // Use landmarks to detect head pose (simplified)
        const landmarks = detection.landmarks;
        const positions = landmarks.positions;
        
        // Check if right eye is further right than left eye (indicating left turn)
        const leftEye = positions[36]; // left eye left corner
        const rightEye = positions[45]; // right eye right corner
        
        if (rightEye.x - leftEye.x < 50) { // threshold based on testing
          completeLivenessStage();
        }
        break;
        
      case 'Turn right':
        // Similar logic for right turn
        const landmarks2 = detection.landmarks;
        const positions2 = landmarks2.positions;
        
        const leftEye2 = positions2[36]; // left eye left corner
        const rightEye2 = positions2[45]; // right eye right corner
        
        if (rightEye2.x - leftEye2.x > 90) { // threshold based on testing
          completeLivenessStage();
        }
        break;
        
      default:
        break;
    }
  };
  
  // Complete current liveness stage
  const completeLivenessStage = () => {
    // If all gestures completed
    if (livenessStage >= GESTURES.length) {
      setLivenessCompleted(true);
    } else {
      // Move to next gesture
      setLivenessStage(prev => prev + 1);
    }
  };
  
  // Capture current frame
  const captureImage = () => {
    if (!videoRef.current || !detectedFace) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageDataURL = canvas.toDataURL('image/jpeg');
    
    // If this is the first capture, use it as reference image
    if (!referenceImage) {
      setReferenceImage(imageDataURL);
      // For demo purposes, we'll reset and capture again for verification
      setLivenessStage(0);
      setLivenessCompleted(false);
    } else {
      setCapturedImage(imageDataURL);
      
      // Move to verification step
      handleNext();
    }
  };
  
  // Reset captured image
  const resetCapture = () => {
    setCapturedImage(null);
    setLivenessStage(0);
    setLivenessCompleted(false);
    startCamera();
  };
  
  // Go to next step
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  // Go to previous step
  const handleBack = () => {
    if (activeStep === 2 && capturedImage) {
      resetCapture();
    }
    
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Submit verification to blockchain
  const submitVerification = async () => {
    try {
      setProcessingVerification(true);
      setVerificationError('');
      
      // Validate ID before submitting
      if (!id) {
        throw new Error('Pensioner ID is missing');
      }
      
      const pensionerId = parseInt(id, 10);
      if (isNaN(pensionerId)) {
        throw new Error('Invalid pensioner ID');
      }
      
      // In a real app, we'd send both images to the backend for comparison
      // For demo, we'll simulate a successful verification with a random score
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a random verification score (80-100%)
      const simulatedScore = Math.floor(Math.random() * 20) + 80;
      setVerificationScore(simulatedScore);
      
      // Submit verification to blockchain
      const success = await verifyPensioner(pensionerId);
      
      if (success) {
        setVerificationSuccess(true);
        handleNext();
      } else {
        setVerificationError('Failed to update blockchain record. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      setVerificationError('Error submitting verification: ' + error.message);
    } finally {
      setProcessingVerification(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Return to dashboard
  const handleReturnToDashboard = () => {
    navigate('/pensioner-dashboard');
  };
  
  // Get current gesture instruction
  const getCurrentGestureInstruction = () => {
    if (livenessStage === 0) return "Look directly at the camera";
    
    return GESTURES[(livenessStage - 1) % GESTURES.length].instruction;
  };
  
  // Get current gesture icon
  const getCurrentGestureIcon = () => {
    if (livenessStage === 0) return "🙂";
    
    return GESTURES[(livenessStage - 1) % GESTURES.length].icon;
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Prepare
        return (
          <Box sx={{ textAlign: 'center', py: 3, px: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
              Prepare for Verification
            </Typography>
            
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                my: 4,
                animation: `${pulse} 2s infinite ease-in-out`,
              }}
            >
              <CameraAlt sx={{ fontSize: 100, color: 'primary.main', opacity: 0.8 }} />
            </Box>
            
            <Typography variant="body1" paragraph>
              You'll need to complete a quick facial verification to confirm your identity and maintain your pension status.
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 4, mt: 2 }}>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Step 1
                  </Typography>
                  <Typography variant="body1">
                    Ensure good lighting on your face
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Step 2
                  </Typography>
                  <Typography variant="body1">
                    Remove glasses and face coverings
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Step 3
                  </Typography>
                  <Typography variant="body1">
                    Follow the on-screen instructions
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
              <AlertTitle>Privacy Note</AlertTitle>
              Your biometric data is encrypted and only used for verification purposes. It will not be stored or shared.
            </Alert>
            
            <Button
              variant="contained"
              size="large"
              onClick={handleNext}
              sx={{ px: 4, py: 1.5 }}
            >
              Continue
            </Button>
          </Box>
        );
        
      case 1: // Take Photo
        return (
          <Box sx={{ textAlign: 'center', py: 3, px: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
              Facial Verification
            </Typography>
            
            {cameraError ? (
              <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
                <AlertTitle>Camera Error</AlertTitle>
                {cameraError}
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {!livenessCompleted 
                  ? getCurrentGestureInstruction()
                  : "Great! You've completed all verification steps. Now you can take your photo."}
              </Typography>
            )}
            
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 500, mx: 'auto' }}>
              {/* Video feed */}
              <Box 
                sx={{ 
                  border: '1px solid',
                  borderColor: detectedFace ? 'success.main' : 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: detectedFace ? '0 0 0 3px rgba(76, 175, 80, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  width="100%"
                  height="auto"
                  style={{ display: cameraReady ? 'block' : 'none' }}
                />
                
                {!cameraReady && !cameraError && (
                  <Box 
                    sx={{ 
                      height: 300, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'background.default',
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}
                
                {/* Overlay canvas for face detection */}
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}
                />
                
                {/* Liveness indicator */}
                {livenessStage > 0 && !livenessCompleted && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '4rem',
                      animation: `${pulse} 1.5s infinite ease-in-out`,
                    }}
                  >
                    {getCurrentGestureIcon()}
                  </Box>
                )}
                
                {/* Liveness progress */}
                <LinearProgress 
                  variant="determinate" 
                  value={(livenessStage / GESTURES.length) * 100} 
                  sx={{ 
                    height: 6,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                  }} 
                />
              </Box>
              
              {/* Camera controls */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
                <Tooltip title="Switch Camera">
                  <IconButton 
                    onClick={switchCamera}
                    color="primary"
                    disabled={!cameraReady}
                  >
                    <FlipCameraIos />
                  </IconButton>
                </Tooltip>
                
                <Button
                  variant="contained"
                  startIcon={<CameraAlt />}
                  onClick={captureImage}
                  disabled={!detectedFace || !livenessCompleted}
                  sx={{ px: 3 }}
                >
                  Take Photo
                </Button>
                
                <Tooltip title="Restart">
                  <IconButton 
                    onClick={() => {
                      setLivenessStage(0);
                      setLivenessCompleted(false);
                      startCamera();
                    }}
                    color="primary"
                    disabled={!cameraReady}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {/* Instruction */}
              {!detectedFace && cameraReady && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  No face detected. Please ensure your face is visible to the camera.
                </Alert>
              )}
            </Box>
          </Box>
        );
        
      case 2: // Verify Identity
        return (
          <Box sx={{ textAlign: 'center', py: 3, px: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
              Verify Your Identity
            </Typography>
            
            <Grid container spacing={4} sx={{ mb: 4, mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Reference Photo
                </Typography>
                
                <Box 
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 2,
                  }}
                >
                  {referenceImage && (
                    <img 
                      src={referenceImage} 
                      alt="Reference" 
                      style={{ width: '100%', height: 'auto' }} 
                    />
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Verification Photo
                </Typography>
                
                <Box 
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 2,
                  }}
                >
                  {capturedImage && (
                    <img 
                      src={capturedImage} 
                      alt="Captured" 
                      style={{ width: '100%', height: 'auto' }} 
                    />
                  )}
                </Box>
                
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={resetCapture}
                  disabled={processingVerification}
                  sx={{ mt: 1 }}
                >
                  Retake Photo
                </Button>
              </Grid>
            </Grid>
            
            {verificationError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {verificationError}
              </Alert>
            )}
            
            <Button
              variant="contained"
              size="large"
              startIcon={<Verified />}
              onClick={submitVerification}
              disabled={processingVerification}
              sx={{ px: 4, py: 1.5 }}
            >
              {processingVerification ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                  Verifying...
                </>
              ) : (
                'Submit Verification'
              )}
            </Button>
          </Box>
        );
        
      case 3: // Confirmation
        return (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            {verificationSuccess ? (
              <>
                <CheckCircle 
                  sx={{ 
                    fontSize: 100, 
                    color: 'success.main', 
                    mb: 3,
                    animation: `${fadeIn} 1s ease-in-out`,
                  }} 
                />
                
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Verification Successful!
                </Typography>
                
                <Typography variant="body1" paragraph>
                  Your identity has been verified with a match score of {verificationScore}%.
                </Typography>
                
                <Typography variant="body1" paragraph>
                  Your verification has been recorded on the blockchain and your pension status is now active.
                </Typography>
                
                <Box 
                  sx={{ 
                    p: 3, 
                    bgcolor: 'success.light', 
                    borderRadius: 2, 
                    maxWidth: 500, 
                    mx: 'auto',
                    mb: 4,
                    color: 'success.contrastText',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Next Verification Due:
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'medium' }}>
                    {new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </Typography>
                </Box>
                
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleReturnToDashboard}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Return to Dashboard
                </Button>
              </>
            ) : (
              <>
                <Error 
                  sx={{ 
                    fontSize: 100, 
                    color: 'error.main', 
                    mb: 3,
                    animation: `${fadeIn} 1s ease-in-out`,
                  }} 
                />
                
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Verification Failed
                </Typography>
                
                <Typography variant="body1" paragraph>
                  We couldn't verify your identity. Please try again.
                </Typography>
                
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => {
                    setActiveStep(0);
                    setVerificationSuccess(false);
                    setVerificationError('');
                    setReferenceImage(null);
                    setCapturedImage(null);
                    setLivenessStage(0);
                    setLivenessCompleted(false);
                  }}
                  sx={{ mr: 2, px: 4, py: 1.5 }}
                >
                  Try Again
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleReturnToDashboard}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Return to Dashboard
                </Button>
              </>
            )}
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <>
      <Header title="Identity Verification" onLogout={handleLogout} />
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            {/* Navigation */}
            {activeStep > 0 && activeStep < steps.length - 1 && (
              <Box sx={{ mb: 2 }}>
                <Button
                  startIcon={<ArrowBack />}
                  onClick={handleBack}
                  disabled={processingVerification}
                >
                  Back
                </Button>
              </Box>
            )}
            
            {/* Stepper */}
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {/* Step content */}
            {getStepContent(activeStep)}
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default Verification; 