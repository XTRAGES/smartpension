# Smart Pension Application - Project Structure

This document outlines the organization and structure of the Smart Pension application codebase.

## Directory Structure

```
smart-pension/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── logo.png
│   │   └── models/               # Face-api.js model files
│   └── src/
│       ├── components/           # Reusable UI components
│       │   ├── Header.js
│       │   ├── LoadingScreen.js
│       │   ├── ProtectedRoute.js
│       │   └── ThemeToggle.js
│       ├── contexts/             # React contexts for application state
│       │   ├── UserContext.js
│       │   └── Web3Context.js
│       ├── pages/                # Main application pages
│       │   ├── AdminDashboard.js
│       │   ├── DoctorDashboard.js
│       │   ├── Login.js
│       │   ├── NotFound.js
│       │   ├── PensionerDashboard.js
│       │   ├── RegisterDeath.js
│       │   ├── RegisterPensioner.js
│       │   └── Verification.js
│       ├── App.js                # Main application component with routing
│       ├── constants.js          # Application-wide constants
│       ├── index.css             # Global styles
│       └── index.js              # Application entry point
└── contracts/                    # Smart contracts (separate repository)
```

## Component Descriptions

### Core Files

- **App.js**: Main application component with route definitions and theme configuration
- **index.js**: Application entry point that renders the App component
- **constants.js**: Centralized application constants and configuration
- **index.css**: Global CSS styles

### Contexts

- **UserContext.js**: Manages user authentication state and role-based permissions
- **Web3Context.js**: Handles blockchain interactions, wallet connections, and contract calls

### Components

- **Header.js**: Application header with navigation links based on user role
- **LoadingScreen.js**: Loading indicator shown during application initialization
- **ProtectedRoute.js**: Route wrapper to enforce authentication and role-based access control
- **ThemeToggle.js**: Button component for switching between light and dark themes

### Pages

- **Login.js**: Authentication page using MetaMask wallet
- **PensionerDashboard.js**: Dashboard for pensioners to view status and start verification
- **AdminDashboard.js**: Dashboard for administrators to manage pensioners and system
- **DoctorDashboard.js**: Dashboard for doctors to handle verification requests and register deaths
- **Verification.js**: Face verification process for pensioners
- **RegisterPensioner.js**: Form for administrators to register new pensioners
- **RegisterDeath.js**: Form for doctors to register pensioner deaths
- **NotFound.js**: 404 page for non-existent routes

## Key Features by Role

### Pensioner Features
- View pension status
- Complete face verification
- Update personal information
- View verification history

### Admin Features
- Register new pensioners
- View all pensioners
- Monitor system statistics
- Manage pensioner information

### Doctor Features
- Process verification requests
- Verify pensioner life status
- Register deaths
- View verification history

## Technology Stack

- **Frontend Framework**: React
- **UI Library**: Material-UI
- **Blockchain Interaction**: ethers.js
- **Face Recognition**: face-api.js
- **Routing**: react-router-dom
- **State Management**: React Context API
- **Authentication**: MetaMask wallet

## Development Workflow

1. Install dependencies: `npm install`
2. Configure environment variables in `.env` file
3. Start development server: `npm start`
4. Build for production: `npm run build`

## Deployment Architecture

In a production environment, the application would be deployed as follows:

1. Frontend hosted on a CDN (e.g., Netlify, Vercel, AWS S3)
2. Smart contracts deployed on Ethereum or Polygon mainnet
3. Face recognition models loaded from the CDN
4. MetaMask browser extension used for transaction signing 