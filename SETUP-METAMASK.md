# Setting Up MetaMask for Local Development

## Step 1: Install MetaMask

1. Install the [MetaMask browser extension](https://metamask.io/download/)
2. Create a new wallet or use an existing one

## Step 2: Add the Hardhat Local Network

1. Open MetaMask
2. Click on the network dropdown at the top (probably says "Ethereum Mainnet")
3. Click "Add Network" or "Add Network manually" (depending on your MetaMask version)
4. Fill in the following details:
   - **Network Name**: Hardhat Local
   - **New RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH
5. Click "Save"

## Step 3: Import Test Accounts

You can import any of the test accounts provided by Hardhat:

### Admin Account
- **Address**: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
- **Private Key**: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

### Test Pensioner Accounts
You can use any of these accounts as pensioners:

- **Account #1**: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  - **Private Key**: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

- **Account #2**: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  - **Private Key**: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

To import an account:
1. Open MetaMask
2. Click the account icon in the top-right
3. Select "Import Account"
4. Paste the private key and click "Import"

## Step 4: Using the Application

1. When you start the application, make sure you're connected to the "Hardhat Local" network in MetaMask
2. Use the Admin account to register pensioners
3. Switch to different pensioner accounts in MetaMask to test the pensioner functionality

## Important Note

These test accounts only have ETH on your local blockchain. Never send real funds to these addresses, as the private keys are publicly known and any real funds will be lost. 