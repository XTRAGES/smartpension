import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  CircularProgress, 
  Chip,
  Alert,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';
import PersonIcon from '@mui/icons-material/Person';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = ({ walletAddress, pensionerId }) => {
  const [loading, setLoading] = useState(true);
  const [pensionerData, setPensionerData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPensionerData();
  }, [pensionerId]);

  const fetchPensionerData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/pensioner/${pensionerId}`);
      if (response.data.success) {
        setPensionerData(response.data.data);
      } else {
        setError('Failed to load pensioner data');
      }
    } catch (error) {
      console.error('Error fetching pensioner data:', error);
      setError('Error connecting to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate days since last verification
  const getDaysSinceVerification = () => {
    if (!pensionerData) return 0;
    
    const lastVerification = new Date(pensionerData.lastVerificationDate * 1000);
    const today = new Date();
    const diffTime = Math.abs(today - lastVerification);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Format ETH amount to a readable format
  const formatAmount = (amount) => {
    if (!amount) return '0';
    // Convert from wei to ETH
    return (amount / 1e18).toFixed(2);
  };

  // Get verification status
  const getVerificationStatus = () => {
    if (!pensionerData) return { color: 'default', label: 'Unknown', icon: null };

    if (pensionerData.isDeceased) {
      return { 
        color: 'error', 
        label: 'Deceased', 
        icon: <BlockIcon /> 
      };
    }

    const daysSinceVerification = getDaysSinceVerification();
    
    if (daysSinceVerification <= 30) {
      return { 
        color: 'success', 
        label: 'Verified Recently', 
        icon: <VerifiedUserIcon /> 
      };
    } else if (daysSinceVerification <= 150) {
      return { 
        color: 'warning', 
        label: 'Verification Needed Soon', 
        icon: <WarningIcon /> 
      };
    } else {
      return { 
        color: 'error', 
        label: 'Verification Required', 
        icon: <BlockIcon /> 
      };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const status = getVerificationStatus();
  const daysSinceVerification = getDaysSinceVerification();

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Pensioner Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {pensionerData && (
        <Grid container spacing={3}>
          {/* Status Card */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Verification Status
                </Typography>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={status.label}
                    color={status.color}
                    icon={status.icon}
                    size="medium"
                  />
                </Box>
              </Box>
              
              <Typography variant="body1">
                Last verified: <strong>{pensionerData.lastVerificationDateFormatted}</strong> ({daysSinceVerification} days ago)
              </Typography>

              {pensionerData.paymentsBlocked && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Your pension payments are currently blocked. Please complete verification to resume payments.
                </Alert>
              )}

              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/verification"
                sx={{ mt: 3 }}
                fullWidth
                disabled={pensionerData.isDeceased}
              >
                Complete Verification
              </Button>
            </Paper>
          </Grid>

          {/* Pensioner Details */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Personal Information
                </Typography>
                <List>
                  <ListItem>
                    <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <ListItemText primary="Name" secondary={pensionerData.name} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <CurrencyRupeeIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <ListItemText 
                      primary="Pension Amount" 
                      secondary={`${formatAmount(pensionerData.pensionAmount)} ETH / month`} 
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <CalendarMonthIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <ListItemText 
                      primary="Next Verification Required By" 
                      secondary={
                        daysSinceVerification > 180 
                          ? 'Immediately' 
                          : `In ${Math.max(0, 180 - daysSinceVerification)} days`
                      } 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Blockchain Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Blockchain Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Wallet Address" secondary={pensionerData.wallet} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="Pensioner ID" secondary={pensionerId} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Network" 
                      secondary="Polygon Mumbai Testnet" 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard; 