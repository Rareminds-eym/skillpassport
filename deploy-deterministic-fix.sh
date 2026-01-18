#!/bin/bash

# Deploy Deterministic Results Fix
# This script deploys the updated analyze-assessment-api worker with seed parameter

echo "🚀 Deploying Deterministic Results Fix"
echo "======================================="
echo ""

# Navigate to worker directory
cd cloudflare-workers/analyze-assessment-api || exit 1

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
echo "🧪 Testing instructions:"
echo "1. Go to assessment result page"
echo "2. Click 'Regenerate' button"
echo "3. Note the results"
echo "4. Click 'Regenerate' again"
echo "5. Verify results are IDENTICAL"
echo ""
echo "📊 Check console for:"
echo "   [AI] Using deterministic seed: <number> for consistent results"
echo ""
