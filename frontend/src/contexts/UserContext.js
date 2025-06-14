import React, { createContext, useState, useEffect, useContext } from 'react';
import { useWeb3 } from './Web3Context';
import { toast } from 'react-toastify';
import axios from 'axios';

// API URL from environment or default
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create context
export const UserContext = createContext();

// User roles
export const ROLES = {
  PENSIONER: 'pensioner',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
};

// Remove static mock data for admin and doctor addresses
// Remove static mock users

export const UserProvider = ({ children }) => {
  const { account, isConnected, getPensionerIDByAddress } = useWeb3();
  
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [pensionerID, setPensionerID] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMethod, setAuthMethod] = useState(null); // 'metamask' or 'traditional'
  const [loading, setLoading] = useState(false);
  
  // Check if the connected account is an admin
  const isAdmin = (address) => {
    if (!address) return false;
    
    // Now using user's role instead of hardcoded addresses
    if (!user) return false;
    return user.role === ROLES.ADMIN;
  };
  
  // Check if the connected account is a doctor
  const isDoctor = (address) => {
    if (!address) return false;
    
    // Now using user's role instead of hardcoded addresses
    if (!user) return false;
    return user.role === ROLES.DOCTOR;
  };
  
  // Traditional login with email and password - updated to accept user data from response
  const loginWithCredentials = async (email, password, requestedRole, userData = null) => {
    try {
      setLoading(true);
      
      // If userData wasn't passed in, make API request
      if (!userData) {
        const response = await axios.post(`${API_URL}/login`, {
          email,
          password,
          role: requestedRole
        }, {
          withCredentials: true // Important for cookie-based sessions
        });
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Login failed');
        }
        
        userData = response.data.user;
      }
      
      // Set user role based on response
      const userRole = userData.role || requestedRole;
      setRole(userRole);
      setAuthMethod('traditional');
      
      // Set pensioner ID if available
      if ((userRole === ROLES.PENSIONER) && userData.pensionerID) {
        setPensionerID(userData.pensionerID);
      } else {
        setPensionerID(null);
      }
      
      // Set user data
      setUser({
        id: userData.id,
        email: userData.email,
        walletAddress: userData.walletAddress,
        role: userRole,
        name: userData.fullName || userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        pensionerID: userData.pensionerID,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      
      setIsAuthenticated(true);
      
      toast.success('Logged in successfully!');
      return true;
      
    } catch (error) {
      console.error('Login with credentials error:', error);
      toast.error(`Login failed: ${error.message || 'Invalid credentials'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Login with MetaMask wallet - updated to accept user data from response
  const login = async (userData = null) => {
    try {
      setLoading(true);
      
      if (!isConnected || !account) {
        throw new Error('Wallet not connected');
      }
      
      // If userData wasn't passed in, make API request
      if (!userData) {
        const response = await axios.post(`${API_URL}/login`, {
          walletAddress: account
        }, {
          withCredentials: true // Important for cookie-based sessions
        });
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Login failed');
        }
        
        userData = response.data.user;
      }
      
      // Set user role based on response
      const userRole = userData.role;
      
      setRole(userRole);
      setAuthMethod('metamask');
      
      // Set pensioner ID if available
      if (userRole === ROLES.PENSIONER && userData.pensionerID) {
        setPensionerID(userData.pensionerID);
      } else {
        setPensionerID(null);
      }
      
      // Set user data
      setUser({
        id: userData.id,
        walletAddress: userData.walletAddress || account,
        role: userRole,
        name: userData.fullName || userData.name || 'User',
        pensionerID: userData.pensionerID,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      
      setIsAuthenticated(true);
      
      toast.success('Logged in successfully!');
      return true;
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(`Login failed: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Register a new user
  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Make API request to backend for registration
      const response = await axios.post(`${API_URL}/register`, userData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Registration failed');
      }
      
      toast.success('Registration successful! Please log in');
      return { success: true, user: response.data.user };
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The server responded with an error status
        toast.error(`Registration failed: ${error.response.data.message || 'Server error'}`);
        return { success: false, error: error.response.data.message || 'Server error' };
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('Registration failed: No response from server. Please try again.');
        return { success: false, error: 'No response from server' };
      } else {
        // Something else caused the error
        toast.error(`Registration failed: ${error.message}`);
        return { success: false, error: error.message };
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Call logout API to clear server-side session
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out from server:', error);
    } finally {
      // Clear client-side state regardless of server response
      setUser(null);
      setRole(null);
      setPensionerID(null);
      setIsAuthenticated(false);
      setAuthMethod(null);
      
      // Clear local storage
      localStorage.removeItem('userAddress');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('pensionerID');
      localStorage.removeItem('authMethod');
    }
  };
  
  // Check if user has a specific role
  const hasRole = (requiredRole) => {
    return role === requiredRole;
  };
  
  // Check stored user on mount and when account changes
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        // Try to get current user session from backend
        const response = await axios.get(`${API_URL}/user`, { 
          withCredentials: true 
        });
        
        if (response.data.success && response.data.user) {
          const userData = response.data.user;
          
          setUser(userData);
          setRole(userData.role);
          
          if (userData.role === ROLES.PENSIONER && userData.pensionerID) {
            setPensionerID(userData.pensionerID);
          }
          
          setIsAuthenticated(true);
          setAuthMethod(response.data.authMethod || 'traditional');
          return;
        }
      } catch (error) {
        console.error('Error checking session:', error);
        
        // Clear any invalid session data
        setUser(null);
        setRole(null);
        setPensionerID(null);
        setIsAuthenticated(false);
        setAuthMethod(null);
      }
    };
    
    checkStoredUser();
  }, [account, isConnected]);
  
  return (
    <UserContext.Provider
      value={{
        user,
        role,
        pensionerID,
        isAuthenticated,
        authMethod,
        loading,
        login,
        loginWithCredentials,
        logout,
        register,
        hasRole,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use User context
export const useUser = () => useContext(UserContext); 