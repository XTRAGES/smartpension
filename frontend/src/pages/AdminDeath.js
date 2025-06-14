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
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminDeath = ({ walletAddress }) => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form fields
  const [pensionerId, setPensionerId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [transactionHash, setTransactionHash] = useState('');

  const validateForm = () => {
    if (!pensionerId || isNaN(parseInt(pensionerId)) || parseInt(pensionerId) <= 0) {
      setError('Valid pensioner ID is required');
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
      const response = await axios.post(`${API_URL}/admin/register-death`, {
        pensionerID: parseInt(pensionerId),
        privateKey: privateKey
      });
      
      if (response.data.success) {
        setSuccess(true);
        setTransactionHash(response.data.transaction_hash);
        setSuccessMessage(`Death registered successfully for pensioner ID: ${pensionerId}`);
        
        // Clear form
        setPensionerId('');
        setPrivateKey('');
      } else {
        setError('Failed to register death');
      }
    } catch (error) {
      console.error('Error registering death:', error);
      setError(error.response?.data?.message || 'Error registering death. Please try again.');
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
        Register Death
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Warning: This action is irreversible. Once registered, a pensioner's status will be permanently marked as deceased on the blockchain.
        </Alert>
        
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
                label="Pensioner ID"
                type="number"
                value={pensionerId}
                onChange={(e) => setPensionerId(e.target.value)}
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
                color="error"
                size="large"
                fullWidth
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Register Death'}
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

export default AdminDeath; 