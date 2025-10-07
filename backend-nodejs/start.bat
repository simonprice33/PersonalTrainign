@echo off
echo Starting Simon Price PT Backend...

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Create logs directory
if not exist "logs" (
    mkdir logs
)

REM Start the application
echo Starting server on port 3001...
node server.js

pause