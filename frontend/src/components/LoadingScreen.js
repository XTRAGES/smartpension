import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';

// Define animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: 'background.default',
        animation: `${fadeIn} 0.5s ease-in-out`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          bgcolor: 'background.paper',
          width: { xs: '90%', sm: '400px' },
          animation: `${slideUp} 0.7s ease-out`,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            fontFamily: 'Montserrat, sans-serif',
            mb: 3,
          }}
        >
          Smart Pension
        </Typography>
        
        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
        
        <Typography
          variant="body1"
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            animation: `${fadeIn} 1s ease-in-out`,
          }}
        >
          Loading secure environment...
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingScreen; 