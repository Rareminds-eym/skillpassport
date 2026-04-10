#!/usr/bin/env python3
"""
Fix assessment feature imports from ../config/ to ../lib/config/
"""

import re
from pathlib import Path

def update_imports_in_file(filepath: Path) -> bool:
    """Update import statements in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Update relative imports from ../config/ to ../lib/config/
        content = re.sub(
            r"from\s+['\"]\.\./(config/[^'\"]+)['\"]",
            r"from '../lib/\1'",
            content
        )
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    except Exception as e:
        print(f"Error updating {filepath}: {e}")
    
    return False

def main():
    """Main execution function."""
    assessment_dir = Path('src/features/assessment')
    
    print("🔍 Fixing assessment config imports...")
    
    updated_count = 0
    for filepath in assessment_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx'] and filepath.is_file():
            if update_imports_in_file(filepath):
                updated_count += 1
                print(f"  ✅ Updated {filepath}")
    
    print(f"\n✅ Updated {updated_count} files")

if __name__ == '__main__':
    main()
