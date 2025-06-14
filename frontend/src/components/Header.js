import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Divider,
  ListItemIcon,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Dashboard,
  AccountBalanceWallet,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useUser, ROLES } from '../contexts/UserContext';
import { useWeb3 } from '../contexts/Web3Context';
import OfflineStatusBadge from './OfflineStatusBadge';

const Header = ({ title, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, isAuthenticated } = useUser();
  const { account, balance, isCorrectNetwork, chainId, switchNetwork } = useWeb3();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMenuAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    if (onLogout) {
      onLogout();
    }
  };

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  // Get the dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!role) return '/';
    
    switch (role) {
      case ROLES.PENSIONER:
        return '/pensioner-dashboard';
      case ROLES.ADMIN:
        return '/admin-dashboard';
      case ROLES.DOCTOR:
        return '/doctor-dashboard';
      default:
        return '/';
    }
  };

  const getColorForRole = () => {
    if (!role) return 'primary.main';
    
    switch (role) {
      case ROLES.PENSIONER:
        return 'primary.main';
      case ROLES.ADMIN:
        return 'secondary.main';
      case ROLES.DOCTOR:
        return '#2e7d32'; // Green
      default:
        return 'primary.main';
    }
  };

  // Get network name based on chain ID
  const getNetworkName = () => {
    if (!chainId) return 'Unknown Network';
    
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 11155111:
        return 'Sepolia Testnet';
      case 31337:
      case 1337:
        return 'Local Network';
      default:
        return `Network ID: ${chainId}`;
    }
  };
  
  // Handle network switch
  const handleSwitchNetwork = async () => {
    if (switchNetwork) {
      await switchNetwork();
    }
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo and Title - Mobile Menu */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, alignItems: 'center' }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold' }}
            >
              {title || 'Smart Pension'}
            </Typography>
          </Box>
          
          {/* Logo and Title - Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1, alignItems: 'center' }}>
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => navigate(getDashboardUrl())}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="Smart Pension Logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'%3E%3Cpath fill='%231976d2' d='M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8z'/%3E%3C/svg%3E";
                }}
                sx={{ 
                  height: 40,
                  mr: 1,
                  display: 'flex'  // Show the logo
                }}
              />
              Smart Pension
            </Typography>
            
            {/* Desktop Navigation Links */}
            {isAuthenticated && (
              <Box sx={{ ml: 4 }}>
                <Button
                  color="inherit"
                  onClick={() => navigate(getDashboardUrl())}
                  sx={{ 
                    mx: 1,
                    fontWeight: location.pathname === getDashboardUrl() ? 'bold' : 'normal',
                    borderBottom: location.pathname === getDashboardUrl() ? 2 : 0,
                    borderColor: 'primary.main',
                    borderRadius: 0,
                    pb: 0.5,
                  }}
                >
                  Dashboard
                </Button>
                
                {role === ROLES.PENSIONER && (
                  <Button
                    color="inherit"
                    onClick={() => navigate(`/verification/${user?.pensionerID}`)}
                    sx={{ 
                      mx: 1,
                      fontWeight: location.pathname.includes('/verification') ? 'bold' : 'normal',
                      borderBottom: location.pathname.includes('/verification') ? 2 : 0,
                      borderColor: 'primary.main',
                      borderRadius: 0,
                      pb: 0.5,
                    }}
                  >
                    Verification
                  </Button>
                )}
                
                {role === ROLES.ADMIN && (
                  <Button
                    color="inherit"
                    onClick={() => navigate('/register-pensioner')}
                    sx={{ 
                      mx: 1,
                      fontWeight: location.pathname === '/register-pensioner' ? 'bold' : 'normal',
                      borderBottom: location.pathname === '/register-pensioner' ? 2 : 0,
                      borderColor: 'primary.main',
                      borderRadius: 0,
                      pb: 0.5,
                    }}
                  >
                    Register Pensioner
                  </Button>
                )}
                
                {role === ROLES.DOCTOR && (
                  <Button
                    color="inherit"
                    onClick={() => navigate('/register-death')}
                    sx={{ 
                      mx: 1,
                      fontWeight: location.pathname === '/register-death' ? 'bold' : 'normal',
                      borderBottom: location.pathname === '/register-death' ? 2 : 0,
                      borderColor: 'primary.main',
                      borderRadius: 0,
                      pb: 0.5,
                    }}
                  >
                    Register Death
                  </Button>
                )}
              </Box>
            )}
          </Box>
          
          {/* Mobile Menu */}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <MenuItem onClick={() => handleNavigate(getDashboardUrl())}>
              <ListItemIcon>
                <Dashboard fontSize="small" />
              </ListItemIcon>
              Dashboard
            </MenuItem>
            
            {role === ROLES.PENSIONER && (
              <MenuItem onClick={() => handleNavigate(`/verification/${user?.pensionerID}`)}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Verification
              </MenuItem>
            )}
            
            {role === ROLES.ADMIN && (
              <MenuItem onClick={() => handleNavigate('/register-pensioner')}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Register Pensioner
              </MenuItem>
            )}
            
            {role === ROLES.DOCTOR && (
              <MenuItem onClick={() => handleNavigate('/register-death')}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Register Death
              </MenuItem>
            )}
            
            <Divider />
            
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
          
          {/* User Profile and Account Balance */}
          {isAuthenticated && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Offline Status Badge */}
              <OfflineStatusBadge />
              
              {/* Network Status Indicator */}
              <Tooltip title={isCorrectNetwork ? 'Connected to correct network' : 'Wrong network. Click to switch'}>
                <Chip
                  icon={isCorrectNetwork ? <CheckCircle /> : <Warning />}
                  label={getNetworkName()}
                  color={isCorrectNetwork ? 'success' : 'warning'}
                  variant="outlined"
                  size="small"
                  onClick={!isCorrectNetwork ? handleSwitchNetwork : undefined}
                  clickable={!isCorrectNetwork}
                  sx={{
                    mr: 2,
                    display: { xs: 'none', md: 'flex' },
                    '&:hover': !isCorrectNetwork ? {
                      bgcolor: 'rgba(255, 152, 0, 0.1)',
                    } : {},
                  }}
                />
              </Tooltip>
              
              {balance && (
                <Chip 
                  icon={<AccountBalanceWallet />} 
                  label={`${parseFloat(balance).toFixed(4)} ETH`}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    mr: 2, 
                    display: { xs: 'none', sm: 'flex' },
                    border: 1,
                    borderColor: 'divider',
                  }}
                />
              )}
              
              <Box>
                <Chip
                  avatar={
                    <Avatar 
                      sx={{ 
                        bgcolor: getColorForRole(),
                      }}
                    >
                      {role?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  }
                  label={role?.charAt(0).toUpperCase() + role?.slice(1) || 'User'}
                  onClick={handleProfileMenuOpen}
                  sx={{ 
                    fontWeight: 'medium',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                />
              </Box>
            </Box>
          )}
          
          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              elevation: 3,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1.5,
                minWidth: 200,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => handleNavigate(getDashboardUrl())}>
              <ListItemIcon>
                <Dashboard fontSize="small" />
              </ListItemIcon>
              Dashboard
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 