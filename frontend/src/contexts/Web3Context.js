import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import axios from 'axios';

// Load environment variables
const CONTRACT_ENV = {
  address: process.env.REACT_APP_CONTRACT_ADDRESS,
  networkName: process.env.REACT_APP_NETWORK_NAME,
  chainId: process.env.REACT_APP_CHAIN_ID
};

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Context for web3 interactions
const Web3Context = createContext();

// PensionContract ABI - matching the SmartPension.sol contract
const CONTRACT_ABI = [
  // Registration and verification functions
  "function registerPensioner(address _wallet, string memory _name, uint256 _pensionAmount, uint256 _lastVerificationDate) external returns (uint256)",
  "function verifyPensioner(uint256 _pensionerId) external",
  "function registerDeath(uint256 _pensionerId) external",
  "function blockPayments(uint256 _pensionerId) external",
  "function unblockPayments(uint256 _pensionerId) external",
  
  // Pensioner data functions
  "function getPensioner(uint256 _pensionerId) external view returns (address, string memory, uint256, uint256, bool, bool)",
  "function getPensionerIDByAddress(address _wallet) external view returns (uint256)",
  "function getTotalPensioners() external view returns (uint256)",
  "function totalPensioners() external view returns (uint256)",
  
  // Settings
  "function setVerificationPeriod(uint256 _newPeriod) external",
  "function getVerificationPeriod() external view returns (uint256)",
  
  // Owner
  "function owner() external view returns (address)"
];

// Contract addresses - replace with your deployed contract addresses
const CONTRACT_ADDRESS = {
  // For local development with Hardhat
  hardhat: CONTRACT_ENV.address || "0x0165878A594ca255338adfa4d48449f69242Eb8F", // Default to our deployed contract address
  // For testnet or mainnet deployment
  testnet: process.env.REACT_APP_TESTNET_CONTRACT_ADDRESS || "0x...", // Add your testnet contract address here
  mainnet: process.env.REACT_APP_MAINNET_CONTRACT_ADDRESS || "0x...", // Add your mainnet contract address here
};

// Network names to chain IDs mapping for better readability
const NETWORK_CHAIN_IDS = {
  hardhat: [31337, 1337], // Local development
  sepolia: 11155111,      // Testnet
  mainnet: 1,            // Ethereum mainnet
};

