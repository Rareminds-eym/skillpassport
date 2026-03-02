#!/bin/bash

# Script to ensure Docker is running before starting development

echo "🐳 Checking Docker status..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "   Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "🚀 Docker is not running. Starting Docker Desktop..."
    
    # Detect OS and start Docker accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open -a Docker
        echo "⏳ Waiting for Docker to start..."
        
        # Wait for Docker to be ready (max 60 seconds)
        counter=0
        while ! docker info &> /dev/null && [ $counter -lt 60 ]; do
            sleep 2
            counter=$((counter + 2))
            echo "   Still waiting... ($counter seconds)"
        done
        
        if docker info &> /dev/null; then
            echo "✅ Docker is now running!"
        else
            echo "❌ Docker failed to start within 60 seconds."
            echo "   Please start Docker Desktop manually and try again."
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start docker
        echo "✅ Docker service started!"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        echo "⚠️  Please start Docker Desktop manually on Windows"
        echo "   Then run this script again."
        exit 1
    else
        echo "❌ Unsupported OS: $OSTYPE"
        exit 1
    fi
else
    echo "✅ Docker is already running!"
fi

echo ""
echo "🎉 Ready to start development!"
