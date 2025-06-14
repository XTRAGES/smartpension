# Smart Pension - Blockchain Verification System

A blockchain-based pension verification system that uses facial recognition and smart contracts to ensure only eligible pensioners receive payments.

## Features

- Blockchain-secured pension verification
- Facial recognition to verify pensioner identity
- Admin dashboard for managing pensioners
- Doctor interface for death registration
- Pensioner dashboard for verification and status

## Technology Stack

- **Frontend**: React, Material-UI
- **Backend**: Flask, Python
- **Blockchain**: Ethereum (Hardhat development environment)
- **Smart Contracts**: Solidity
- **Authentication**: MetaMask wallet integration

## Getting Started

### Prerequisites

- Node.js & npm
- Python 3.7+
- MetaMask browser extension
- Git

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/XTRAGES/smartpension.git
   cd smartpension
   ```

2. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

4. Create and configure .env files as described in NETWORK-SETUP.md

### Running the Application

Use the provided batch files:
```
start-local.bat    # For local development
start-local-network.bat  # For network access
```

Or follow the manual setup in NETWORK-SETUP.md

## Usage

1. Access the application at `http://localhost:3000`
2. Connect your MetaMask wallet
3. Login with the appropriate role (Admin, Doctor, or Pensioner)



## Acknowledgments

- This project was developed as a prototype for a secure pension verification system
- Special thanks to the blockchain community for their resources and documentation 