// Web3 provider component
export const Web3Provider = ({ children }) => {
  // State
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Check if we're on the correct network
  const isNetworkSupported = (chainId) => {
    // Get expected chainId from environment variable or use hardhat as default
    const expectedChainId = CONTRACT_ENV.chainId ? parseInt(CONTRACT_ENV.chainId) : null;
    
    // Check if the current chainId matches any of our supported networks
    return (
      // Direct match with expected chain ID from env
      (expectedChainId && chainId === expectedChainId) ||
      // Hardhat local networks
      NETWORK_CHAIN_IDS.hardhat.includes(chainId) ||
      // Other supported networks
      chainId === NETWORK_CHAIN_IDS.sepolia || 
      chainId === NETWORK_CHAIN_IDS.mainnet
    );
  };

  // Initialize provider
  useEffect(() => {
    const initProvider = async () => {
      try {
        // Check if MetaMask is installed
        if (window.ethereum) {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(web3Provider);
          
          // Get current chain ID
          const network = await web3Provider.getNetwork();
          setChainId(network.chainId);
          
          // Check if we're on a supported network
          setIsCorrectNetwork(isNetworkSupported(network.chainId));
          
          // Add event listeners
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('chainChanged', handleChainChanged);
          
          // Check if already connected
          const accounts = await web3Provider.listAccounts();
          if (accounts.length > 0) {
            const currentAccount = accounts[0];
            setAccount(currentAccount);
            setIsConnected(true);
            
            // Get signer and create contract instance
            const web3Signer = web3Provider.getSigner();
            setSigner(web3Signer);
            
            // Create contract instance based on the current network
            let contractAddress = getContractAddressForNetwork(network.chainId);
            if (contractAddress) {
              const pensionContract = new ethers.Contract(contractAddress, CONTRACT_ABI, web3Signer);
              setContract(pensionContract);
              updateBalance(currentAccount);
            }
          }
        } else {
          setError('MetaMask is not installed. Please install MetaMask to use this application.');
          console.warn('MetaMask not installed');
        }
      } catch (err) {
        console.error('Error initializing web3 provider:', err);
        setError(err.message || 'Error initializing web3 provider');
      }
    };

    initProvider();

    // Cleanup event listeners on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Get contract address for the current network
  const getContractAddressForNetwork = (chainId) => {
    // Check for hardhat/local networks
    if (NETWORK_CHAIN_IDS.hardhat.includes(chainId)) {
      return CONTRACT_ADDRESS.hardhat;
    } 
    // Check for sepolia testnet
    else if (chainId === NETWORK_CHAIN_IDS.sepolia) {
      return CONTRACT_ADDRESS.testnet;
    } 
    // Check for mainnet
    else if (chainId === NETWORK_CHAIN_IDS.mainnet) {
      return CONTRACT_ADDRESS.mainnet;
    } 
    // If chainId matches explicitly provided env variable, use hardhat default
    else if (chainId === (CONTRACT_ENV.chainId ? parseInt(CONTRACT_ENV.chainId) : 0)) {
      return CONTRACT_ADDRESS.hardhat;
    }
    // Default to hardhat for development if nothing matched
    return CONTRACT_ADDRESS.hardhat;
  };

  // Handle account change
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      setAccount('');
      setIsConnected(false);
      setSigner(null);
      setContract(null);
      setBalance('0');
      toast.info('Wallet disconnected');
    } else {
      // Account changed
      const newAccount = accounts[0];
      setAccount(newAccount);
      
      if (provider) {
        const web3Signer = provider.getSigner();
        setSigner(web3Signer);
        
        if (chainId) {
          const contractAddress = getContractAddressForNetwork(chainId);
          if (contractAddress) {
            const pensionContract = new ethers.Contract(contractAddress, CONTRACT_ABI, web3Signer);
            setContract(pensionContract);
          }
        }
        
        updateBalance(newAccount);
      }
      
      toast.info('Account changed');
    }
  };

  // Handle chain change
  const handleChainChanged = (chainIdHex) => {
    // Convert from hex to decimal
    const newChainId = parseInt(chainIdHex, 16);
    setChainId(newChainId);
    
    // Check if we're on a supported network
    setIsCorrectNetwork(isNetworkSupported(newChainId));
    
    // Reload the page as recommended by MetaMask
    window.location.reload();
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!provider) {
        throw new Error('Web3 provider not found. Please install MetaMask.');
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const currentAccount = accounts[0];
      setAccount(currentAccount);
      
      // Get signer and contract
      const web3Signer = provider.getSigner();
      setSigner(web3Signer);
      
      // Determine which contract address to use based on chain ID
      const contractAddress = getContractAddressForNetwork(chainId);
      
      // Create contract instance
      const pensionContract = new ethers.Contract(contractAddress, CONTRACT_ABI, web3Signer);
      setContract(pensionContract);
      
      // Update connected status and balance
      setIsConnected(true);
      updateBalance(currentAccount);
      
      toast.success('Wallet connected successfully');
      
      // Return true to indicate success
      return true;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Error connecting wallet');
      toast.error(err.message || 'Error connecting wallet');
      
      // Return false to indicate failure
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Switch to the correct network
  const switchNetwork = async () => {
    try {
      setLoading(true);
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }
      
      // Get the expected chain ID from environment or use hardhat as default
      const expectedChainId = CONTRACT_ENV.chainId 
        ? parseInt(CONTRACT_ENV.chainId) 
        : 31337; // Default to Hardhat
        
      // Convert to hex format required by MetaMask
      const chainIdHex = '0x' + expectedChainId.toString(16);
      
      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
        
        // If successful, return true
        return true;
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            let networkParams;
            
            // Define network parameters based on chain ID
            if (expectedChainId === 31337 || expectedChainId === 1337) {
              networkParams = {
                chainId: chainIdHex,
                chainName: 'Hardhat Local',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['http://127.0.0.1:8545'],
                blockExplorerUrls: null
              };
            } else if (expectedChainId === 11155111) {
              networkParams = {
                chainId: chainIdHex,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              };
            }
            
            // Add the network to MetaMask
            if (networkParams) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkParams],
              });
              
              // If successful, return true
              return true;
            }
          } catch (addError) {
            console.error('Error adding network:', addError);
            throw new Error('Could not add network to MetaMask');
          }
        }
        console.error('Error switching network:', switchError);
        throw new Error('Could not switch to the correct network');
      }
    } catch (err) {
      console.error('Network switch error:', err);
      toast.error(err.message || 'Failed to switch network');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet (for UI purposes - MetaMask doesn't actually support programmatic disconnection)
  const disconnectWallet = () => {
    setAccount('');
    setIsConnected(false);
    setSigner(null);
    setContract(null);
    setBalance('0');
    toast.info('Wallet disconnected');
  };

  // Update account balance
  const updateBalance = async (account) => {
    if (provider && account) {
      try {
        const balanceWei = await provider.getBalance(account);
        const balanceEth = ethers.utils.formatEther(balanceWei);
        setBalance(parseFloat(balanceEth).toFixed(4));
      } catch (err) {
        console.error('Error fetching balance:', err);
      }
    }
  };

  // Send transaction
  const sendTransaction = async (to, value, data = '') => {
    try {
      if (!signer) {
        throw new Error('Wallet not connected');
      }
      
      // Convert ETH to Wei
      const valueWei = ethers.utils.parseEther(value.toString());
      
      // Create transaction
      const tx = {
        to,
        value: valueWei,
        data,
      };
      
      // Send transaction
      const txResponse = await signer.sendTransaction(tx);
      
      // Wait for confirmation
      const receipt = await txResponse.wait();
      
      return {
        success: true,
        hash: txResponse.hash,
        receipt,
      };
    } catch (err) {
      console.error('Error sending transaction:', err);
      throw err;
    }
  };

  // Check if connected account is an admin
  const isAdmin = useCallback(async () => {
    if (!contract || !account) return false;
    
    try {
      const ownerAddress = await contract.owner();
      return ownerAddress.toLowerCase() === account.toLowerCase();
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }, [contract, account]);

  // Get pensioner ID by address via contract call
  const getPensionerIDByAddress = useCallback(async (address) => {
    if (!contract) return null;
    
    try {
      const pensionerID = await contract.getPensionerIDByAddress(address);
      return parseInt(pensionerID.toString());
    } catch (error) {
      console.error('Error getting pensioner ID:', error);
      return null;
    }
  }, [contract]);

  // Register pensioner through backend API - this ensures both blockchain and database are synchronized
  const registerPensioner = async (name, walletAddress, pensionAmount) => {
    try {
      if (!isConnected) {
        throw new Error('Wallet not connected');
      }
      
      const response = await axios.post(`${API_URL}/admin/register-pensioner`, {
        name,
        walletAddress,
        pensionAmount: parseInt(pensionAmount),
        adminWalletAddress: account
      });
      
      if (response.data.success) {
        return {
          success: true,
          pensionerID: response.data.pensionerID
        };
      } else {
        throw new Error(response.data.message || 'Failed to register pensioner');
      }
    } catch (error) {
      console.error('Error registering pensioner:', error);
      throw error;
    }
  };

  // Verify pensioner through backend API
  const verifyPensioner = async (pensionerID, verificationImage) => {
    try {
      if (!isConnected) {
        throw new Error('Wallet not connected');
      }
      
      const response = await axios.post(`${API_URL}/verify/${pensionerID}`, {
        verificationImage,
        verifierWalletAddress: account
      });
      
      if (response.data.success) {
        return {
          success: true,
          transactionHash: response.data.transactionHash
        };
      } else {
        throw new Error(response.data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying pensioner:', error);
      throw error;
    }
  };

  // Report death through backend API
  const reportDeath = async (pensionerID) => {
    try {
      if (!isConnected) {
        throw new Error('Wallet not connected');
      }
      
      const response = await axios.post(`${API_URL}/admin/register-death`, {
        pensionerID,
        doctorWalletAddress: account
      });
      
      if (response.data.success) {
        return {
          success: true,
          transactionHash: response.data.transactionHash
        };
      } else {
        throw new Error(response.data.message || 'Failed to register death');
      }
    } catch (error) {
      console.error('Error reporting death:', error);
      throw error;
    }
  };
  
  // Get pensioner information directly from contract
  const getPensioner = async (pensionerID) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const pensioner = await contract.getPensioner(pensionerID);
      
      return {
        wallet: pensioner[0],
        name: pensioner[1],
        pensionAmount: pensioner[2].toString(),
        lastVerificationDate: parseInt(pensioner[3].toString()),
        isActive: pensioner[4],
        isDeceased: pensioner[5]
      };
    } catch (error) {
      console.error('Error fetching pensioner data:', error);
      throw error;
    }
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        account,
        isConnected,
        chainId,
        isCorrectNetwork,
        balance,
        loading,
        error,
        connectWallet,
        disconnectWallet,
        sendTransaction,
        isAdmin,
        getPensionerIDByAddress,
        registerPensioner,
        verifyPensioner,
        reportDeath,
        getPensioner,
        switchNetwork
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook to use Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export default Web3Context; 