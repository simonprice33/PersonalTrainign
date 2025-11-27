#!/bin/bash

echo "🔍 LOCAL ENVIRONMENT DEBUG SCRIPT"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ] || [ ! -f "backend/server.js" ]; then
    echo "❌ Please run this script from your project root directory"
    echo "   (the directory containing both 'frontend' and 'backend' folders)"
    exit 1
fi

echo "📂 Project Structure: ✅"
echo ""

# Check frontend env
echo "🌐 FRONTEND CONFIGURATION"
echo "------------------------"
if [ -f "frontend/.env" ]; then
    echo "Frontend .env file exists:"
    grep REACT_APP_BACKEND_URL frontend/.env || echo "   ⚠️  REACT_APP_BACKEND_URL not found"
else
    echo "❌ frontend/.env file not found"
    echo "   Create it with: REACT_APP_BACKEND_URL=http://localhost:8001"
fi
echo ""

# Check backend env
echo "🔧 BACKEND CONFIGURATION" 
echo "-----------------------"
if [ -f "backend/.env" ]; then
    echo "Backend .env file exists"
    echo "MongoDB URL:"
    grep MONGO_URL backend/.env || echo "   ⚠️  MONGO_URL not found"
else
    echo "❌ backend/.env file not found"
fi
echo ""

# Check if backend has latest status update code
echo "💻 BACKEND CODE CHECK"
echo "--------------------"
if grep -q "Client user status updated" backend/server.js; then
    echo "✅ Backend has status update logging"
else
    echo "❌ Backend missing latest status update code"
fi

if grep -q "client_users.updateOne" backend/server.js; then
    echo "✅ Backend updates client_users collection"
else
    echo "❌ Backend missing client_users update code"
fi
echo ""

# Check processes
echo "🔄 RUNNING PROCESSES"
echo "-------------------"
backend_pid=$(pgrep -f "node.*server.js" || echo "")
if [ -n "$backend_pid" ]; then
    echo "✅ Backend is running (PID: $backend_pid)"
else
    echo "⚠️  Backend not running"
fi

frontend_pid=$(pgrep -f "react-scripts" || echo "")
if [ -n "$frontend_pid" ]; then
    echo "✅ Frontend is running (PID: $frontend_pid)"
else
    echo "⚠️  Frontend not running"
fi
echo ""

# Test backend API
echo "🔗 BACKEND API TEST"
echo "------------------"
if command -v curl >/dev/null 2>&1; then
    echo "Testing backend at http://localhost:8001..."
    response=$(curl -s -w "%{http_code}" "http://localhost:8001" -o /dev/null || echo "000")
    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
        echo "✅ Backend is responding (HTTP $response)"
    else
        echo "❌ Backend not responding (HTTP $response)"
        echo "   Make sure backend is running: cd backend && node server.js"
    fi
else
    echo "⚠️  curl not available to test backend"
fi
echo ""

# Check database
echo "💾 DATABASE CHECK"
echo "----------------"
if command -v mongosh >/dev/null 2>&1; then
    echo "Checking for client users in local database..."
    db_result=$(mongosh --quiet --eval 'db.getSiblingDB("simonprice_pt_db").client_users.countDocuments()' 2>/dev/null || echo "error")
    if [ "$db_result" = "error" ]; then
        echo "❌ Cannot connect to MongoDB"
        echo "   Make sure MongoDB is running"
    elif [ "$db_result" = "0" ]; then
        echo "⚠️  No client users in database"
        echo "   Database is empty - you need to create a client user first"
    else
        echo "✅ Found $db_result client user(s) in database"
    fi
else
    echo "⚠️  mongosh not available to check database"
fi
echo ""

echo "📋 RECOMMENDED ACTIONS"
echo "====================="
echo ""
echo "1. Pull latest code:"
echo "   git pull origin main"
echo ""
echo "2. Install dependencies:"
echo "   cd frontend && yarn install"
echo "   cd ../backend && npm install"
echo ""
echo "3. Set up environment files:"
echo "   echo 'REACT_APP_BACKEND_URL=http://localhost:8001' > frontend/.env"
echo "   echo 'MONGO_URL=mongodb://localhost:27017' > backend/.env"
echo ""
echo "4. Start services:"
echo "   # Terminal 1:"
echo "   cd backend && node server.js"
echo ""
echo "   # Terminal 2:"
echo "   cd frontend && yarn start"
echo ""
echo "5. Create test client user (if database is empty):"
echo "   mongosh --eval '"
echo "     db = db.getSiblingDB(\"simonprice_pt_db\");"
echo "     db.clients.insertOne({email: \"test@example.com\", name: \"Test Client\", status: \"active\", created_at: new Date()});"
echo "     db.client_users.insertOne({email: \"test@example.com\", password: \"test\", status: \"active\", created_at: new Date()});"
echo "   '"
echo ""
echo "6. Test status update at: http://localhost:3000/admin/client-users"