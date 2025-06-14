import React from 'react';
import { Box, Typography, Link as MuiLink } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} Smart Pension System | 
        Using AI and Blockchain for Pension Verification
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Running on Polygon Mumbai Testnet
      </Typography>
    </Box>
  );
};

export default Footer; 