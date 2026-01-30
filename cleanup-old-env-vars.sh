#!/bin/bash

# Cleanup Script: Remove Old Environment Variables and Update Services
# This script removes all old worker URL environment variables from .env
# and updates service files to use the new Pages Functions architecture

echo "🧹 Starting cleanup of old environment variables and hardcoded URLs..."
echo ""

# Backup .env file
echo "📦 Creating backup of .env file..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"
echo ""

# Remove old environment variables from .env
echo "🗑️  Removing old environment variables from .env..."
sed -i '/^VITE_ASSESSMENT_API_URL=/d' .env
sed -i '/^VITE_CAREER_API_URL=/d' .env
sed -i '/^VITE_COURSE_API_URL=/d' .env
sed -i '/^VITE_OTP_API_URL=/d' .env
sed -i '/^VITE_STORAGE_API_URL=/d' .env
sed -i '/^VITE_STREAK_API_URL=/d' .env
sed -i '/^VITE_USER_API_URL=/d' .env
sed -i '/^VITE_EMBEDDING_API_URL=/d' .env
sed -i '/^VITE_CLOUDFLARE_CERTIFICATE_WORKER_URL=/d' .env

echo "✅ Removed old environment variables from .env"
echo ""

echo "📝 Summary of changes:"
echo "   - Removed VITE_ASSESSMENT_API_URL"
echo "   - Removed VITE_CAREER_API_URL"
echo "   - Removed VITE_COURSE_API_URL"
echo "   - Removed VITE_OTP_API_URL"
echo "   - Removed VITE_STORAGE_API_URL"
echo "   - Removed VITE_STREAK_API_URL"
echo "   - Removed VITE_USER_API_URL"
echo "   - Removed VITE_EMBEDDING_API_URL"
echo "   - Removed VITE_CLOUDFLARE_CERTIFICATE_WORKER_URL"
echo ""

echo "✅ Cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the changes in .env"
echo "   2. Update service files to use getPagesApiUrl() utility"
echo "   3. Run tests to verify everything works"
echo "   4. Commit the changes"
echo ""
echo "💡 Note: A backup of your .env file was created (.env.backup.*)"
