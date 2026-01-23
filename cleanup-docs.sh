#!/bin/bash

# Documentation Cleanup Script
# Organizes and archives old documentation files

echo "🧹 Starting documentation cleanup..."

# Create archive directories
mkdir -p docs/archive/{fixes,debug,old-implementations}
mkdir -p docs/guides
mkdir -p docs/implementation

# Move old fix/debug files to archive
echo "📦 Archiving old fix/debug files..."
mv *FIX*.md docs/archive/fixes/ 2>/dev/null || true
mv *DEBUG*.md docs/archive/debug/ 2>/dev/null || true
mv *TROUBLESHOOT*.md docs/archive/debug/ 2>/dev/null || true
mv *VERIFICATION*.md docs/archive/debug/ 2>/dev/null || true
mv *BUGFIX*.md docs/archive/fixes/ 2>/dev/null || true

# Move old implementation files
echo "📦 Archiving old implementation files..."
mv *IMPLEMENTATION*.md docs/archive/old-implementations/ 2>/dev/null || true
mv *INTEGRATION*.md docs/archive/old-implementations/ 2>/dev/null || true
mv *SETUP*.md docs/archive/old-implementations/ 2>/dev/null || true

# Keep important current documentation in root
echo "✅ Keeping current documentation in root:"
echo "  - README.md"
echo "  - PAYMENT_SYSTEM_COMPLETE.md"
echo "  - PAYMENT_HISTORY_REFACTORING_COMPLETE.md"
echo "  - PAYMENT_HISTORY_TESTING_GUIDE.md"

# Move guides to docs/guides
echo "📚 Moving guides to docs/guides..."
mv *GUIDE*.md docs/guides/ 2>/dev/null || true
mv *QUICK*.md docs/guides/ 2>/dev/null || true

# Restore important guides back to root
mv docs/guides/PAYMENT_HISTORY_TESTING_GUIDE.md . 2>/dev/null || true

# Count files
echo ""
echo "📊 Cleanup Summary:"
echo "  Fixes archived: $(ls docs/archive/fixes/*.md 2>/dev/null | wc -l)"
echo "  Debug files archived: $(ls docs/archive/debug/*.md 2>/dev/null | wc -l)"
echo "  Old implementations archived: $(ls docs/archive/old-implementations/*.md 2>/dev/null | wc -l)"
echo "  Guides moved: $(ls docs/guides/*.md 2>/dev/null | wc -l)"
echo "  Root MD files remaining: $(ls *.md 2>/dev/null | wc -l)"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📁 Documentation structure:"
echo "  Root: Current/active documentation"
echo "  docs/guides/: User guides and references"
echo "  docs/archive/: Historical fixes and debug files"
