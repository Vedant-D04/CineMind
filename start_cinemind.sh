#!/bin/bash

# CineMind Startup Script
# This script starts the backend server and opens the UI

echo "======================================"
echo "   CineMind - AI Film Assistant"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if required packages are installed
echo "📦 Checking dependencies..."
python3 -c "import flask" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Flask not found. Installing required packages..."
    pip3 install flask flask-cors opencv-python numpy torch torchvision
fi

echo "✅ Dependencies OK"
echo ""

# Start the backend server in the background
echo "🚀 Starting backend server..."
source venv/bin/activate && python backend_server.py &
BACKEND_PID=$!

# Wait a moment for server to start
sleep 2

# Check if server started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend server running (PID: $BACKEND_PID)"
    echo "   Server URL: http://localhost:5001"
else
    echo "❌ Failed to start backend server"
    exit 1
fi

echo ""
echo "🌐 Opening UI in browser..."
open index.html

echo ""
echo "======================================"
echo "✨ CineMind is running!"
echo "======================================"
echo ""
echo "Backend: http://localhost:5001"
echo "UI: file://$(pwd)/index.html"
echo ""
echo "Press Ctrl+C to stop the backend server"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping backend server...'; kill $BACKEND_PID; echo '✅ Backend stopped'; exit 0" INT

# Keep script running
wait $BACKEND_PID
