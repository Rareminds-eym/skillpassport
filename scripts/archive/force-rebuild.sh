#!/bin/bash

echo "🔥 Forcing complete rebuild..."
echo ""

# Clear all caches
echo "1️⃣ Clearing caches..."
rm -rf node_modules/.vite dist .next 2>/dev/null
echo "   ✅ Caches cleared"
echo ""

# Touch the file to trigger rebuild
echo "2️⃣ Triggering rebuild..."
touch src/features/assessment/assessment-result/hooks/useAssessmentResults.js
echo "   ✅ File touched"
echo ""

# Verify fire emoji is in source
echo "3️⃣ Verifying source code..."
if grep -q "🔥🔥🔥 useAssessmentResults hook loaded" src/features/assessment/assessment-result/hooks/useAssessmentResults.js; then
    echo "   ✅ Fire emoji found in source code"
else
    echo "   ❌ Fire emoji NOT found in source code!"
    exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ready for rebuild!"
echo ""
echo "Now do this:"
echo "1. Check your terminal where 'npm run dev' is running"
echo "2. You should see: ✓ built in XXXms"
echo "3. In browser: Clear site data (DevTools → Application → Clear storage)"
echo "4. Hard refresh: Ctrl+Shift+R"
echo "5. Open console and look for 🔥 fire emoji"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
