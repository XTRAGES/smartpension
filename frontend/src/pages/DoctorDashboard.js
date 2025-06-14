import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Warning,
  Visibility,
  HourglassEmpty,
  Assignment,
  Verified,
  PersonOff,
  ArrowUpward,
  ArrowDownward,
  Receipt,
  MedicalServices,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useWeb3 } from '../contexts/Web3Context';
import { useUser } from '../contexts/UserContext';
import Header from '../components/Header';

// Mock data for demo purposes
const MOCK_STATS = {
  totalPendingVerifications: 12,
  totalCompletedToday: 7,
  activeVerifications: 2,
  averageVerificationTime: 8.5,
};

// Mock data for verification requests
const generateMockVerifications = (count) => {
  const result = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const requestedDaysAgo = Math.floor(Math.random() * 14); // 0-14 days ago
    const requestDate = new Date();
    requestDate.setDate(now.getDate() - requestedDaysAgo);
    
    const isCompleted = Math.random() < 0.4; // 40% completed
    const isInProgress = !isCompleted && Math.random() < 0.3; // 30% of remaining in progress
    
    const completionDate = isCompleted ? new Date(requestDate.getTime() + Math.random() * 86400000 * 3) : null; // 0-3 days after request
    
    const urgencyScore = isCompleted ? 0 : Math.min(100, requestedDaysAgo * 7 + Math.floor(Math.random() * 20));
    
    result.push({
      id: i + 1,
      pensionerId: Math.floor(Math.random() * 500) + 1,
      pensionerName: `Pensioner ${Math.floor(Math.random() * 500) + 1}`,
      requestDate,
      urgencyScore,
      isCompleted,
      isInProgress,
      completionDate,
      notes: isCompleted ? 'Verification completed successfully' : '',
    });
  }
  
  return result;
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useUser();
  const { account, isConnected } = useWeb3();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifications, setVerifications] = useState([]);
  const [filteredVerifications, setFilteredVerifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('urgencyScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deathReportDialogOpen, setDeathReportDialogOpen] = useState(false);
  
  // Load verifications data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // In a real app, we would fetch data from the blockchain
        // For demo purposes, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading delay
        
        const mockData = generateMockVerifications(30);
        setVerifications(mockData);
        setFilteredVerifications(mockData);
      } catch (error) {
        console.error('Error loading verifications:', error);
        setError('Failed to load verification data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Filter verifications based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVerifications(verifications);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = verifications.filter(
      verification =>
        verification.pensionerName.toLowerCase().includes(searchTermLower) ||
        verification.pensionerId.toString().includes(searchTermLower) ||
        verification.id.toString().includes(searchTermLower)
    );
    
    setFilteredVerifications(filtered);
    setPage(0); // Reset to first page on search
  }, [searchTerm, verifications]);
  
  // Sort verifications
  useEffect(() => {
    const sortedVerifications = [...filteredVerifications].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'pensionerId':
          comparison = a.pensionerId - b.pensionerId;
          break;
        case 'pensionerName':
          comparison = a.pensionerName.localeCompare(b.pensionerName);
          break;
        case 'requestDate':
          comparison = new Date(a.requestDate) - new Date(b.requestDate);
          break;
        case 'urgencyScore':
          comparison = a.urgencyScore - b.urgencyScore;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredVerifications(sortedVerifications);
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
  
  // Handle verification start
  const handleStartVerification = (verification) => {
    setSelectedVerification(verification);
    navigate(`/verification/${verification.pensionerId}`);
  };
  
  // Handle verification complete
  const handleCompleteVerification = (verification) => {
    setSelectedVerification(verification);
    setConfirmDialogOpen(true);
  };
  
  // Handle death report
  const handleDeathReport = (verification) => {
    setSelectedVerification(verification);
    setDeathReportDialogOpen(true);
  };
  
  // Confirm verification
  const confirmVerification = async () => {
    try {
      // In a real app, we would call a smart contract
      setConfirmDialogOpen(false);
      
      // Update local state for demo
      const updatedVerifications = verifications.map(v => 
        v.id === selectedVerification.id 
          ? { ...v, isCompleted: true, isInProgress: false, completionDate: new Date(), notes: 'Verification completed successfully' } 
          : v
      );
      setVerifications(updatedVerifications);
      setFilteredVerifications(updatedVerifications);
    } catch (error) {
      console.error('Error confirming verification:', error);
    }
  };
  
  // Confirm death report
  const confirmDeathReport = async () => {
    try {
      // In a real app, we would call a smart contract
      setDeathReportDialogOpen(false);
      
      // Update local state for demo
      const updatedVerifications = verifications.map(v => 
        v.id === selectedVerification.id 
          ? { ...v, isCompleted: true, isInProgress: false, completionDate: new Date(), notes: 'Death reported and confirmed' } 
          : v
      );
      setVerifications(updatedVerifications);
      setFilteredVerifications(updatedVerifications);
    } catch (error) {
      console.error('Error confirming death:', error);
    }
  };
  
  // Get urgency level
  const getUrgencyLevel = (urgencyScore) => {
    if (urgencyScore >= 70) return { color: 'error', label: 'High' };
    if (urgencyScore >= 40) return { color: 'warning', label: 'Medium' };
    return { color: 'success', label: 'Low' };
  };
  
  // Get status
  const getStatus = (verification) => {
    if (verification.isCompleted) return { icon: <CheckCircle />, label: 'Completed', color: 'success' };
    if (verification.isInProgress) return { icon: <HourglassEmpty />, label: 'In Progress', color: 'info' };
    return { icon: <Warning />, label: 'Pending', color: 'warning' };
  };
  
  return (
    <>
      <Header title="Doctor Dashboard" onLogout={logout} />
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Overview Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Pending Verifications */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pending Verifications
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assignment sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                  <Typography variant="h4" component="div">
                    {loading ? <CircularProgress size={24} /> : MOCK_STATS.totalPendingVerifications}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Completed Today */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Completed Today
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Verified sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                  <Typography variant="h4" component="div">
                    {loading ? <CircularProgress size={24} /> : MOCK_STATS.totalCompletedToday}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Active Verifications */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  In Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <HourglassEmpty sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                  <Typography variant="h4" component="div">
                    {loading ? <CircularProgress size={24} /> : MOCK_STATS.activeVerifications}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Average Time */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Avg. Time (min)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MedicalServices sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Typography variant="h4" component="div">
                    {loading ? <CircularProgress size={24} /> : MOCK_STATS.averageVerificationTime}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Search and Filter */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search Verifications"
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
                label="All Verifications" 
                color="primary" 
                variant="outlined" 
                onClick={() => setFilteredVerifications(verifications)} 
              />
              <Chip 
                label="Pending" 
                color="warning" 
                variant="outlined" 
                onClick={() => setFilteredVerifications(verifications.filter(v => !v.isCompleted && !v.isInProgress))} 
              />
              <Chip 
                label="In Progress" 
                color="info" 
                variant="outlined" 
                onClick={() => setFilteredVerifications(verifications.filter(v => !v.isCompleted && v.isInProgress))} 
              />
              <Chip 
                label="Completed" 
                color="success" 
                variant="outlined" 
                onClick={() => setFilteredVerifications(verifications.filter(v => v.isCompleted))} 
              />
              <Chip 
                label="High Urgency" 
                color="error" 
                variant="outlined" 
                onClick={() => setFilteredVerifications(verifications.filter(v => v.urgencyScore >= 70 && !v.isCompleted))} 
              />
            </Grid>
          </Grid>
        </Paper>
        
        {/* Verifications Table */}
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
                      onClick={() => handleRequestSort('pensionerId')}
                    >
                      Pensioner ID
                      {sortField === 'pensionerId' && (
                        sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box 
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => handleRequestSort('pensionerName')}
                    >
                      Name
                      {sortField === 'pensionerName' && (
                        sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box 
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => handleRequestSort('requestDate')}
                    >
                      Requested
                      {sortField === 'requestDate' && (
                        sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box 
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => handleRequestSort('urgencyScore')}
                    >
                      Urgency
                      {sortField === 'urgencyScore' && (
                        sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredVerifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      No verifications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVerifications
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((verification) => {
                      const urgency = getUrgencyLevel(verification.urgencyScore);
                      const status = getStatus(verification);
                      
                      return (
                        <TableRow key={verification.id} hover>
                          <TableCell>{verification.id}</TableCell>
                          <TableCell>{verification.pensionerId}</TableCell>
                          <TableCell>{verification.pensionerName}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              {format(new Date(verification.requestDate), 'MMM dd, yyyy')}
                              <Typography variant="caption" color="text.secondary">
                                {verification.isCompleted && verification.completionDate
                                  ? `Completed: ${format(new Date(verification.completionDate), 'MMM dd, yyyy')}`
                                  : ''}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {verification.isCompleted ? (
                              <Chip 
                                label="Completed"
                                color="default"
                                size="small"
                              />
                            ) : (
                              <Chip 
                                label={`${urgency.label} (${verification.urgencyScore})`}
                                color={urgency.color}
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              icon={status.icon}
                              label={status.label}
                              color={status.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {verification.isCompleted ? (
                              <Tooltip title="View Details">
                                <IconButton size="small">
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <>
                                <Tooltip title="Start Verification">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => handleStartVerification(verification)}
                                  >
                                    <Verified fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Confirm Life Status">
                                  <IconButton 
                                    size="small" 
                                    color="success"
                                    onClick={() => handleCompleteVerification(verification)}
                                  >
                                    <CheckCircle fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Report Death">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDeathReport(verification)}
                                  >
                                    <PersonOff fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredVerifications.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Container>
      
      {/* Confirm Verification Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Verification</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to confirm that {selectedVerification?.pensionerName} is alive? This action will update their verification status on the blockchain.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmVerification} variant="contained" color="primary">Confirm</Button>
        </DialogActions>
      </Dialog>
      
      {/* Death Report Dialog */}
      <Dialog
        open={deathReportDialogOpen}
        onClose={() => setDeathReportDialogOpen(false)}
      >
        <DialogTitle>Report Death</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you confirming that {selectedVerification?.pensionerName} is deceased? This is a serious action that will stop pension payments and require official death certificate processing.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeathReportDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeathReport} variant="contained" color="error">Confirm Death</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DoctorDashboard; 