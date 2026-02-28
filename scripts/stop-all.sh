#!/bin/bash

# Stop All Development Servers Script
# Kills all running dev processes gracefully

echo "🛑 Stopping all development servers..."

# Function to kill process on port
kill_port() {
  local port=$1
  local name=$2
  local pid=$(lsof -ti:$port 2>/dev/null)
  
  if [ -n "$pid" ]; then
    echo "  ✓ Stopping $name on port $port (PID: $pid)"
    kill -15 $pid 2>/dev/null || kill -9 $pid 2>/dev/null
    sleep 0.5
  fi
}

# Stop all services by port
kill_port 3000 "Frontend (Vite)"
kill_port 8788 "Pages Functions"
kill_port 9001 "Email Worker"
kill_port 9002 "Embedding Worker"
kill_port 9003 "Payments Worker"

# Kill any remaining node processes related to the project
pkill -f "vite.*--mode development" 2>/dev/null
pkill -f "wrangler pages dev" 2>/dev/null
pkill -f "wrangler dev.*email-api" 2>/dev/null
pkill -f "wrangler dev.*embedding-api" 2>/dev/null
pkill -f "wrangler dev.*payments-api" 2>/dev/null
pkill -f "concurrently" 2>/dev/null

echo "✅ All servers stopped!"
