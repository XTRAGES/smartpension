import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  TablePagination,
  Tooltip,
  CircularProgress,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import Group from '@mui/icons-material/Group';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Analytics from '@mui/icons-material/Analytics';
import Error from '@mui/icons-material/Error';
import Search from '@mui/icons-material/Search';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Logout from '@mui/icons-material/Logout';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import MoreVert from '@mui/icons-material/MoreVert';
import Visibility from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import BlockIcon from '@mui/icons-material/Block';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import PeopleIcon from '@mui/icons-material/People';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import { format } from 'date-fns';
import { useWeb3 } from '../contexts/Web3Context';
import { useUser } from '../contexts/UserContext';
import { usePensioners } from '../contexts/PensionerContext';
import Header from '../components/Header';
import { toast } from 'react-toastify';

// StatsCard component for dashboard statistics
const StatsCard = ({ title, value, color, icon }) => (
  <Grid item xs={6} sm={3}>
    <Box 
      sx={{ 
        p: 2, 
        borderRadius: 1, 
        boxShadow: 1,
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <Box display="flex" alignItems="center" mb={1}>
        <Box sx={{ color, mr: 1 }}>
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" fontWeight="bold">
        {value}
      </Typography>
    </Box>
  </Grid>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useUser();
  const { 
    isConnected, 
    contract, 
    balance, 
    connectWallet, 
    loading: web3Loading 
  } = useWeb3();
  const { 
    pensioners, 
    loading: pensionersLoading,
    error: pensionersError 
  } = usePensioners();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredPensioners, setFilteredPensioners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [blockchainStats, setBlockchainStats] = useState(null);
  
  // Fetch data from blockchain when contract is available
  useEffect(() => {
    const fetchBlockchainStats = async () => {
      if (!contract) return;
      
      try {
        // Call contract methods to get statistics
        const totalPensionersContract = await contract.totalPensioners();
        
        // Store blockchain stats
        setBlockchainStats({
          totalPensioners: totalPensionersContract.toNumber(),
        });
      } catch (err) {
        console.error('Error fetching blockchain stats:', err);
        // Continue using context data if blockchain fails
      }
    };
    
    fetchBlockchainStats();
  }, [contract]);
  
  // Calculate days since last verification
  const calculateDaysSinceVerification = (lastVerificationDate) => {
    if (!lastVerificationDate) return 0;
    
    const now = new Date();
    const lastVerification = lastVerificationDate instanceof Date 
      ? lastVerificationDate 
      : new Date(lastVerificationDate);
      
    const diffTime = Math.abs(now - lastVerification);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalPensioners = blockchainStats?.totalPensioners || pensioners.length;
    const activePensioners = pensioners.filter(p => p.isActive).length;
    const inactivePensioners = pensioners.filter(p => !p.isActive && !p.isDeceased).length;
    const deceasedPensioners = pensioners.filter(p => p.isDeceased).length;
    
    // Calculate total monthly pension amount
    const totalAmountMonthly = pensioners
      .filter(p => p.isActive)
      .reduce((sum, p) => sum + parseFloat(p.pensionAmount), 0)
      .toFixed(2);
      
    // Calculate verification alerts
    const alertsCount = pensioners.filter(p => {
      // Not deceased, but needs verification (last verification > 150 days ago)
      // Add null check for p.isDeceased and p.lastVerificationDate
      return p && p.isDeceased !== true && 
        p.lastVerificationDate && calculateDaysSinceVerification(p.lastVerificationDate) > 150;
    }).length;
    
    // Calculate verification rate
    const eligiblePensioners = pensioners.filter(p => p && p.isDeceased !== true).length;
    const verifiedPensioners = pensioners.filter(p => 
      p && p.isDeceased !== true && p.lastVerificationDate && 
      calculateDaysSinceVerification(p.lastVerificationDate) <= 180
    ).length;
    
    const verificationRate = eligiblePensioners > 0 
      ? Math.round((verifiedPensioners / eligiblePensioners) * 100) 
      : 100;
      
    return {
      totalPensioners,
      activePensioners,
      inactivePensioners,
      deceasedPensioners,
      totalAmountMonthly,
      verificationRate,
      alertsCount,
    };
  }, [pensioners, blockchainStats, calculateDaysSinceVerification]);
  
  // Initialize filtered pensioners when data loads
  useEffect(() => {
    if (pensioners) {
      setFilteredPensioners(pensioners);
      setLoading(false);
    }
  }, [pensioners]);
  
  // Handle error from pensioner context
  useEffect(() => {
    if (pensionersError) {
      setError(pensionersError);
    }
  }, [pensionersError]);
  
  // Filter pensioners based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPensioners(pensioners);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = pensioners.filter(
      pensioner =>
        (pensioner.name?.toLowerCase().includes(searchTermLower)) ||
        `${pensioner.firstName || ''} ${pensioner.lastName || ''}`.toLowerCase().includes(searchTermLower) ||
        (pensioner.wallet?.toLowerCase().includes(searchTermLower)) ||
        (pensioner.id !== null && pensioner.id !== undefined && pensioner.id.toString().includes(searchTermLower))
    );
    
    setFilteredPensioners(filtered);
    setPage(0); // Reset to first page on search
  }, [searchTerm, pensioners]);
  
  // Sort pensioners
  useEffect(() => {
    const sortedPensioners = [...filteredPensioners].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'id':
          // Handle null IDs
          if (a.id === null || a.id === undefined) return 1;
          if (b.id === null || b.id === undefined) return -1;
          comparison = a.id - b.id;
          break;
        case 'name':
          // Handle null names
          const nameA = (a.name || `${a.firstName || ''} ${a.lastName || ''}`).trim();
          const nameB = (b.name || `${b.firstName || ''} ${b.lastName || ''}`).trim();
          if (!nameA) return 1;
          if (!nameB) return -1;
          comparison = nameA.localeCompare(nameB);
          break;
        case 'pensionAmount':
          // Handle null pension amounts
          const amountA = parseFloat(a.pensionAmount || 0);
          const amountB = parseFloat(b.pensionAmount || 0);
          comparison = amountA - amountB;
          break;
        case 'lastVerificationDate':
          // Handle null dates
          if (!a.lastVerificationDate) return 1;
          if (!b.lastVerificationDate) return -1;
          const dateA = new Date(a.lastVerificationDate);
          const dateB = new Date(b.lastVerificationDate);
          comparison = dateA - dateB;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredPensioners(sortedPensioners);
  }, [sortField, sortDirection]);
  
  // Handle sort change
  const handleRequestSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle register new pensioner
  const handleRegisterPensioner = () => {
    navigate('/register-pensioner');
  };
  
  // Function to reset data for debugging
  const handleResetData = () => {
    if (window.confirm('This will clear all current pensioner data and reset to initial data. Continue?')) {
      localStorage.removeItem('pensioners');
      window.location.reload();
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Get status color
  const getStatusColor = (pensioner) => {
    if (pensioner.isDeceased) return 'error';
    if (!pensioner.isActive) return 'warning';
    return 'success';
  };
  
  // Get status label
  const getStatusLabel = (pensioner) => {
    if (pensioner.isDeceased) return 'Deceased';
    if (!pensioner.isActive) return 'Inactive';
    return 'Active';
  };
  
  // Format pensioner name
  const getPensionerName = (pensioner) => {
    if (pensioner.name) return pensioner.name;
    return `${pensioner.firstName} ${pensioner.lastName}`;
  };
  
  // Handle verifying a pensioner
  const handleVerifyPensioner = async (pensioner) => {
    if (!contract) {
      toast.error('Blockchain connection not available');
      return;
    }
    
    if (!pensioner || !pensioner.id) {
      toast.error('Invalid pensioner ID');
      return;
    }
    
    try {
      setLoading(true);
      
      // Ensure pensioner ID is a valid number
      const pensionerID = parseInt(pensioner.id, 10);
      if (isNaN(pensionerID)) {
        throw new Error('Pensioner ID is not a valid number');
      }
      
      // Call the smart contract to verify the pensioner
      const tx = await contract.verifyPensioner(pensionerID);
      await tx.wait();
      
      // Update in context after blockchain verification
      await pensioners.verifyPensioner(pensionerID);
      
      toast.success(`Successfully verified ${pensioner.name}`);
    } catch (error) {
      console.error('Error verifying pensioner:', error);
      toast.error('Failed to verify pensioner: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle registering a death
  const handleRegisterDeath = async (pensioner) => {
    if (!contract) {
      toast.error('Blockchain connection not available');
      return;
    }
    
    if (!pensioner || !pensioner.id) {
      toast.error('Invalid pensioner ID');
      return;
    }
    
    // Confirm with the admin before proceeding
    if (!window.confirm(`Are you sure you want to register ${pensioner.name} as deceased?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Ensure pensioner ID is a valid number
      const pensionerID = parseInt(pensioner.id, 10);
      if (isNaN(pensionerID)) {
        throw new Error('Pensioner ID is not a valid number');
      }
      
      // Call the smart contract to register the death
      const tx = await contract.registerDeath(pensionerID);
      await tx.wait();
      
      // Update in context after blockchain update
      await pensioners.registerDeath(pensionerID);
      
      toast.success(`Successfully registered death for ${pensioner.name}`);
    } catch (error) {
      console.error('Error registering death:', error);
      toast.error('Failed to register death: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle blocking/unblocking payments
  const handleTogglePaymentStatus = async (pensioner) => {
    if (!contract) {
      toast.error('Blockchain connection not available');
      return;
    }
    
    if (!pensioner || !pensioner.id) {
      toast.error('Invalid pensioner ID');
      return;
    }
    
    const action = pensioner.isActive ? 'block' : 'unblock';
    
    try {
      setLoading(true);
      
      // Ensure pensioner ID is a valid number
      const pensionerID = parseInt(pensioner.id, 10);
      if (isNaN(pensionerID)) {
        throw new Error('Pensioner ID is not a valid number');
      }
      
      // Call the smart contract to toggle payment status
      let tx;
      if (pensioner.isActive) {
        tx = await contract.blockPayments(pensionerID);
      } else {
        tx = await contract.unblockPayments(pensionerID);
      }
      await tx.wait();
      
      // Update in context after blockchain update
      await pensioners.togglePensionerStatus(pensionerID);
      
      toast.success(`Successfully ${action}ed payments for ${pensioner.name}`);
    } catch (error) {
      console.error(`Error ${action}ing payments:`, error);
      toast.error(`Failed to ${action} payments: ` + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a function to handle wallet connection
  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      const success = await connectWallet();
      if (success) {
        toast.success('Connected to wallet successfully');
      } else {
        toast.error('Failed to connect to wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect to wallet: ' + error.message);
      setError('Failed to connect to wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Header title="Admin Dashboard" onLogout={handleLogout} />
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Main Content */}
        <Box flex={1} p={3} sx={{ overflowY: 'auto' }}>
          {loading || pensionersLoading ? (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              height="100%"
            >
              <CircularProgress />
              <Typography variant="h6" ml={2}>
                Loading dashboard data...
              </Typography>
            </Box>
          ) : error || pensionersError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || pensionersError}
            </Alert>
          ) : (
            <>
              {/* Dashboard Stats & Widgets */}
              <Grid container spacing={3} mb={4}>
                {/* Overview Stats */}
                <Grid item xs={12} lg={8}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Overview
                    </Typography>
                    <Grid container spacing={2}>
                      <StatsCard
                        title="Total Pensioners"
                        value={stats.totalPensioners}
                        color="primary.main"
                        icon={<PeopleIcon />}
                      />
                      <StatsCard
                        title="Active Pensioners"
                        value={stats.activePensioners}
                        color="success.main"
                        icon={<CheckCircleIcon />}
                      />
                      <StatsCard
                        title="Inactive Pensioners"
                        value={stats.inactivePensioners}
                        color="warning.main"
                        icon={<PauseCircleFilledIcon />}
                      />
                      <StatsCard
                        title="Deceased"
                        value={stats.deceasedPensioners}
                        color="text.secondary"
                        icon={<PersonOffIcon />}
                      />
                    </Grid>
                  </Paper>
                </Grid>

                {/* Connection Status */}
                <Grid item xs={12} lg={4}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Blockchain Connection
                    </Typography>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box 
                        sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          bgcolor: isConnected ? 'success.main' : 'error.main',
                          mr: 1
                        }} 
                      />
                      <Typography>
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </Typography>
                    </Box>
                    {isConnected && balance && (
                      <Typography variant="body2" color="text.secondary">
                        Balance: {parseFloat(balance).toFixed(4)} ETH
                      </Typography>
                    )}
                    {contract && (
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                        Contract: {contract.address}
                      </Typography>
                    )}
                    
                    {!isConnected && (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleConnectWallet} 
                        disabled={web3Loading || loading}
                        sx={{ mt: 2 }}
                        startIcon={web3Loading || loading ? <CircularProgress size={20} /> : null}
                      >
                        {web3Loading || loading ? 'Connecting...' : 'Connect Wallet'}
                      </Button>
                    )}
                  </Paper>
                </Grid>
              </Grid>

              {/* Actions */}
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" component="h2">
                  Pensioners
                </Typography>
                
                <Box>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleRegisterPensioner}
                    sx={{ mr: 2 }}
                  >
                    Register New Pensioner
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => window.location.reload()}
                    sx={{ mr: 2 }}
                  >
                    Refresh
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleResetData}
                    size="small"
                  >
                    Reset Data
                  </Button>
                </Box>
              </Box>
              
              {/* Search and Filter */}
              <Paper sx={{ p: 2, mb: 4 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Search Pensioners"
                      variant="outlined"
                      size="small"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={8} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Chip 
                      label="All Pensioners" 
                      color="primary" 
                      variant="outlined" 
                      onClick={() => setFilteredPensioners(pensioners)} 
                    />
                    <Chip 
                      label="Active Only" 
                      color="success" 
                      variant="outlined" 
                      onClick={() => setFilteredPensioners(pensioners.filter(p => p.isActive))} 
                    />
                    <Chip 
                      label="Inactive" 
                      color="warning" 
                      variant="outlined" 
                      onClick={() => setFilteredPensioners(pensioners.filter(p => !p.isActive && !p.isDeceased))} 
                    />
                    <Chip 
                      label="Deceased" 
                      color="error" 
                      variant="outlined" 
                      onClick={() => setFilteredPensioners(pensioners.filter(p => p.isDeceased))} 
                    />
                    <Chip 
                      label="Needs Verification" 
                      color="secondary" 
                      variant="outlined" 
                      onClick={() => {
                        const now = new Date();
                        setFilteredPensioners(pensioners.filter(p => {
                          if (!p || !p.lastVerificationDate) return false;
                          const lastVerification = new Date(p.lastVerificationDate);
                          const diffDays = Math.ceil((now - lastVerification) / (1000 * 60 * 60 * 24));
                          return diffDays > 170 && !p.isDeceased;
                        }));
                      }} 
                    />
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Pensioners Table */}
              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Box 
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleRequestSort('id')}
                          >
                            ID
                            {sortField === 'id' && (
                              sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box 
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleRequestSort('name')}
                          >
                            Name
                            {sortField === 'name' && (
                              sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>Wallet Address</TableCell>
                        <TableCell>
                          <Box 
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleRequestSort('pensionAmount')}
                          >
                            Pension (ETH)
                            {sortField === 'pensionAmount' && (
                              sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box 
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleRequestSort('lastVerificationDate')}
                          >
                            Last Verification
                            {sortField === 'lastVerificationDate' && (
                              sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading || pensionersLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            <CircularProgress />
                          </TableCell>
                        </TableRow>
                      ) : filteredPensioners.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            No pensioners found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPensioners
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((pensioner) => (
                            <TableRow key={pensioner.id} hover>
                              <TableCell>{pensioner.id}</TableCell>
                              <TableCell>{getPensionerName(pensioner)}</TableCell>
                              <TableCell>
                                <Tooltip title={pensioner.wallet || pensioner.walletAddress || 'No wallet address'}>
                                  <span>
                                    {(pensioner.wallet || pensioner.walletAddress) ? 
                                      `${(pensioner.wallet || pensioner.walletAddress).substring(0, 10)}...${(pensioner.wallet || pensioner.walletAddress).substring((pensioner.wallet || pensioner.walletAddress).length - 4)}` : 
                                      'No wallet address'
                                    }
                                  </span>
                                </Tooltip>
                              </TableCell>
                              <TableCell>{pensioner.pensionAmount}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  {pensioner.lastVerificationDate ? 
                                    format(
                                      pensioner.lastVerificationDate instanceof Date 
                                        ? pensioner.lastVerificationDate 
                                        : new Date(pensioner.lastVerificationDate), 
                                      'MMM dd, yyyy'
                                    ) : 
                                    'Never verified'
                                  }
                                  <Typography variant="caption" color="text.secondary">
                                    {pensioner.lastVerificationDate ? 
                                      `${calculateDaysSinceVerification(pensioner.lastVerificationDate)} days ago` : 
                                      'N/A'
                                    }
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  icon={
                                    pensioner.isDeceased ? <PersonOffIcon /> :
                                    pensioner.isActive ? <CheckCircleIcon /> : <WarningIcon />
                                  }
                                  label={getStatusLabel(pensioner)} 
                                  color={
                                    pensioner.isDeceased ? 'default' :
                                    pensioner.isActive ? 'success' : 'warning'
                                  }
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="View Details">
                                  <IconButton size="small" onClick={() => navigate(`/pensioner/${pensioner.id}`)}>
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="More Actions">
                                  <IconButton size="small">
                                    <MoreVert fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <IconButton 
                                  aria-label="Verify Pensioner"
                                  color="success"
                                  onClick={() => handleVerifyPensioner(pensioner)}
                                  disabled={pensioner.isDeceased || loading}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                                <IconButton 
                                  aria-label="Register Death" 
                                  color="error"
                                  onClick={() => handleRegisterDeath(pensioner)}
                                  disabled={pensioner.isDeceased || loading}
                                >
                                  <PersonOffIcon />
                                </IconButton>
                                <IconButton 
                                  aria-label={pensioner.isActive ? "Block Payments" : "Unblock Payments"}
                                  color={pensioner.isActive ? "warning" : "primary"}
                                  onClick={() => handleTogglePaymentStatus(pensioner)}
                                  disabled={pensioner.isDeceased || loading}
                                >
                                  {pensioner.isActive ? <BlockIcon /> : <PlayCircleFilledIcon />}
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={filteredPensioners.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </Paper>
            </>
          )}
        </Box>
      </Container>
    </>
  );
};

export default AdminDashboard; 