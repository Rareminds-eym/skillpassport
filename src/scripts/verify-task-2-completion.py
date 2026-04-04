#!/usr/bin/env python3
"""
Verification script for Task 2: Relocate non-FSD directories from src/
"""

import os
from pathlib import Path

def check_directory_exists(path: str) -> bool:
    """Check if a directory exists."""
    return os.path.exists(path) and os.path.isdir(path)

def check_file_exists(path: str) -> bool:
    """Check if a file exists."""
    return os.path.exists(path) and os.path.isfile(path)

def main():
    print("=" * 80)
    print("TASK 2 COMPLETION VERIFICATION")
    print("=" * 80)
    print()
    
    # Check that old directories are still present (will be deleted manually)
    print("Checking old directories (should still exist for now):")
    print("-" * 80)
    old_dirs = [
        'src/stores',
        'src/data',
        'src/functions-lib',
        'src/scripts',
        'src/migration',
    ]
    for dir_path in old_dirs:
        exists = check_directory_exists(dir_path)
        status = "✓ EXISTS (ready for deletion)" if exists else "✗ MISSING"
        print(f"  {status}: {dir_path}")
    
    print()
    
    # Check that new directories were created
    print("Checking new FSD-compliant locations:")
    print("-" * 80)
    new_locations = [
        'src/features/auth/model',
        'src/features/assessment/model',
        'src/features/subscription/model',
        'src/shared/model',
        'src/features/digital-portfolio/model',
        'src/features/messaging/model',
        'src/features/career-assistant/model',
        'src/features/counselling/model',
        'src/features/promotional/model',
        'src/features/educator/model',
        'src/shared/model/mock',
        'functions/lib',
        'scripts/migration',
        'src/shared/types',
    ]
    
    all_exist = True
    for dir_path in new_locations:
        exists = check_directory_exists(dir_path)
        status = "✓" if exists else "✗ MISSING"
        print(f"  {status}: {dir_path}")
        if not exists:
            all_exist = False
    
    print()
    
    # Check specific files
    print("Checking specific migrated files:")
    print("-" * 80)
    files_to_check = [
        'src/features/auth/model/authStore.ts',
        'src/features/assessment/model/assessmentStore.ts',
        'src/shared/model/themeStore.ts',
        'src/features/assessment/model/certificateConfig.ts',
        'src/shared/model/notificationsData.ts',
        'functions/lib/cors.ts',
        'src/shared/types/recruiter.tsx',
    ]
    
    for file_path in files_to_check:
        exists = check_file_exists(file_path)
        status = "✓" if exists else "✗ MISSING"
        print(f"  {status}: {file_path}")
        if not exists:
            all_exist = False
    
    print()
    print("=" * 80)
    if all_exist:
        print("✓ ALL CHECKS PASSED - Task 2 migration complete!")
        print()
        print("NEXT STEPS:")
        print("  1. Run 'npm run build:dev' to verify all imports resolve")
        print("  2. After successful build, delete old directories:")
        print("     - src/stores/")
        print("     - src/data/")
        print("     - src/functions-lib/")
        print("     - src/scripts/")
        print("     - src/migration/")
        print("     - src/types.tsx")
    else:
        print("✗ SOME CHECKS FAILED - Review missing files/directories above")
    print("=" * 80)

if __name__ == '__main__':
    main()
