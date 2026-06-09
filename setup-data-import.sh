#!/bin/bash

echo "🚀 Setting up Data Import System"
echo "==============================="

# Check if we're in the skillpassport directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the skillpassport directory"
    exit 1
fi

echo "📦 Installing dependencies..."
cd functions
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

cd ..

echo "✅ Dependencies installed successfully"

# Check if .dev.vars exists
if [ ! -f ".dev.vars" ]; then
    echo "📝 Creating .dev.vars file..."
    touch .dev.vars
    echo "# Add your environment variables here" >> .dev.vars
    echo "# See .dev.vars.data-import.example for reference" >> .dev.vars
    echo "✅ Created .dev.vars file"
else
    echo "ℹ️  .dev.vars file already exists"
fi

# Copy example environment file
if [ -f ".dev.vars.data-import.example" ]; then
    echo "📋 Environment variable example available at .dev.vars.data-import.example"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Add environment variables to .dev.vars (see .dev.vars.data-import.example)"
echo "2. Deploy your functions: npx wrangler pages dev . --compatibility-date=2023-11-30"
echo "3. Access the data import interface at: http://localhost:8788/data-import.html"
echo "4. For production: Deploy to Cloudflare Pages and set environment variables"
echo ""
echo "📚 Documentation:"
echo "- See DATA_IMPORT_README.md for detailed instructions"
echo "- API endpoint: /api/data-import"
echo "- Web interface: /data-import.html"
echo ""
echo "⚠️  Important:"
echo "- Test with local environment first"
echo "- Import order: Universities → Colleges → Students"
echo "- Default student password: TempPass123!"

echo ""
echo "✨ Setup completed successfully!"