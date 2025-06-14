@echo off
echo Starting Smart Pension Local Development Environment

echo 1. Starting local Hardhat blockchain...
start cmd /k "npx hardhat node"
timeout /t 8

echo 2. Deploying contract to local blockchain...
call npm run deploy:local
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Contract deployment failed! See error message above.
  pause
  exit /b 1
)
timeout /t 3

echo 3. Starting Flask backend...
cd backend
start cmd /k "python app.py"
cd ..
timeout /t 3

echo 4. Starting React frontend...
cd frontend
start cmd /k "npm start"
cd ..

echo All components started! Please check the individual windows for any errors.
echo.
echo Local contract address should be shown in the deployment window
echo Admin account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
echo Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo.
echo IMPORTANT: Make sure you have added the local network to MetaMask:
echo Network Name: Hardhat Local
echo RPC URL: http://127.0.0.1:8545
echo Chain ID: 31337
echo Currency Symbol: ETH
echo.
echo Press any key to exit this window...
pause 