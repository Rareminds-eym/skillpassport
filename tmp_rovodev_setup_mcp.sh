#!/bin/bash

# Setup MCP servers for Qoder
echo "Setting up MCP servers..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "Error: npx is not available. Please install npm/Node.js properly."
    exit 1
fi

echo "✓ Node.js and npx are available"

# Test each server
echo "Testing MCP servers..."

echo "1. Testing Sequential Thinking server..."
if npx -y @modelcontextprotocol/server-sequential-thinking --help &>/dev/null; then
    echo "✓ Sequential Thinking server is accessible"
else
    echo "✗ Sequential Thinking server failed"
fi

echo "2. Testing Context7 server..."
if npx -y @upstash/context7-mcp --help &>/dev/null; then
    echo "✓ Context7 server is accessible"
else
    echo "✗ Context7 server failed"
fi

echo "3. Testing Filesystem server..."
if npx -y @modelcontextprotocol/server-filesystem --help &>/dev/null; then
    echo "✓ Filesystem server is accessible"
else
    echo "✗ Filesystem server failed"
fi

# Check if config directory exists
CONFIG_DIR="$HOME/Library/Application Support/Qoder/SharedClientCache"
if [ ! -d "$CONFIG_DIR" ]; then
    echo "Warning: Qoder config directory doesn't exist: $CONFIG_DIR"
    echo "Make sure Qoder is installed and has been run at least once."
else
    echo "✓ Qoder config directory exists"
fi

echo "Done! Now:"
echo "1. Add the MCP configuration to: $CONFIG_DIR/mcp.json"
echo "2. Restart Qoder"
echo "3. Check if MCP servers are loaded in Qoder"