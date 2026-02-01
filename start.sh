#!/bin/bash
# Quick start script for backend and frontend

echo "🚀 Starting services..."

# Kill any existing processes
pkill -f "node.*server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Start backend
echo "Starting backend on port 3001..."
cd /Users/juanv/web2-web3-mvp/backend
PORT=3001 nohup node server.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "Starting frontend on port 5173..."
cd /Users/juanv/web2-web3-mvp/frontend
nohup npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 3

# Verify
echo ""
echo "Checking services..."
if lsof -i :3001 > /dev/null 2>&1; then
  echo "✅ Backend running on http://localhost:3001"
else
  echo "❌ Backend failed to start. Check: tail /tmp/backend.log"
fi

if lsof -i :5173 > /dev/null 2>&1; then
  echo "✅ Frontend running on http://localhost:5173"
else
  echo "❌ Frontend failed to start. Check: tail /tmp/frontend.log"
fi

echo ""
echo "To view logs:"
echo "  Backend: tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo "To stop:"
echo "  pkill -f 'node.*server.js'"
echo "  pkill -f 'vite'"
