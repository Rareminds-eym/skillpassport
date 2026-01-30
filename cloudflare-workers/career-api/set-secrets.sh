#!/bin/bash
# Set secrets for career-api Cloudflare Worker
# Run from cloudflare-workers/career-api directory

# Usage: ./set-secrets.sh
# Make sure you're logged in: npx wrangler login

echo "Setting secrets for career-api worker..."

# Read from .env file in project root or set manually
npx wrangler secret put VITE_SUPABASE_URL
npx wrangler secret put VITE_SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put VITE_OPENROUTER_API_KEY

echo "Done! Secrets configured."
