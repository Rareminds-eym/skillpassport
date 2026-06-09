#!/bin/bash

echo "🚀 Data Import System - Deployment Script"
echo "========================================="

# Check setup first
echo "🔍 Running setup validation..."
node check-data-import-setup.js

if [ $? -ne 0 ]; then
    echo "❌ Setup validation failed. Please fix issues before deploying."
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
cd functions
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

cd ..

echo "✅ Dependencies installed"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📥 Installing Wrangler CLI..."
    npm install -g wrangler
fi

echo ""
echo "🌐 Choose deployment option:"
echo "1. Local development server"
echo "2. Deploy to Cloudflare Pages"
echo "3. Both (local first, then deploy)"

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🖥️  Starting local development server..."
        echo "📍 Data Import URL: http://localhost:8788/data-import.html"
        echo "📍 API Endpoint: http://localhost:8788/api/data-import"
        echo ""
        echo "Press Ctrl+C to stop the server"
        npx wrangler pages dev . --compatibility-date=2023-11-30
        ;;
    2)
        echo "☁️  Deploying to Cloudflare Pages..."
        npx wrangler pages deploy .
        
        if [ $? -eq 0 ]; then
            echo "✅ Deployment successful!"
            echo "📍 Your data import interface should be available at:"
            echo "   https://your-domain.pages.dev/data-import.html"
        else
            echo "❌ Deployment failed"
            exit 1
        fi
        ;;
    3)
        echo "🖥️  Starting local development server first..."
        echo "📍 Local URL: http://localhost:8788/data-import.html"
        echo ""
        echo "Test locally, then press Ctrl+C and confirm to deploy to production"
        
        npx wrangler pages dev . --compatibility-date=2023-11-30 &
        local_pid=$!
        
        echo ""
        read -p "Press Enter after testing locally to deploy to production (or Ctrl+C to cancel)..."
        
        kill $local_pid
        
        echo "☁️  Deploying to Cloudflare Pages..."
        npx wrangler pages deploy .
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Usage Instructions:"
echo "1. Access the data import interface"
echo "2. Choose 'Local' environment for testing"
echo "3. Download templates for universities, colleges, students"
echo "4. Fill templates with your data"
echo "5. Upload in order: Universities → Colleges → Students"
echo "6. Default password for all users: rareminds123!"
echo ""
echo "🔒 Security Notes:"
echo "• Test with local environment first"
echo "• Use FORCE_LOCAL_ONLY=true for development"
echo "• Backup production databases before importing"
echo "• Email verification is automatically set to true"