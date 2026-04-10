#!/usr/bin/env python3
"""
Verification script for task 3.5: Update all references to consolidated features.
Checks that no broken references to old duplicate feature locations remain.
"""

import re
from pathlib import Path
from typing import List, Tuple
import sys

# Old paths that should no longer be referenced
OLD_PATHS = [
    '@/features/admin/ui/collegeAdmin',
    '@/features/admin/ui/universityAdmin',
    'admin/ui/collegeAdmin',
    'admin/ui/universityAdmin',
]

# Relative patterns that might reference old locations
RELATIVE_PATTERNS = [
    r'from [\'"](\.\./)+features/admin/ui/collegeAdmin',
    r'from [\'"](\.\./)+features/admin/ui/universityAdmin',
]

def find_source_files(root_dir: Path) -> List[Path]:
    """Find all TypeScript and JavaScript files."""
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    files = []
    
    for ext in extensions:
        files.extend(root_dir.rglob(f'*{ext}'))
    
    # Exclude node_modules and migration backups
    files = [f for f in files if 'node_modules' not in str(f) and '.migration-backups' not in str(f)]
    
    return files

def check_file_for_old_references(filepath: Path) -> List[str]:
    """Check if file contains references to old duplicate paths."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return []
    
    violations = []
    
    # Check for absolute path references
    for old_path in OLD_PATHS:
        if old_path in content:
            # Find line numbers
            lines = content.split('\n')
            for i, line in enumerate(lines, 1):
                if old_path in line:
                    violations.append(f"  Line {i}: {line.strip()}")
    
    # Check for relative path references
    for pattern in RELATIVE_PATTERNS:
        matches = re.finditer(pattern, content)
        for match in matches:
            # Find line number
            line_num = content[:match.start()].count('\n') + 1
            line_content = content.split('\n')[line_num - 1].strip()
            violations.append(f"  Line {line_num}: {line_content}")
    
    return violations

def check_duplicate_directories_exist() -> List[str]:
    """Check if the old duplicate directories still exist."""
    duplicate_dirs = [
        Path('src/features/admin/ui/collegeAdmin'),
        Path('src/features/admin/ui/universityAdmin'),
    ]
    
    existing = []
    for dir_path in duplicate_dirs:
        if dir_path.exists():
            # Count files in directory
            files = list(dir_path.rglob('*'))
            file_count = len([f for f in files if f.is_file()])
            existing.append(f"  {dir_path} ({file_count} files)")
    
    return existing

def main():
    """Main verification function."""
    root_dir = Path('src')
    
    if not root_dir.exists():
        print("Error: src directory not found")
        sys.exit(1)
    
    print("="*60)
    print("Task 3.5 Verification: Update all references to consolidated features")
    print("="*60)
    
    # Check for old references in code
    print("\n1. Checking for references to old duplicate paths...")
    files = find_source_files(root_dir)
    files_with_violations = {}
    
    for filepath in files:
        violations = check_file_for_old_references(filepath)
        if violations:
            files_with_violations[filepath] = violations
    
    if files_with_violations:
        print(f"\n❌ FAILED: Found {len(files_with_violations)} files with references to old paths:")
        for filepath, violations in files_with_violations.items():
            print(f"\n{filepath.relative_to(Path.cwd())}:")
            for violation in violations:
                print(violation)
        reference_check_passed = False
    else:
        print("✓ PASSED: No references to old duplicate paths found")
        reference_check_passed = True
    
    # Check if duplicate directories still exist
    print("\n2. Checking if duplicate directories still exist...")
    existing_duplicates = check_duplicate_directories_exist()
    
    if existing_duplicates:
        print(f"\n⚠ WARNING: Found {len(existing_duplicates)} duplicate directories:")
        for dup in existing_duplicates:
            print(dup)
        print("\nThese directories can be safely removed if no references exist.")
        duplicate_check_passed = False
    else:
        print("✓ PASSED: No duplicate directories found")
        duplicate_check_passed = True
    
    # Check consolidated locations exist
    print("\n3. Checking consolidated feature locations exist...")
    consolidated_dirs = [
        Path('src/features/college-admin'),
        Path('src/widgets/student-dashboard'),
        Path('src/features/digital-portfolio'),
    ]
    
    missing_consolidated = []
    for dir_path in consolidated_dirs:
        if not dir_path.exists():
            missing_consolidated.append(f"  {dir_path}")
    
    if missing_consolidated:
        print(f"\n❌ FAILED: Missing consolidated directories:")
        for missing in missing_consolidated:
            print(missing)
        consolidated_check_passed = False
    else:
        print("✓ PASSED: All consolidated feature locations exist")
        consolidated_check_passed = True
    
    # Summary
    print("\n" + "="*60)
    print("VERIFICATION SUMMARY")
    print("="*60)
    print(f"Reference check: {'✓ PASSED' if reference_check_passed else '❌ FAILED'}")
    print(f"Duplicate directories: {'✓ PASSED' if duplicate_check_passed else '⚠ WARNING'}")
    print(f"Consolidated locations: {'✓ PASSED' if consolidated_check_passed else '❌ FAILED'}")
    
    if reference_check_passed and consolidated_check_passed:
        print("\n✓ Task 3.5 verification PASSED")
        print("\nAll import references have been successfully updated.")
        if not duplicate_check_passed:
            print("\nRecommendation: Remove duplicate directories:")
            for dup in existing_duplicates:
                print(f"  rm -rf {dup.split(' ')[0]}")
        return 0
    else:
        print("\n❌ Task 3.5 verification FAILED")
        print("\nPlease fix the issues above before proceeding.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
