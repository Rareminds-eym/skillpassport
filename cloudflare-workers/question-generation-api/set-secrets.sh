#!/bin/bash

# Set Cloudflare Worker Secrets for Question Generation API

echo "🔐 Setting up secrets for Question Generation API"
echo ""
echo "This script will prompt you to enter each secret value."
echo "Press Ctrl+C to cancel at any time."
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    
    echo "Setting $secret_name ($secret_description)..."
    wrangler secret put "$secret_name"
    
    if [ $? -eq 0 ]; then
        echo "✅ $secret_name set successfully"
    else
        echo "❌ Failed to set $secret_name"
        return 1
    fi
    echo ""
}

# Set each secret
set_secret "VITE_SUPABASE_URL" "Supabase project URL"
set_secret "VITE_SUPABASE_ANON_KEY" "Supabase anonymous key"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "Supabase service role key (for cache writes)"
set_secret "OPENROUTER_API_KEY" "OpenRouter API key (for adaptive questions)"
set_secret "CLAUDE_API_KEY" "Claude API key (for career/course questions)"

echo ""
echo "✅ All secrets configured!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy the worker: npm run deploy"
echo "2. Test the endpoint: curl https://question-generation-api.YOUR_SUBDOMAIN.workers.dev/health"
