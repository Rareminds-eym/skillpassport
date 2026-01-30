#!/bin/bash

# Deploy Analyze Assessment API to Cloudflare Workers

echo "🚀 Deploying Analyze Assessment API..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Deploy
echo "🌐 Deploying to Cloudflare..."
wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Set secrets if not already done:"
echo "   wrangler secret put VITE_SUPABASE_URL"
echo "   wrangler secret put VITE_SUPABASE_ANON_KEY"
echo "   wrangler secret put SUPABASE_SERVICE_ROLE_KEY"
echo "   wrangler secret put OPENROUTER_API_KEY"
echo ""
echo "2. Update your frontend .env file with the worker URL:"
echo "   VITE_ASSESSMENT_API_URL=https://analyze-assessment-api.YOUR_SUBDOMAIN.workers.dev"
echo ""
echo "3. Test the endpoint:"
echo "   curl https://analyze-assessment-api.YOUR_SUBDOMAIN.workers.dev/health"
