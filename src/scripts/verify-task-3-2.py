#!/usr/bin/env python3
"""
Verification script for Task 3.2: Merge universityAdmin implementations
Confirms that the consolidation is complete.
"""

from pathlib import Path
import sys

def main():
    """Verify task 3.2 completion."""
    print("="*60)
    print("Task 3.2 Verification: universityAdmin Consolidation")
    print("="*60)
    
    all_passed = True
    
    # Check 1: Old directory should not exist
    print("\n1. Checking old directory removal...")
    old_dir = Path('src/features/admin/ui/universityAdmin')
    if old_dir.exists():
        print(f"  ❌ FAILED: {old_dir} still exists")
        all_passed = False
    else:
        print(f"  ✓ PASSED: {old_dir} does not exist")
    
    # Check 2: Target directory should exist
    print("\n2. Checking target directory exists...")
    target_dir = Path('src/features/university-ai')
    if not target_dir.exists():
        print(f"  ❌ FAILED: {target_dir} does not exist")
        all_passed = False
    else:
        print(f"  ✓ PASSED: {target_dir} exists")
    
    # Check 3: No imports from old path
    print("\n3. Checking for imports from old path...")
    old_import_pattern = '@/features/admin/ui/universityAdmin'
    found_old_imports = []
    
    src_dir = Path('src')
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            try:
                content = filepath.read_text(encoding='utf-8')
                if old_import_pattern in content:
                    found_old_imports.append(str(filepath))
            except Exception:
                pass
    
    if found_old_imports:
        print(f"  ❌ FAILED: Found {len(found_old_imports)} files with old imports:")
        for f in found_old_imports[:5]:
            print(f"    - {f}")
        all_passed = False
    else:
        print(f"  ✓ PASSED: No imports from old path found")
    
    # Check 4: university-ai has proper structure
    print("\n4. Checking university-ai structure...")
    required_files = [
        'src/features/university-ai/index.ts',
        'src/features/university-ai/api',
        'src/features/university-ai/components',
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
    
    if missing_files:
        print(f"  ❌ FAILED: Missing required files/directories:")
        for f in missing_files:
            print(f"    - {f}")
        all_passed = False
    else:
        print(f"  ✓ PASSED: university-ai has proper structure")
    
    # Summary
    print("\n" + "="*60)
    if all_passed:
        print("✓ ALL CHECKS PASSED")
        print("\nTask 3.2 is complete:")
        print("  - Old admin/ui/universityAdmin/ directory removed")
        print("  - Components consolidated in features/university-ai/")
        print("  - All imports updated to canonical location")
        print("  - Build should pass (verify with: npm run build:dev)")
        return 0
    else:
        print("❌ SOME CHECKS FAILED")
        print("\nPlease review the failures above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
