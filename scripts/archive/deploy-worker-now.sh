#!/bin/bash

# Quick deployment script for Cloudflare Worker
# This deploys the enhanced AI prompt with student program context

echo "🚀 Deploying Cloudflare Worker with AI Enhancement..."
echo ""

cd cloudflare-workers/career-api

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building worker..."
npm run build

echo ""
echo "🚀 Deploying to Cloudflare..."
npm run deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Click 'Regenerate Report' button"
echo "3. Check console for: '📚 Student Context: PG Year 1 (MCA)'"
echo "4. Verify AI recommendations are program-specific"
