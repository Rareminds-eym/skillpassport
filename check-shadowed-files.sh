#!/bin/bash

# Script to find .js files that might be shadowing .ts files
# This helps prevent build issues where old compiled files are used instead of source files

echo "🔍 Checking for .js files that shadow .ts files..."
echo ""

FOUND=0

# Check for .ts files with corresponding .js files
while IFS= read -r ts_file; do
    js_file="${ts_file%.ts}.js"
    if [ -f "$js_file" ]; then
        echo "⚠️  SHADOW DETECTED:"
        echo "   TypeScript: $ts_file"
        echo "   JavaScript: $js_file"
        echo ""
        FOUND=$((FOUND + 1))
    fi
done < <(find src -name "*.ts" -type f ! -name "*.d.ts" ! -path "*/node_modules/*")

# Check for .tsx files with corresponding .jsx files
while IFS= read -r tsx_file; do
    jsx_file="${tsx_file%.tsx}.jsx"
    if [ -f "$jsx_file" ]; then
        echo "⚠️  SHADOW DETECTED:"
        echo "   TypeScript: $tsx_file"
        echo "   JavaScript: $jsx_file"
        echo ""
        FOUND=$((FOUND + 1))
    fi
done < <(find src -name "*.tsx" -type f ! -path "*/node_modules/*")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FOUND -eq 0 ]; then
    echo "✅ No shadowed files found!"
else
    echo "⚠️  Found $FOUND shadowed file(s)"
    echo ""
    echo "These .js/.jsx files may cause build issues if they contain"
    echo "outdated code. Consider deleting them if they're not needed."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
