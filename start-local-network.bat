@echo off
echo Starting Smart Pension application for network access...
echo.
echo Your IP address: 172.20.10.2
echo Backend URL: http://172.20.10.2:5000
echo Frontend URL for local users: http://172.20.10.2:3000
echo.
echo 1. Starting backend server...
start cmd /k "cd %~dp0 && python backend/app.py"
timeout /t 5 > nul
echo 2. Starting frontend server...
start cmd /k "cd %~dp0/frontend && set PORT=3000 && npm start"
echo.
echo Done! The application should now be accessible to other devices on your network.
echo Users can access the application at: http://172.20.10.2:3000
echo.
echo Press any key to exit...
pause > nul 