#!/bin/bash

# Assessment Test E2E Runner Script
# This script sets up the environment and runs Puppeteer tests

set -e

echo "🧪 Assessment Test E2E Runner"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if server is running
check_server() {
    local url=$1
    echo "🔍 Checking if server is running at $url..."
    
    if curl -s --head --request GET "$url" | grep "200\|301\|302" > /dev/null; then
        echo -e "${GREEN}✅ Server is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Server is not running${NC}"
        return 1
    fi
}

# Start development server if needed
start_server() {
    echo "🚀 Starting development server..."
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to be ready
    echo "⏳ Waiting for server to be ready..."
    for i in {1..30}; do
        if check_server "http://localhost:3000" 2>/dev/null; then
            echo -e "${GREEN}✅ Server is ready${NC}"
            return 0
        fi
        sleep 2
    done
    
    echo -e "${RED}❌ Server failed to start${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
}

# Cleanup function
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        echo "🧹 Cleaning up..."
        kill $SERVER_PID 2>/dev/null || true
    fi
}

trap cleanup EXIT

# Parse arguments
HEADLESS=${HEADLESS:-true}
SLOW_MO=${SLOW_MO:-0}
START_SERVER=${START_SERVER:-false}

while [[ $# -gt 0 ]]; do
    case $1 in
        --visible)
            HEADLESS=false
            shift
            ;;
        --slow)
            SLOW_MO=100
            shift
            ;;
        --start-server)
            START_SERVER=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Check if we need to start the server
if [ "$START_SERVER" = true ]; then
    start_server
else
    if ! check_server "${TEST_BASE_URL:-http://localhost:3000}"; then
        echo -e "${YELLOW}⚠️  Server is not running. Use --start-server to start it automatically${NC}"
        exit 1
    fi
fi

# Run tests
echo ""
echo "🧪 Running E2E tests..."
echo "   Headless: $HEADLESS"
echo "   Slow Motion: ${SLOW_MO}ms"
echo ""

export HEADLESS=$HEADLESS
export SLOW_MO=$SLOW_MO

# Run with Jest
cd tests/e2e && npx jest --config jest.config.cjs --verbose

echo ""
echo -e "${GREEN}✅ Tests completed!${NC}"
