#!/bin/bash

# Quick script to run the experience JSONB cleanup
# This removes invalid fields like org_name from verified_data and pending_edit_data

echo "🧹 Cleaning invalid fields from experience JSONB columns..."
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Please run the SQL manually:"
    echo "1. Open Supabase Dashboard → SQL Editor"
    echo "2. Copy contents of clean-all-invalid-fields-from-experience.sql"
    echo "3. Paste and run in SQL Editor"
    exit 1
fi

# Run the cleanup script
echo "Running cleanup script..."
cat clean-all-invalid-fields-from-experience.sql | supabase db query

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Try editing an experience"
echo "3. The org_name error should be gone"
