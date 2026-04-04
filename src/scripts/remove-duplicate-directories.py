#!/usr/bin/env python3
"""
Script to safely remove duplicate feature directories after consolidation.
This completes task 3.5 by removing the old duplicate directories.

IMPORTANT: Only run this after verifying no references exist!
"""

import shutil
from pathlib import Path
import sys

# Directories to remove (duplicates that have been consolidated)
DUPLICATE_DIRS = [
    Path('src/features/admin/ui/collegeAdmin'),
    Path('src/features/admin/ui/universityAdmin'),
]

def main():
    """Remove duplicate directories."""
    print("="*60)
    print("Removing duplicate feature directories")
    print("="*60)
    
    removed_count = 0
    
    for dir_path in DUPLICATE_DIRS:
        if dir_path.exists():
            try:
                # Count files before removal
                files = list(dir_path.rglob('*'))
                file_count = len([f for f in files if f.is_file()])
                
                print(f"\nRemoving: {dir_path}")
                print(f"  Contains {file_count} files")
                
                # Remove directory
                shutil.rmtree(dir_path)
                print(f"  ✓ Removed successfully")
                removed_count += 1
                
            except Exception as e:
                print(f"  ❌ Error removing {dir_path}: {e}")
                return 1
        else:
            print(f"\n✓ Already removed: {dir_path}")
    
    print("\n" + "="*60)
    print(f"Summary: Removed {removed_count} duplicate directories")
    print("="*60)
    
    if removed_count > 0:
        print("\n✓ Duplicate directories successfully removed")
        print("\nNext steps:")
        print("  1. Run: npm run build:dev")
        print("  2. Verify build passes")
        print("  3. Commit changes")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
