#!/bin/bash

# Array of worker directories
WORKERS=(
  "career-api"
  "course-api"
  "payments-api"
  "user-api"
  "storage-api"
  "streak-api"
  "fetch-certificate"
)

echo "🚀 Starting deployment of Cloudflare Workers..."

# Loop through each worker and deploy
for worker in "${WORKERS[@]}"; do
  echo "--------------------------------------------------"
  echo "📦 Deploying $worker..."
  echo "--------------------------------------------------"
  
  cd "cloudflare-workers/$worker" || exit
  
  # Install dependencies if node_modules is missing
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies for $worker..."
    npm install
  fi
  
  # Deploy
  npm run deploy
  
  # Check if deployment was successful
  if [ $? -eq 0 ]; then
    echo "✅ $worker deployed successfully!"
  else
    echo "❌ Failed to deploy $worker"
    exit 1
  fi
  
  # Go back to root
  cd ../..
done

echo "--------------------------------------------------"
echo "🎉 All Cloudflare Workers deployed successfully!"
echo "--------------------------------------------------"
