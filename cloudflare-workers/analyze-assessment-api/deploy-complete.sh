#!/bin/bash

# Complete Deployment Script for Analyze Assessment API
# This script handles everything: install, secrets, and deploy

set -e  # Exit on error

echo "🚀 Complete Deployment - Analyze Assessment API"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if wrangler is available
echo "📦 Step 1/5: Checking Wrangler CLI..."
if ! command -v wrangler &> /dev/null; then
    echo "${YELLOW}Wrangler not found. Installing...${NC}"
    npm install -g wrangler
fi
echo "${GREEN}✅ Wrangler CLI ready${NC}"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2/5: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo "${GREEN}✅ Dependencies installed${NC}"
else
    echo "${GREEN}✅ Dependencies already installed${NC}"
fi
echo ""

# Step 3: Check if logged in
echo "🔐 Step 3/5: Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "${YELLOW}Not logged in. Opening browser for authentication...${NC}"
    wrangler login
fi
echo "${GREEN}✅ Authenticated with Cloudflare${NC}"
echo ""

# Step 4: Set secrets
echo "🔑 Step 4/5: Setting production secrets..."
echo ""
echo "${YELLOW}You'll be prompted to enter 4 secrets.${NC}"
echo "${YELLOW}Press Ctrl+C to cancel at any time.${NC}"
echo ""

read -p "Do you want to set/update secrets now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Setting VITE_SUPABASE_URL..."
    echo "https://dpooleduinyyzxgrcwko.supabase.co" | wrangler secret put VITE_SUPABASE_URL
    
    echo ""
    echo "Setting VITE_SUPABASE_ANON_KEY..."
    echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTQ2OTgsImV4cCI6MjA3NTU3MDY5OH0.LvId6Cq13yeASDt0RXbb0y83P2xAZw0L1Q4KJAXT4jk" | wrangler secret put VITE_SUPABASE_ANON_KEY
    
    echo ""
    echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
    echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk5NDY5OCwiZXhwIjoyMDc1NTcwNjk4fQ.WIrwkA_-2oCjwmD6WpCf9N38hYXEwrIIXXHB4x5km10" | wrangler secret put SUPABASE_SERVICE_ROLE_KEY
    
    echo ""
    echo "Setting OPENROUTER_API_KEY..."
    echo "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" | wrangler secret put OPENROUTER_API_KEY
    
    echo ""
    echo "${GREEN}✅ All secrets configured${NC}"
else
    echo "${YELLOW}⚠️  Skipping secrets setup. Make sure they're already configured!${NC}"
fi
echo ""

# Step 5: Deploy
echo "🌐 Step 5/5: Deploying to Cloudflare..."
wrangler deploy

echo ""
echo "${GREEN}================================================${NC}"
echo "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "${GREEN}================================================${NC}"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Copy your worker URL from the output above"
echo ""
echo "2. Update your frontend .env file:"
echo "   ${YELLOW}VITE_ASSESSMENT_API_URL=https://analyze-assessment-api.YOUR_SUBDOMAIN.workers.dev${NC}"
echo ""
echo "3. Test the endpoint:"
echo "   ${YELLOW}./test-endpoint.sh https://analyze-assessment-api.YOUR_SUBDOMAIN.workers.dev${NC}"
echo ""
echo "4. Monitor logs:"
echo "   ${YELLOW}npm run tail${NC}"
echo ""
echo "🎉 Your assessment analysis API is now live!"
