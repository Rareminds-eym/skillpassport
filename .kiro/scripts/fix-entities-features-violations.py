#!/usr/bin/env python3
"""
Script to fix entities→features import violations by updating import paths.

This script updates type imports from @/features/student-profile/model to @/shared/types
which is the correct FSD location for shared types.
"""

import re
from pathlib import Path

def fix_file(filepath: Path) -> bool:
    """
    Fix entities→features violations in a single file by replacing
    @/features/student-profile/model with @/shared/types.
    Returns True if file was modified.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return False
    
    original_content = content
    
    # Simple replacement: @/features/student-profile/model → @/shared/types
    new_content = content.replace(
        "'@/features/student-profile/model'",
        "'@/shared/types'"
    ).replace(
        '"@/features/student-profile/model"',
        '"@/shared/types"'
    )
    
    if new_content != original_content:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✓ Fixed: {filepath}")
            return True
        except Exception as e:
            print(f"Error writing {filepath}: {e}")
            return False
    
    return False

def main():
    """Main execution function."""
    src_dir = Path('src')
    entities_dir = src_dir / 'entities'
    
    if not entities_dir.exists():
        print(f"Error: {entities_dir} does not exist")
        return
    
    # Find all TypeScript/TSX files in entities
    files_to_fix = []
    for ext in ['*.ts', '*.tsx']:
        files_to_fix.extend(entities_dir.rglob(ext))
    
    print(f"Found {len(files_to_fix)} files to check in entities layer")
    print("=" * 80)
    
    fixed_count = 0
    for filepath in files_to_fix:
        if fix_file(filepath):
            fixed_count += 1
    
    print("=" * 80)
    print(f"Fixed {fixed_count} files")

if __name__ == '__main__':
    main()
