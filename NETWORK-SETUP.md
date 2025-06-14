# Network Setup Guide for Smart Pension

This guide explains how to set up the Smart Pension application for access across your local network, allowing multiple users to connect to the same blockchain instance.

## Server Setup (Administrator)

### 1. Starting the Blockchain Node

First, you need to start the Hardhat blockchain node with external access enabled:

```bash
# Create and run hardhat-network.bat
npx hardhat node --hostname 0.0.0.0
```

Make sure you see the line: "Started HTTP and WebSocket JSON-RPC server at http://0.0.0.0:8545/"

### 2. Finding Your IP Address

To allow others to connect, find your computer's IP address:

```bash
ipconfig
```

Look for your active network connection (usually "Wireless LAN adapter Wi-Fi") and note the "IPv4 Address" (e.g., 192.168.1.100).

### 3. Configuring Environment Files

Update your `.env` files to use your network IP:

**smart-pension/.env**:
```
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
FLASK_SECRET_KEY=your_secret_key_for_session_management
```

**smart-pension/frontend/.env**:
```
REACT_APP_CONTRACT_ADDRESS_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_BACKEND_URL=http://YOUR_IP_ADDRESS:5000
```

### 4. Opening Firewall Ports

You need to allow incoming connections through your firewall:

1. Open Windows Defender Firewall (search "firewall" in Start menu)
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings" then "Allow another app"
4. Add the following ports:
   - Node.js/NPM (for frontend): Port 3000
   - Python (for backend): Port 5000
   - Hardhat: Port 8545

Alternative: Quick command to allow ports (run in PowerShell as Administrator):

```powershell
New-NetFirewallRule -DisplayName 'Smart Pension - Frontend' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName 'Smart Pension - Backend' -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName 'Smart Pension - Blockchain' -Direction Inbound -Protocol TCP -LocalPort 8545 -Action Allow
```

### 5. Starting the Application

Use the provided batch file to start both servers:

```
smart-pension/start-local-network.bat
```

Or start manually in PowerShell:

```powershell
# Terminal 1 - Start backend
cd smart-pension
python backend/app.py

# Terminal 2 - Start frontend
cd smart-pension/frontend
set PORT=3000
npm start
```

## Client Setup (Network Users)

### 1. Installing MetaMask

1. Open Chrome, Firefox, or Edge browser
2. Go to [https://metamask.io/download/](https://metamask.io/download/)
3. Click "Install MetaMask" for your browser
4. Follow the installation prompts
5. Create a new wallet or import an existing one

### 2. Configuring MetaMask for Your Network

1. Open MetaMask by clicking the fox icon in browser toolbar
2. Click on the network dropdown at the top (it typically says "Ethereum Mainnet")
3. Click "Add Network" or "Add Network manually"
4. Fill in the following network details:
   ```
   Network Name: Smart Pension Local Network
   New RPC URL: http://YOUR_IP_ADDRESS:8545
   Chain ID: 31337
   Currency Symbol: ETH
   Block Explorer URL: (leave blank)
   ```
5. Click "Save"
6. Make sure "Smart Pension Local Network" is selected

### 3. Getting Test ETH

1. Users need ETH to interact with the system
2. The administrator can send ETH from pre-funded accounts using:
   - MetaMask transfer
   - Hardhat console

### 4. Accessing the Application

1. Open a web browser
2. Navigate to: `http://YOUR_IP_ADDRESS:3000`
3. The Smart Pension login page should appear
4. Click "Connect with MetaMask"
5. Select the appropriate role tab (Pensioner, Doctor, Admin)
6. Complete the login process

## Troubleshooting

### Connection Issues

- **Cannot access application**: Check firewall settings on server
- **MetaMask can't connect to network**: Verify RPC URL and that Hardhat node is running
- **Contract not found**: Ensure contract is deployed and address is correct
- **Transaction errors**: Check if account has sufficient ETH

### PowerShell Command Limitations

If using PowerShell, note that `&&` is not supported. Use separate commands:

```powershell
cd smart-pension
python backend/app.py

# In another PowerShell window:
cd smart-pension/frontend
npm start
```

## Test User Accounts

For testing with multiple roles, you can create and fund test accounts:

```javascript
// In hardhat console
const wallet1 = ethers.Wallet.createRandom();
console.log(`Admin: ${wallet1.address} - ${wallet1.privateKey}`);

const wallet2 = ethers.Wallet.createRandom();
console.log(`Doctor: ${wallet2.address} - ${wallet2.privateKey}`);

const wallet3 = ethers.Wallet.createRandom();
console.log(`Pensioner: ${wallet3.address} - ${wallet3.privateKey}`);

// Fund accounts
const [owner] = await ethers.getSigners();
await owner.sendTransaction({to: wallet1.address, value: ethers.utils.parseEther("10")});
await owner.sendTransaction({to: wallet2.address, value: ethers.utils.parseEther("10")});
await owner.sendTransaction({to: wallet3.address, value: ethers.utils.parseEther("10")});
``` 