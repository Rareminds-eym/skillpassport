#!/bin/bash

# College Registration Status Checker
# Quick script to verify everything is working

echo "🔍 Checking College Registration Status..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment setup OK${NC}"
echo ""

# Check if verification script exists
if [ -f "verify-college-registration.js" ]; then
    echo "📋 Running verification script..."
    echo ""
    node verify-college-registration.js
else
    echo -e "${YELLOW}⚠️ Verification script not found${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation Files:"
echo ""
echo "  Quick Start:"
echo "    • FINAL_STATUS.md - Current status and quick actions"
echo "    • COLLEGE_FIX_SUMMARY.md - Quick reference guide"
echo ""
echo "  Detailed Docs:"
echo "    • COLLEGE_REGISTRATION_FIX.md - Technical details"
echo "    • COLLEGE_REGISTRATION_SUCCESS.md - Success guide"
echo ""
echo "  Database Scripts:"
echo "    • quick-fix-colleges-table.sql - Quick fix (already applied)"
echo "    • database/migrations/004_fix_colleges_table.sql - Full migration"
echo "    • fix-all-entity-tables.sql - Fix schools & universities"
echo "    • check-audit-columns.sql - Verify all tables"
echo ""
echo "  Testing:"
echo "    • test-college-registration.js - Automated tests"
echo "    • verify-college-registration.js - Quick verification"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "  1. Test registration through UI:"
echo "     → /subscription/plans/college-admin/purchase"
echo ""
echo "  2. Verify college data in database:"
echo "     → Check Supabase Dashboard → Table Editor → colleges"
echo ""
echo "  3. Test complete flow:"
echo "     → Register → Payment → Dashboard access"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✨ College registration is ready to use!${NC}"
echo ""
