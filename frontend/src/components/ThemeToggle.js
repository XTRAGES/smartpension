import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

const ThemeToggle = ({ darkMode, toggleDarkMode }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
        <IconButton
          onClick={toggleDarkMode}
          color="inherit"
          sx={{
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            padding: 1.5,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              transform: 'scale(1.1)',
            },
          }}
        >
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ThemeToggle; 