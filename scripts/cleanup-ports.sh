#!/bin/bash

echo "🧹 Cleaning up old processes and build cache..."

# Clean build artifacts and cache
rm -rf dist node_modules/.vite 2>/dev/null && echo "✓ Cleaned dist and vite cache" || echo "✓ No cache to clean"

# Kill concurrently processes
pkill -9 -f "concurrently" 2>/dev/null && echo "✓ Killed concurrently processes" || echo "✓ No concurrently processes found"

# Kill wrangler processes
pkill -9 -f "wrangler" 2>/dev/null && echo "✓ Killed wrangler processes" || echo "✓ No wrangler processes found"

# Kill workerd processes
pkill -9 -f "workerd" 2>/dev/null && echo "✓ Killed workerd processes" || echo "✓ No workerd processes found"

# Kill specific ports if still occupied
for port in 3000 8788 9001 9002 9003 9229 9230 9231; do
  if lsof -ti:$port >/dev/null 2>&1; then
    echo "  Killing process on port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null
    sleep 0.5
    if lsof -ti:$port >/dev/null 2>&1; then
      echo "⚠ Could not free port $port"
    else
      echo "✓ Freed port $port"
    fi
  fi
done

echo "✅ Cleanup complete! Starting services..."
sleep 1
