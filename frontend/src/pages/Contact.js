import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  ContactSupport as ContactSupportIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import { useUser } from '../contexts/UserContext';
import { toast } from 'react-toastify';

const Contact = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  
  // State
  const [formData, setFormData] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user ? user.email : '',
    subject: '',
    message: '',
    category: 'general'
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Support categories
  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'verification', label: 'Verification Issues' },
    { value: 'payment', label: 'Payment Problems' },
    { value: 'account', label: 'Account Management' }
  ];
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // In a real app, you would send this to your backend
      // For now, we'll simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      toast.success('Message sent successfully! Our support team will contact you soon.');
      
      // Reset form after success
      setFormData({
        name: user ? `${user.firstName} ${user.lastName}` : '',
        email: user ? user.email : '',
        subject: '',
        message: '',
        category: 'general'
      });
      
      // Redirect back after a delay
      setTimeout(() => {
        navigate(-1);
      }, 3000);
    } catch (error) {
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
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
  
  return (
    <>
      <Header onLogout={handleLogout} title="Contact Support" />
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Paper sx={{ p: { xs: 2, md: 4 }, boxShadow: 3, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" mb={4}>
            <ContactSupportIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h4" component="h1" fontWeight="medium">
              Contact Support
            </Typography>
          </Box>
          
          {success ? (
            <Alert 
              severity="success" 
              sx={{ mb: 2, py: 2 }}
            >
              <Typography variant="h6" gutterBottom>
                Message Sent Successfully!
              </Typography>
              <Typography variant="body1">
                Thank you for contacting us. Our support team will get back to you as soon as possible.
                You will be redirected back shortly.
              </Typography>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    error={!!errors.subject}
                    helperText={errors.subject}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Support Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    {categories.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Your Message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    error={!!errors.message}
                    helperText={errors.message}
                    multiline
                    rows={6}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} sx={{ textAlign: 'right', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(-1)}
                    sx={{ mr: 2 }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          )}
        </Paper>
        
        <Paper sx={{ p: { xs: 2, md: 3 }, mt: 4, boxShadow: 2, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Contact Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="primary">Email</Typography>
              <Typography variant="body2">support@smartpension.com</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="primary">Phone</Typography>
              <Typography variant="body2">+1-234-567-8901</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="primary">Office Hours</Typography>
              <Typography variant="body2">Monday-Friday, 9AM-5PM</Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </>
  );
};

export default Contact; 