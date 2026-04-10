#!/usr/bin/env python3
"""
Verify collegeAdmin consolidation is complete.
Checks:
1. Old duplicate directory doesn't exist
2. Canonical location exists with proper structure
3. No imports reference the old path
"""

from pathlib import Path
import re

def check_directory_removed():
    """Check if the old duplicate directory has been removed."""
    old_path = Path('src/features/admin/ui/collegeAdmin')
    if old_path.exists():
        print(f"❌ FAIL: Old directory still exists: {old_path}")
        return False
    print(f"✓ PASS: Old directory removed: {old_path}")
    return True

def check_canonical_location():
    """Check if canonical location exists with proper FSD structure."""
    canonical = Path('src/features/college-admin')
    if not canonical.exists():
        print(f"❌ FAIL: Canonical location doesn't exist: {canonical}")
        return False
    
    # Check for FSD segments
    required_segments = ['ui', 'api', 'model']
    missing = []
    for segment in required_segments:
        if not (canonical / segment).exists():
            missing.append(segment)
    
    if missing:
        print(f"❌ FAIL: Missing segments in {canonical}: {missing}")
        return False
    
    print(f"✓ PASS: Canonical location exists with proper structure: {canonical}")
    return True

def check_imports():
    """Check for any imports referencing the old path."""
    old_import_patterns = [
        r'@/features/admin/ui/collegeAdmin',
        r'from [\'"](\.\./)+features/admin/ui/collegeAdmin',
    ]
    
    violations = []
    src_dir = Path('src')
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            try:
                content = filepath.read_text(encoding='utf-8')
                for pattern in old_import_patterns:
                    if re.search(pattern, content):
                        violations.append(str(filepath))
                        break
            except Exception as e:
                print(f"Warning: Could not read {filepath}: {e}")
    
    if violations:
        print(f"❌ FAIL: Found {len(violations)} files with old import paths:")
        for v in violations[:10]:  # Show first 10
            print(f"  - {v}")
        return False
    
    print("✓ PASS: No imports reference the old collegeAdmin path")
    return True

def main():
    print("=" * 60)
    print("Verifying collegeAdmin Consolidation (Task 3.1)")
    print("=" * 60)
    print()
    
    results = []
    
    print("1. Checking old directory removed...")
    results.append(check_directory_removed())
    print()
    
    print("2. Checking canonical location exists...")
    results.append(check_canonical_location())
    print()
    
    print("3. Checking for old import references...")
    results.append(check_imports())
    print()
    
    print("=" * 60)
    if all(results):
        print("✓ SUCCESS: collegeAdmin consolidation is complete!")
        print("=" * 60)
        return 0
    else:
        print("❌ FAILURE: collegeAdmin consolidation has issues")
        print("=" * 60)
        return 1

if __name__ == '__main__':
    exit(main())
