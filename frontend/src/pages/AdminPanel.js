import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Card, 
  CardContent,
  CardActions
} from '@mui/material';
import { Link } from 'react-router-dom';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import HistoryIcon from '@mui/icons-material/History';
import DashboardIcon from '@mui/icons-material/Dashboard';

const AdminPanel = () => {
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Panel
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Welcome to the Smart Pension Administration Panel
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This panel allows administrators to manage pensioners in the blockchain-based pension system.
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <PersonAddIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="h3" gutterBottom>
                  Register Pensioner
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add a new pensioner to the system with their wallet address and personal details.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  component={Link} 
                  to="/admin/register" 
                  variant="contained" 
                  fullWidth
                >
                  Register
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <PersonOffIcon color="error" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="h3" gutterBottom>
                  Register Death
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Register the death of a pensioner to stop their payments and update their status.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  component={Link} 
                  to="/admin/death" 
                  variant="contained" 
                  color="error"
                  fullWidth
                >
                  Register Death
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <HistoryIcon color="info" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="h3" gutterBottom>
                  View Blockchain Records
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View transaction history, verification records, and payment status on the blockchain.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  component="a" 
                  href="https://mumbai.polygonscan.com/" 
                  target="_blank"
                  variant="outlined" 
                  fullWidth
                >
                  View on Polygon Scan
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          All transactions on this panel are recorded on the Polygon Mumbai Testnet blockchain and are immutable.
        </Typography>
      </Box>
    </Box>
  );
};

export default AdminPanel; 