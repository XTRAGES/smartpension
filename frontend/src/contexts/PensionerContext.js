import React, { createContext, useState, useContext, useEffect } from 'react';
import { useWeb3 } from './Web3Context';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useUser } from './UserContext';

// Create context
export const PensionerContext = createContext();

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Initial mock data - used as fallback if API fails
const generateInitialPensioners = (count = 10) => {
  const result = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const lastVerificationDays = Math.floor(Math.random() * 200);
    const lastVerification = new Date();
    lastVerification.setDate(now.getDate() - lastVerificationDays);
    
    const isDeceased = Math.random() < 0.05; // 5% chance of being deceased
    const isActive = !isDeceased && lastVerificationDays < 180;
    const paymentsBlocked = !isActive && !isDeceased;
    
    result.push({
      id: i + 1001, // Start IDs from 1001
      name: `Pensioner ${i + 1}`,
      firstName: `First${i + 1}`,
      lastName: `Last${i + 1}`,
      wallet: `0x${Math.random().toString(16).substring(2, 42)}`,
      pensionAmount: (Math.random() * 1.5 + 0.5).toFixed(2), // 0.5 to 2 ETH
      lastVerificationDate: lastVerification,
      isActive,
      isDeceased,
      paymentsBlocked,
      dateOfBirth: `1950-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
      nationalId: `ID${Math.random().toString().substring(2, 10)}`,
      email: `pensioner${i + 1}@example.com`,
      phone: `+1${Math.random().toString().substring(2, 11)}`,
      address: `${Math.floor(Math.random() * 999) + 1} Main St`,
      city: 'Anytown',
      country: 'Country',
      postalCode: `${Math.floor(Math.random() * 99999) + 10000}`,
    });
  }
  
  return result;
};

export const PensionerProvider = ({ children }) => {
  // Check localStorage for existing data
  const storedPensioners = localStorage.getItem('pensioners');
  const initialPensioners = storedPensioners 
    ? JSON.parse(storedPensioners).map(p => ({
        ...p,
        // Convert stored date strings back to Date objects
        lastVerificationDate: new Date(p.lastVerificationDate),
        deathDate: p.deathDate ? new Date(p.deathDate) : null
      }))
    : generateInitialPensioners(15);
  
  const [pensioners, setPensioners] = useState(initialPensioners);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useUser();
  
  // Fetch pensioner data from API when user is authenticated
  useEffect(() => {
    const fetchPensionerData = async () => {
      if (!isAuthenticated || !user || user.role !== 'pensioner') {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/pensioner-data`, {
          withCredentials: true
        });
        
        if (response.data.success && response.data.pensioner) {
          const apiPensioner = response.data.pensioner;
          
          // Convert date strings to Date objects
          const formattedPensioner = {
            ...apiPensioner,
            lastVerificationDate: new Date(apiPensioner.lastVerificationDate),
            nextVerificationDate: new Date(apiPensioner.nextVerificationDate),
          };
          
          // Update the pensioner in the list or add if not exists
          setPensioners(prevPensioners => {
            const existingIndex = prevPensioners.findIndex(p => 
              p.wallet && formattedPensioner.wallet && 
              p.wallet.toLowerCase() === formattedPensioner.wallet.toLowerCase()
            );
            
            if (existingIndex >= 0) {
              const updatedPensioners = [...prevPensioners];
              updatedPensioners[existingIndex] = formattedPensioner;
              return updatedPensioners;
            } else {
              return [...prevPensioners, formattedPensioner];
            }
          });
        }
      } catch (err) {
        console.error('Error fetching pensioner data from API:', err);
        setError('Failed to fetch pensioner data from server');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPensionerData();
  }, [isAuthenticated, user]);
  
  // Save to localStorage whenever pensioners change
  useEffect(() => {
    // Make a deep copy with proper date handling
    const pensionersForStorage = pensioners.map(p => ({
      ...p,
      // Ensure dates are stored as strings
      lastVerificationDate: p.lastVerificationDate instanceof Date 
        ? p.lastVerificationDate.toISOString() 
        : p.lastVerificationDate,
      deathDate: p.deathDate instanceof Date
        ? p.deathDate.toISOString()
        : p.deathDate
    }));
    
    localStorage.setItem('pensioners', JSON.stringify(pensionersForStorage));
  }, [pensioners]);
  
  // Add a new pensioner
  const addPensioner = async (pensionerData) => {
    try {
      setLoading(true);
      
      // Try to add via API first
      try {
        const response = await axios.post(`${API_URL}/register`, {
          ...pensionerData,
          role: 'pensioner'
        }, {
          withCredentials: true
        });
        
        if (response.data.success) {
          toast.success(`Pensioner ${pensionerData.firstName} ${pensionerData.lastName} registered successfully`);
          return true;
        }
      } catch (apiErr) {
        console.error('API Error adding pensioner:', apiErr);
        // Fall back to local storage if API fails
      }
      
      // Generate a new ID for local storage fallback
      const maxId = pensioners.length > 0 
        ? Math.max(...pensioners.map(p => p.id))
        : 1000;
      
      const newPensioner = {
        ...pensionerData,
        id: maxId + 1,
        lastVerificationDate: new Date(),
        isActive: true,
        isDeceased: false,
        paymentsBlocked: false,
        // Make sure wallet property exists
        wallet: pensionerData.wallet || pensionerData.walletAddress || `0x${Math.random().toString(16).substring(2, 42)}`,
      };
      
      // Add to the list
      setPensioners(prevPensioners => [...prevPensioners, newPensioner]);
      
      toast.success(`Pensioner ${pensionerData.firstName} ${pensionerData.lastName} registered successfully`);
      return true;
    } catch (err) {
      setError('Failed to register pensioner');
      toast.error('Failed to register pensioner');
      console.error('Error adding pensioner:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Update a pensioner
  const updatePensioner = (id, updatedData) => {
    try {
      setLoading(true);
      
      setPensioners(prevPensioners => 
        prevPensioners.map(pensioner => 
          pensioner.id === id ? { ...pensioner, ...updatedData } : pensioner
        )
      );
      
      toast.success('Pensioner updated successfully');
      return true;
    } catch (err) {
      setError('Failed to update pensioner');
      toast.error('Failed to update pensioner');
      console.error('Error updating pensioner:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a pensioner
  const deletePensioner = (id) => {
    try {
      setLoading(true);
      
      setPensioners(prevPensioners => 
        prevPensioners.filter(pensioner => pensioner.id !== id)
      );
      
      toast.success('Pensioner deleted successfully');
      return true;
    } catch (err) {
      setError('Failed to delete pensioner');
      toast.error('Failed to delete pensioner');
      console.error('Error deleting pensioner:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Register death
  const registerDeath = (id) => {
    return updatePensioner(id, { 
      isDeceased: true, 
      isActive: false,
      deathDate: new Date()
    });
  };
  
  // Verify pensioner (update verification date)
  const verifyPensioner = async (id) => {
    try {
      // Try API first
      const pensioner = getPensionerById(id);
      if (pensioner && pensioner.wallet) {
        try {
          const formData = new FormData();
          formData.append('pensionerID', id.toString());
          formData.append('walletAddress', pensioner.wallet);
          
          // For demonstration purposes, we're not requiring an actual image upload
          // In a real implementation, you would get this from the camera
          const dummyBlob = new Blob(['verification'], { type: 'text/plain' });
          formData.append('image', dummyBlob, 'verification.txt');
          
          const response = await axios.post(`${API_URL}/verify-pensioner`, formData, {
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.data.success) {
            // Update local storage as well
            updatePensioner(id, {
              lastVerificationDate: new Date(),
              isActive: true
            });
            return true;
          }
        } catch (apiErr) {
          console.error('API Error verifying pensioner:', apiErr);
          // Fall back to local storage
        }
      }
      
      return updatePensioner(id, {
        lastVerificationDate: new Date(),
        isActive: true
      });
    } catch (err) {
      console.error('Error verifying pensioner:', err);
      return false;
    }
  };
  
  // Get a single pensioner by ID
  const getPensionerById = (id) => {
    return pensioners.find(pensioner => pensioner.id === id);
  };
  
  // Get a pensioner by wallet address
  const getPensionerByWallet = (walletAddress) => {
    if (!walletAddress) return null;
    return pensioners.find(
      pensioner => pensioner.wallet.toLowerCase() === walletAddress.toLowerCase()
    );
  };
  
  return (
    <PensionerContext.Provider 
      value={{
        pensioners,
        loading,
        error,
        addPensioner,
        updatePensioner,
        deletePensioner,
        registerDeath,
        verifyPensioner,
        getPensionerById,
        getPensionerByWallet
      }}
    >
      {children}
    </PensionerContext.Provider>
  );
};

// Custom hook to use pensioner context
export const usePensioners = () => useContext(PensionerContext); 