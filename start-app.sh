#!/bin/bash

# Resume Parser App Startup Script
# Serves the production build to avoid rate limiting

echo "🚀 Starting Resume Parser App..."

# Navigate to app directory
cd /app

# Check if dist folder exists, if not build it
if [ ! -d "dist" ]; then
    echo "📦 Building production bundle..."
    yarn build
fi

# Kill any existing vite processes
echo "🧹 Cleaning up existing processes..."
pkill -f "vite" 2>/dev/null

# Wait a moment
sleep 2

# Start production server
echo "✅ Starting production server on port 3000..."
yarn preview --host 0.0.0.0 --port 3000 > /var/log/frontend.log 2>&1 &

# Wait for server to start
sleep 5

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is running successfully!"
    echo "🌐 Access at: http://localhost:3000"
else
    echo "❌ Server failed to start. Check /var/log/frontend.log"
    exit 1
fi

echo "📝 Logs: tail -f /var/log/frontend.log"
