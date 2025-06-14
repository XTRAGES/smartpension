import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import {
  ErrorOutline,
  Home,
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useUser();
  
  const getHomeRoute = () => {
    if (!isAuthenticated) return '/login';
    
    switch (role) {
      case 'pensioner':
        return '/pensioner-dashboard';
      case 'admin':
        return '/admin-dashboard';
      case 'doctor':
        return '/doctor-dashboard';
      default:
        return '/login';
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
        }}
        elevation={3}
      >
        <ErrorOutline sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
        
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          404
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or never existed.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Home />}
            size="large"
            onClick={() => navigate(getHomeRoute())}
            sx={{ px: 4 }}
          >
            Go to Homepage
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound; 