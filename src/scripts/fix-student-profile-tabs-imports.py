#!/usr/bin/env python3
"""
Fix student-profile tabs imports from ../components to ..
"""

import re
from pathlib import Path

def update_imports_in_file(filepath: Path) -> bool:
    """Update import statements in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Update imports from ../components to ..
        content = re.sub(
            r"from\s+['\"]\.\./(components|types)['\"]",
            "from '..'",
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
    tabs_dir = Path('src/features/student-profile/ui/tabs')
    
    print("🔍 Fixing student-profile tabs imports...")
    
    updated_count = 0
    for filepath in tabs_dir.glob('*.tsx'):
        if update_imports_in_file(filepath):
            updated_count += 1
            print(f"  ✅ Updated {filepath}")
    
    print(f"\n✅ Updated {updated_count} files")

if __name__ == '__main__':
    main()
