import React from 'react';
import { useOffline } from '../contexts/OfflineContext';
import { 
  Badge, 
  Box, 
  Chip, 
  IconButton, 
  Tooltip, 
  Menu, 
  MenuItem, 
  ListItemText, 
  ListItemIcon,
  Typography,
  Button
} from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';

const OfflineStatusBadge = () => {
  const { isOnline, pendingVerifications, syncing, syncPendingVerifications, clearVerifications } = useOffline();
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleSync = () => {
    syncPendingVerifications();
  };
  
  const handleClearCompleted = () => {
    clearVerifications('completed');
  };
  
  const hasPendingVerifications = pendingVerifications.length > 0;
  
  return (
    <>
      <Tooltip 
        title={isOnline ? 'Online' : 'Offline'} 
        placement="bottom"
      >
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ m: 1 }}
        >
          <Badge
            badgeContent={hasPendingVerifications ? pendingVerifications.length : 0}
            color={isOnline ? 'success' : 'error'}
            overlap="circular"
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
          >
            {isOnline ? <WifiIcon /> : <WifiOffIcon />}
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: { 
            width: 320,
            maxHeight: 400,
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ p: 1, borderBottom: '1px solid #eee' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Connection Status
          </Typography>
          <Chip 
            icon={isOnline ? <WifiIcon /> : <WifiOffIcon />} 
            label={isOnline ? 'Online' : 'Offline'} 
            color={isOnline ? 'success' : 'error'}
            size="small"
            sx={{ m: 1 }}
          />
        </Box>
        
        {hasPendingVerifications ? (
          <>
            <Box sx={{ p: 1, borderBottom: '1px solid #eee' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Pending Verifications
                <Chip 
                  label={pendingVerifications.length} 
                  color="primary" 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
            
            {pendingVerifications.map((verification) => (
              <MenuItem 
                key={verification.id}
                sx={{ 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  borderBottom: '1px solid #f5f5f5'
                }}
              >
                <Typography variant="subtitle2" sx={{ width: '100%' }}>
                  {verification.pensionerName || 'Unknown Pensioner'}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ width: '100%' }}>
                  Queued: {format(new Date(verification.timestamp), 'MMM dd, yyyy HH:mm')}
                </Typography>
                <Typography variant="caption" color="error" sx={{ width: '100%' }}>
                  {verification.attempts > 0 ? `Failed attempts: ${verification.attempts}` : ''}
                </Typography>
              </MenuItem>
            ))}
            
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                startIcon={syncing ? <SyncProblemIcon /> : <SyncIcon />}
                variant="contained"
                color="primary"
                size="small"
                onClick={handleSync}
                disabled={!isOnline || syncing}
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              
              <Button
                startIcon={<DeleteIcon />}
                variant="outlined"
                color="error"
                size="small"
                onClick={handleClearCompleted}
              >
                Clear Completed
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              No pending verifications
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default OfflineStatusBadge; 