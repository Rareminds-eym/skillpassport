#!/usr/bin/env python3
"""
Update imports from student-profile/ui/types to student-profile/model
"""

import re
from pathlib import Path

def update_imports_in_file(filepath: Path) -> bool:
    """Update import statements in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Update imports from ui/types to model
        content = re.sub(
            r"from\s+['\"]@/features/student-profile/ui/types['\"]",
            "from '@/features/student-profile/model'",
            content
        )
        
        # Also handle relative imports if any
        content = re.sub(
            r"from\s+['\"]\.\.?/types['\"]",
            "from '@/features/student-profile/model'",
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
    src_dir = Path('src')
    
    print("🔍 Updating student-profile imports...")
    
    updated_count = 0
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx'] and filepath.is_file():
            if update_imports_in_file(filepath):
                updated_count += 1
                print(f"  ✅ Updated {filepath}")
    
    print(f"\n✅ Updated {updated_count} files")

if __name__ == '__main__':
    main()
