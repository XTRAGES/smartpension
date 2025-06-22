# :lock: Smart Pension - Blockchain Verification System

## :pencil: Description
A blockchain-based pension verification system that uses facial recognition and smart contracts to ensure only eligible pensioners receive payments. Built with Ethereum (Hardhat), React, and Flask.

## :bookmark_tabs: Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## :sparkles: Features
- **Blockchain-secured pension verification**: Ensures secure and transparent pension management using blockchain technology.
- **Facial recognition**: Verifies pensioner identity using facial recognition for enhanced security.
- **Admin dashboard**: Provides an interface for administrators to manage pensioners and system settings.
- **Doctor interface**: Enables doctors to register deaths, updating the system and preventing fraudulent payments.
- **Pensioner dashboard**: Allows pensioners to verify their status and manage their information.
- **Smart Contracts**: Automates pension distribution and verification processes using Solidity smart contracts.
- **MetaMask Integration**: Seamlessly connects users to the blockchain network using MetaMask.

## :computer: Technology Stack
- **Frontend**: React, Material-UI
- **Backend**: Flask, Python
- **Blockchain**: Ethereum (Hardhat development environment)
- **Smart Contracts**: Solidity
- **Authentication**: MetaMask wallet integration

## :rocket: Getting Started

### :gear: Prerequisites
- Node.js & npm
- Python 3.7+
- MetaMask browser extension
- Git

### :wrench: Installation
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

## :arrow_forward: Running the Application

Use the provided batch files:
```
start-local.bat    # For local development
start-local-network.bat  # For network access
```

Or follow the manual setup in NETWORK-SETUP.md

## :question: Usage

1. Access the application at `http://localhost:3000`
2. Connect your MetaMask wallet
3. Login with the appropriate role (Admin, Doctor, or Pensioner)

## :balance_scale: License
This project is licensed under the proprietary License - see the [LICENSE](LICENSE) file for details.

## :email: Contact
   aldinzendeli33@gmail.com
