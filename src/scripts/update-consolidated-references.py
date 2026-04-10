#!/usr/bin/env python3
"""
Script to update all import references to consolidated features.
This addresses task 3.5 of the FSD violations cleanup.

Consolidations completed in tasks 3.1-3.4:
- collegeAdmin: src/features/admin/ui/collegeAdmin/ -> src/features/college-admin/
- universityAdmin: src/features/admin/ui/universityAdmin/ -> (needs target location)
- student-dashboard: Already in widgets/student-dashboard/
- digital-passport: Renamed to digital-portfolio in features/
"""

import re
from pathlib import Path
from typing import List, Tuple, Dict
import sys

# Define consolidation mappings
CONSOLIDATIONS = {
    # Old path -> New path
    '@/features/admin/ui/collegeAdmin': '@/features/college-admin',
    '@/features/admin/ui/universityAdmin': '@/features/university-ai',  # Based on directory structure
    '@/features/student-dashboard': '@/widgets/student-dashboard',
    '@/features/digital-passport': '@/features/digital-portfolio',
}

# Relative path patterns that might reference consolidated features
RELATIVE_PATTERNS = [
    (r'from [\'"](\.\./)+features/admin/ui/collegeAdmin', '@/features/college-admin'),
    (r'from [\'"](\.\./)+features/admin/ui/universityAdmin', '@/features/university-ai'),
    (r'from [\'"](\.\./)+features/student-dashboard', '@/widgets/student-dashboard'),
    (r'from [\'"](\.\./)+features/digital-passport', '@/features/digital-portfolio'),
]

def find_source_files(root_dir: Path) -> List[Path]:
    """Find all TypeScript and JavaScript files in src directory."""
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    files = []
    
    for ext in extensions:
        files.extend(root_dir.rglob(f'*{ext}'))
    
    # Exclude node_modules and migration backups
    files = [f for f in files if 'node_modules' not in str(f) and '.migration-backups' not in str(f)]
    
    return files

def update_imports_in_file(filepath: Path) -> Tuple[bool, List[str]]:
    """
    Update import statements in a file.
    Returns (was_modified, list_of_changes)
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return False, []
    
    original_content = content
    changes = []
    
    # Update absolute imports
    for old_path, new_path in CONSOLIDATIONS.items():
        # Match imports with or without specific file paths
        # Pattern: from '@/features/admin/ui/collegeAdmin/Component' or from '@/features/admin/ui/collegeAdmin'
        pattern = re.escape(old_path) + r'(/[^\'\"]*)?'
        
        def replace_import(match):
            full_match = match.group(0)
            subpath = match.group(1) if match.group(1) else ''
            
            # For collegeAdmin and universityAdmin, components are now in /ui/ subdirectory
            if 'collegeAdmin' in old_path or 'universityAdmin' in old_path:
                if subpath:
                    # Extract just the component name
                    component = subpath.split('/')[-1] if '/' in subpath else subpath
                    new_import = f"{new_path}/ui/{component}" if component else new_path
                else:
                    new_import = new_path
            else:
                new_import = new_path + subpath
            
            changes.append(f"  {old_path}{subpath} -> {new_import}")
            return new_import
        
        content = re.sub(pattern, replace_import, content)
    
    # Update relative imports
    for pattern, new_base in RELATIVE_PATTERNS:
        matches = re.finditer(pattern, content)
        for match in matches:
            old_import = match.group(0)
            # Extract the part after the feature name
            remaining = old_import.split('/')[-1] if '/' in old_import else ''
            new_import = f"from '{new_base}"
            if remaining and remaining not in ["'", '"']:
                new_import += f"/{remaining}"
            else:
                new_import += "'"
            
            content = content.replace(old_import, new_import)
            changes.append(f"  {old_import} -> {new_import}")
    
    # Write back if modified
    if content != original_content:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, changes
        except Exception as e:
            print(f"Error writing {filepath}: {e}")
            return False, []
    
    return False, []

def main():
    """Main execution function."""
    root_dir = Path('src')
    
    if not root_dir.exists():
        print("Error: src directory not found")
        sys.exit(1)
    
    print("Finding source files...")
    files = find_source_files(root_dir)
    print(f"Found {len(files)} source files to check")
    
    print("\nUpdating import references...")
    modified_count = 0
    total_changes = 0
    
    for filepath in files:
        was_modified, changes = update_imports_in_file(filepath)
        if was_modified:
            modified_count += 1
            total_changes += len(changes)
            print(f"\n✓ Modified: {filepath.relative_to(Path.cwd())}")
            for change in changes:
                print(change)
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Files checked: {len(files)}")
    print(f"  Files modified: {modified_count}")
    print(f"  Total changes: {total_changes}")
    print(f"{'='*60}")
    
    if modified_count == 0:
        print("\n✓ No references to consolidated features found - all imports are already correct!")
    else:
        print(f"\n✓ Successfully updated {modified_count} files")
        print("\nNext steps:")
        print("  1. Run: npm run build:dev")
        print("  2. Verify no broken imports remain")
        print("  3. Remove duplicate directories if all references are updated")

if __name__ == '__main__':
    main()
