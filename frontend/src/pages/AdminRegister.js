import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert,
  Grid,
  InputAdornment,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api`;

const AdminRegister = ({ walletAddress }) => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form fields
  const [pensionerWalletAddress, setPensionerWalletAddress] = useState('');
  const [pensionerName, setPensionerName] = useState('');
  const [pensionAmount, setPensionAmount] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [pensionerId, setPensionerId] = useState(null);

  const validateForm = () => {
    if (!pensionerWalletAddress) {
      setError('Pensioner wallet address is required');
      return false;
    }
    
    if (!pensionerWalletAddress.startsWith('0x') || pensionerWalletAddress.length !== 42) {
      setError('Invalid wallet address format');
      return false;
    }
    
    if (!pensionerName) {
      setError('Pensioner name is required');
      return false;
    }
    
    if (!pensionAmount || isNaN(parseFloat(pensionAmount)) || parseFloat(pensionAmount) <= 0) {
      setError('Valid pension amount is required');
      return false;
    }
    
    if (!privateKey) {
      setError('Private key is required to sign the transaction');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/admin/register-pensioner`, {
        walletAddress: pensionerWalletAddress,
        name: pensionerName,
        pensionAmount: pensionAmount,
        privateKey: privateKey
      });
      
      if (response.data.success) {
        setSuccess(true);
        setTransactionHash(response.data.transaction_hash);
        setPensionerId(response.data.pensioner_id);
        setSuccessMessage(`Pensioner registered successfully with ID: ${response.data.pensioner_id}`);
        
        // Clear form
        setPensionerWalletAddress('');
        setPensionerName('');
        setPensionAmount('');
        setPrivateKey('');
      } else {
        setError('Failed to register pensioner');
      }
    } catch (error) {
      console.error('Error registering pensioner:', error);
      setError(error.response?.data?.message || 'Error registering pensioner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Register New Pensioner
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pensioner Wallet Address"
                placeholder="0x..."
                value={pensionerWalletAddress}
                onChange={(e) => setPensionerWalletAddress(e.target.value)}
                required
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pensioner Name"
                value={pensionerName}
                onChange={(e) => setPensionerName(e.target.value)}
                required
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Monthly Pension Amount"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">ETH</InputAdornment>,
                }}
                value={pensionAmount}
                onChange={(e) => setPensionAmount(e.target.value)}
                required
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Admin Private Key"
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                required
                variant="outlined"
                helperText="Required to sign the blockchain transaction"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Register Pensioner'}
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                fullWidth
                onClick={() => navigate('/admin')}
              >
                Back to Admin Panel
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {successMessage}
          {transactionHash && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Transaction Hash: {transactionHash}
            </Typography>
          )}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminRegister; 