#!/bin/bash

# Setup Mock Data for Lesson Plans & Timetable Testing
# This script applies all necessary migrations and inserts mock data

echo "🚀 Setting up mock data for Lesson Plans & Timetable..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "${YELLOW}⚠️  psql not found. Please install PostgreSQL client or use Supabase SQL Editor.${NC}"
    echo ""
    echo "Alternative: Copy and paste SQL files in Supabase Dashboard → SQL Editor"
    echo "1. supabase/migrations/teacher_management_schema.sql"
    echo "2. supabase/migrations/role_based_permissions.sql"
    echo "3. supabase/migrations/lesson_plans_schema.sql"
    echo "4. supabase/migrations/mock_data_lesson_plans_timetable.sql"
    exit 1
fi

# Database connection details
echo "${BLUE}📝 Enter your database connection details:${NC}"
read -p "Host (e.g., db.xxx.supabase.co): " DB_HOST
read -p "Database name (default: postgres): " DB_NAME
DB_NAME=${DB_NAME:-postgres}
read -p "Username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}
read -sp "Password: " DB_PASSWORD
echo ""
echo ""

# Export password for psql
export PGPASSWORD=$DB_PASSWORD

echo "${BLUE}📦 Step 1: Applying Teacher Management Schema...${NC}"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f supabase/migrations/teacher_management_schema.sql
if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Teacher Management Schema applied${NC}"
else
    echo "${YELLOW}⚠️  Schema might already exist or there was an error${NC}"
fi
echo ""

echo "${BLUE}📦 Step 2: Applying Role-Based Permissions...${NC}"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f supabase/migrations/role_based_permissions.sql
if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Role-Based Permissions applied${NC}"
else
    echo "${YELLOW}⚠️  Permissions might already exist or there was an error${NC}"
fi
echo ""

echo "${BLUE}📦 Step 3: Applying Lesson Plans Schema...${NC}"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f supabase/migrations/lesson_plans_schema.sql
if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Lesson Plans Schema applied${NC}"
else
    echo "${YELLOW}⚠️  Schema might already exist or there was an error${NC}"
fi
echo ""

echo "${BLUE}📦 Step 4: Inserting Mock Data...${NC}"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f supabase/migrations/mock_data_lesson_plans_timetable.sql
if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Mock Data inserted${NC}"
else
    echo "${YELLOW}⚠️  Data might already exist or there was an error${NC}"
fi
echo ""

# Clear password
unset PGPASSWORD

echo "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "${BLUE}📚 Mock Users Created:${NC}"
echo "  School Admin: admin@springfield.edu"
echo "  Principal: principal@springfield.edu"
echo "  Math Teacher: robert.smith@springfield.edu"
echo "  English Teacher: emily.johnson@springfield.edu"
echo "  Chemistry Teacher: michael.brown@springfield.edu"
echo "  History Teacher: lisa.davis@springfield.edu"
echo ""
echo "${BLUE}📊 Mock Data Summary:${NC}"
echo "  • 6 Teachers with different roles"
echo "  • 20+ Timetable slots"
echo "  • 7 Lesson plans (various statuses)"
echo "  • 2 Journal entries"
echo ""
echo "${BLUE}🧪 Next Steps:${NC}"
echo "  1. Set user role in localStorage:"
echo "     localStorage.setItem('user', JSON.stringify({email: 'robert.smith@springfield.edu', role: 'subject_teacher'}))"
echo "  2. Navigate to /educator/my-timetable"
echo "  3. Navigate to /educator/lesson-plans"
echo "  4. Navigate to /school-admin/lesson-plans/approvals (as admin)"
echo ""
echo "${BLUE}📖 See TESTING_GUIDE_LESSON_PLANS.md for detailed test scenarios${NC}"
