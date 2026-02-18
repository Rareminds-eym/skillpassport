#!/bin/bash

# Setup Adaptive Question Bank
# This script:
# 1. Runs the database migrations
# 2. Imports questions from CSV

echo "🚀 Setting up Adaptive Question Bank..."
echo ""

# Check if CSV file exists
if [ ! -f "Adaptive_Aptitud_Question bank.csv" ]; then
    echo "❌ Error: Adaptive_Aptitud_Question bank.csv not found"
    exit 1
fi

echo "✅ CSV file found"
echo ""

# Run migrations
echo "📦 Running database migrations..."
echo "   Please run these migrations in your Supabase dashboard:"
echo "   1. supabase/migrations/20260215000000_create_adaptive_question_bank.sql"
echo "   2. supabase/migrations/20260215000001_add_responses_jsonb_column.sql"
echo ""

# Import questions
echo "📥 Importing questions from CSV..."
node scripts/import-adaptive-questions.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Next steps:"
echo "   1. Verify questions in Supabase dashboard"
echo "   2. Test the adaptive assessment"
echo "   3. All responses will be stored in adaptive_aptitude_sessions.all_responses"
