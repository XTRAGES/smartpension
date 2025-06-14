/**
 * Application-wide constants
 */

// User roles
export const ROLES = {
  PENSIONER: 'pensioner',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
};

// API endpoints - Would be used in a full application
export const API = {
  BASE_URL: process.env.REACT_APP_API_URL || 'https://api.smartpension.example',
  ENDPOINTS: {
    VERIFY: '/verify',
    REGISTER: '/register',
    DEATH: '/death',
  }
};

// Blockchain networks
export const NETWORKS = {
  ETHEREUM: {
    id: 1,
    name: 'Ethereum Mainnet',
    currency: 'ETH',
  },
  POLYGON: {
    id: 137,
    name: 'Polygon Mainnet',
    currency: 'MATIC',
  },
  MUMBAI: {
    id: 80001,
    name: 'Polygon Mumbai Testnet',
    currency: 'MATIC',
  },
  HARDHAT: {
    id: 31337,
    name: 'Hardhat Local',
    currency: 'ETH',
  },
};

// Contract addresses - Would come from .env in production
export const CONTRACT_ADDRESSES = {
  PENSION: {
    [NETWORKS.ETHEREUM.id]: process.env.REACT_APP_CONTRACT_ADDRESS_MAINNET || '0x...',
    [NETWORKS.POLYGON.id]: process.env.REACT_APP_CONTRACT_ADDRESS_POLYGON || '0x...',
    [NETWORKS.MUMBAI.id]: process.env.REACT_APP_CONTRACT_ADDRESS_MUMBAI || '0x...',
    [NETWORKS.HARDHAT.id]: process.env.REACT_APP_CONTRACT_ADDRESS_LOCAL || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
};

// Application settings
export const APP_SETTINGS = {
  // Number of days after which verification is required
  VERIFICATION_PERIOD_DAYS: 180,
  
  // Minimum age for pensioner registration
  MIN_PENSIONER_AGE: 60,
  
  // Pagination settings
  DEFAULT_PAGE_SIZE: 10,
  
  // Face detection settings
  FACE_DETECTION: {
    MIN_CONFIDENCE: 0.7,
    REQUIRED_GESTURES: ['blink', 'smile'],
  },
};

// LocalStorage keys
export const STORAGE_KEYS = {
  USER_ADDRESS: 'userAddress',
  USER_ROLE: 'userRole',
  PENSIONER_ID: 'pensionerID',
  DARK_MODE: 'darkMode',
};

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Wallet not connected. Please connect your MetaMask wallet.',
  WRONG_NETWORK: 'Please connect to the correct network.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  VERIFICATION_FAILED: 'Face verification failed. Please try again.',
  CONTRACT_ERROR: 'Error interacting with the smart contract. Please try again.',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PENSIONER_DASHBOARD: '/pensioner-dashboard',
  ADMIN_DASHBOARD: '/admin-dashboard',
  DOCTOR_DASHBOARD: '/doctor-dashboard',
  VERIFICATION: '/verification/:pensionerId',
  REGISTER_PENSIONER: '/register-pensioner',
  REGISTER_DEATH: '/register-death',
  NOT_FOUND: '/404',
}; 