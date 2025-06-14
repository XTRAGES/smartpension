// Script to deploy the SmartPension contract
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of SmartPension contract...");
  console.log("Network:", network.name);

  // Get the Contract Factory
  const SmartPension = await ethers.getContractFactory("SmartPension");
  
  // Deploy the contract
  console.log("Deploying contract...");
  const smartPension = await SmartPension.deploy();
  
  // For Hardhat Network, we need to get the transaction
  const deploymentTransaction = smartPension.deploymentTransaction();
  console.log("Deployment transaction hash:", deploymentTransaction.hash);
  
  // The contract address
  const contractAddress = await smartPension.getAddress();
  console.log(`SmartPension contract deployed to: ${contractAddress}`);
  
  // Log the first few accounts for testing
  const [deployer, admin, doctor, pensioner] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Admin address:", admin.address);
  console.log("Doctor address:", doctor.address);
  console.log("Test pensioner address:", pensioner.address);
  
  // Save the contract address to a file for easy access
  const deployData = {
    contractAddress,
    networkName: network.name,
    deployerAddress: deployer.address
  };
  
  // Create .env file for frontend with contract address
  try {
    const envPath = path.join(__dirname, "../frontend/.env");
    const envContent = `REACT_APP_CONTRACT_ADDRESS=${contractAddress}\n` +
                      `REACT_APP_NETWORK_NAME=localhost\n` +
                      `REACT_APP_CHAIN_ID=31337\n`;
    fs.writeFileSync(envPath, envContent);
    console.log("Frontend .env file updated with contract address");
  } catch (error) {
    console.warn("Warning: Could not write frontend .env file:", error.message);
  }
  
  console.log("Deployment completed successfully!");
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in deployment:", error);
    process.exit(1);
  }); 