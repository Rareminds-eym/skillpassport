#!/bin/bash

echo "🧪 Setting up Local Testing Environment"
echo "====================================="
echo ""
echo "This will create completely isolated Docker containers"
echo "for testing data import without affecting production."
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install docker-compose."
    exit 1
fi

echo "✅ Docker is running"

# Stop any existing containers
echo "🛑 Stopping any existing test containers..."
docker-compose -f docker-compose.local-test.yml down >/dev/null 2>&1

# Remove any existing volumes (fresh start)
echo "🗑️  Cleaning up old test data..."
docker volume rm sso-local-test-data >/dev/null 2>&1
docker volume rm skillpassport-local-test-data >/dev/null 2>&1

# Start fresh containers
echo "🚀 Starting local Supabase instances..."
docker-compose -f docker-compose.local-test.yml up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start Docker containers"
    exit 1
fi

echo "⏳ Waiting for databases to be ready..."
sleep 10

# Check if containers are running
sso_running=$(docker ps --filter "name=sso-supabase-db-test" --filter "status=running" -q)
sp_running=$(docker ps --filter "name=skillpassport-supabase-db-test" --filter "status=running" -q)

if [ -z "$sso_running" ] || [ -z "$sp_running" ]; then
    echo "❌ Some containers failed to start properly"
    echo "🔍 Container status:"
    docker-compose -f docker-compose.local-test.yml ps
    exit 1
fi

echo "✅ Local databases are running"

# Set up environment variables
echo "📝 Setting up environment variables..."

# Copy test environment variables
cp .dev.vars.local-test .dev.vars

echo "✅ Environment configured for local testing only"

# Install dependencies if needed
if [ ! -d "functions/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd functions
    npm install
    cd ..
fi

echo ""
echo "🎉 Local testing environment is ready!"
echo ""
echo "📊 Database Information:"
echo "  SSO Database:         http://localhost:54321"
echo "  Skillpassport Database: http://localhost:54322"
echo ""
echo "🌐 Next Steps:"
echo "1. Start the development server:"
echo "   npx wrangler pages dev . --compatibility-date=2023-11-30"
echo ""
echo "2. Access the data import interface:"
echo "   http://localhost:8788/data-import.html"
echo ""
echo "3. Import test data (only goes to local Docker databases):"
echo "   - Download templates"
echo "   - Fill with test data"
echo "   - Import using 'Local' environment"
echo ""
echo "🔒 Safety Features Enabled:"
echo "  ✅ FORCE_LOCAL_ONLY mode active"
echo "  ✅ Production access disabled"
echo "  ✅ Isolated Docker containers"
echo "  ✅ Fresh databases (no existing data)"
echo ""
echo "🛑 To stop testing environment:"
echo "   docker-compose -f docker-compose.local-test.yml down"
echo ""
echo "🗑️  To clean up all test data:"
echo "   docker-compose -f docker-compose.local-test.yml down -v"