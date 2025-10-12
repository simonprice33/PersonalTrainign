@echo off
echo 🚀 Starting Simon Price PT Backend...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists and has email password
findstr /C:"YOUR_APP_PASSWORD_HERE" .env >nul 2>&1
if not errorlevel 1 (
    echo ❌ Please update your email password in .env file
    echo Edit .env and replace YOUR_APP_PASSWORD_HERE with your Hotmail app password
    echo.
    echo To get your Hotmail app password:
    echo 1. Go to https://account.microsoft.com/security
    echo 2. Sign in with simon.price.33@hotmail.com
    echo 3. Go to Advanced security options
    echo 4. Create a new app password
    echo 5. Copy it to .env file
    echo.
    pause
    exit /b 1
)

echo ✅ Starting server on port 3001...
echo ✅ Press Ctrl+C to stop the server
echo.

node server.js

pause