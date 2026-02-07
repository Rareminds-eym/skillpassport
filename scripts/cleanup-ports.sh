#!/bin/bash

echo "🧹 Cleaning up old processes..."

# Kill concurrently processes
pkill -9 -f "concurrently" 2>/dev/null && echo "✓ Killed concurrently processes" || echo "✓ No concurrently processes found"

# Kill wrangler processes
pkill -9 -f "wrangler" 2>/dev/null && echo "✓ Killed wrangler processes" || echo "✓ No wrangler processes found"

# Kill workerd processes
pkill -9 -f "workerd" 2>/dev/null && echo "✓ Killed workerd processes" || echo "✓ No workerd processes found"

# Wait for processes to fully terminate
sleep 0.5

# Kill specific ports if still occupied (with retry)
for port in 3000 8788 9001 9002 9003 9229 9230 9231; do
  for i in {1..3}; do
    if lsof -ti:$port >/dev/null 2>&1; then
      lsof -ti:$port | xargs kill -9 2>/dev/null
      sleep 0.2
    else
      [ $i -eq 1 ] && echo "✓ Port $port is free"
      break
    fi
  done
done

echo "✅ Cleanup complete! Starting services..."
sleep 1
