#!/usr/bin/env python3
"""
Fix relative imports in moved domain services.
Services moved from shared/api/ to features/*/api/ have relative imports that need updating.
"""

import os
from pathlib import Path

# Common relative import replacements
RELATIVE_IMPORT_FIXES = {
    # Supabase client
    './supabaseClient': '@/shared/api/supabaseClient',
    './supabaseClient.ts': '@/shared/api/supabaseClient',
    '../supabaseClient': '@/shared/api/supabaseClient',
    '../../supabaseClient': '@/shared/api/supabaseClient',
    '../../../supabaseClient': '@/shared/api/supabaseClient',
    
    # HTTP client
    './httpClient': '@/shared/api/httpClient',
    './httpClient.ts': '@/shared/api/httpClient',
    '../httpClient': '@/shared/api/httpClient',
    '../../httpClient': '@/shared/api/httpClient',
    
    # API utilities
    './apiUtils': '@/shared/api/apiUtils',
    './apiUtils.ts': '@/shared/api/apiUtils',
    '../apiUtils': '@/shared/api/apiUtils',
    '../../apiUtils': '@/shared/api/apiUtils',
    
    # Auth utils
    './authUtils': '@/shared/api/authUtils',
    './authUtils.ts': '@/shared/api/authUtils',
    '../authUtils': '@/shared/api/authUtils',
    '../../authUtils': '@/shared/api/authUtils',
    
    # Constants
    './constants': '@/shared/api/constants',
    './constants.ts': '@/shared/api/constants',
    '../constants': '@/shared/api/constants',
    '../../constants': '@/shared/api/constants',
    
    # Storage service
    './storageService': '@/shared/api/storageService',
    './storageService.ts': '@/shared/api/storageService',
    '../storageService': '@/shared/api/storageService',
    '../../storageService': '@/shared/api/storageService',
    
    # Storage API service
    './storageApiService': '@/shared/api/storageApiService',
    './storageApiService.ts': '@/shared/api/storageApiService',
    '../storageApiService': '@/shared/api/storageApiService',
    '../../storageApiService': '@/shared/api/storageApiService',
    
    # File service
    './fileService': '@/shared/api/fileService',
    './fileService.ts': '@/shared/api/fileService',
    '../fileService': '@/shared/api/fileService',
    '../../fileService': '@/shared/api/fileService',
    
    # File upload service
    './fileUploadService': '@/shared/api/fileUploadService',
    './fileUploadService.ts': '@/shared/api/fileUploadService',
    '../fileUploadService': '@/shared/api/fileUploadService',
    '../../fileUploadService': '@/shared/api/fileUploadService',
}

def fix_imports_in_file(file_path: Path, dry_run: bool = False):
    """Fix relative imports in a service file."""
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        changes_made = []
        
        for old_import, new_import in RELATIVE_IMPORT_FIXES.items():
            # Match import statements
            patterns = [
                f"from '{old_import}'",
                f'from "{old_import}"',
                f"import '{old_import}'",
                f'import "{old_import}"',
            ]
            
            for pattern in patterns:
                if pattern in content:
                    new_pattern = pattern.replace(old_import, new_import)
                    content = content.replace(pattern, new_pattern)
                    if pattern not in [c[0] for c in changes_made]:
                        changes_made.append((pattern, new_pattern))
        
        if content != original_content:
            if dry_run:
                print(f"Would update: {file_path}")
                for old, new in changes_made:
                    print(f"  - {old} -> {new}")
                return True
            else:
                file_path.write_text(content, encoding='utf-8')
                print(f"✓ Updated: {file_path}")
                for old, new in changes_made:
                    print(f"  - {old} -> {new}")
                return True
        
        return False
    except Exception as e:
        print(f"⚠️  Error processing {file_path}: {e}")
        return False

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Fix relative imports in moved services')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
    args = parser.parse_args()
    
    # Target directories where services were moved
    target_dirs = [
        'src/features/analytics/api',
        'src/features/notifications/api',
        'src/features/subscription/api',
        'src/features/messaging/api',
        'src/features/educator/api',
        'src/features/library/api',
        'src/features/courses/api',
        'src/features/myclass/api',
        'src/features/exams/api',
        'src/features/student-profile/api',
        'src/features/recruiter-pipeline/api',
        'src/features/admin/api',
    ]
    
    updated_count = 0
    
    print("=" * 80)
    print("Fixing relative imports in moved domain services")
    print("=" * 80)
    print()
    
    for dir_path in target_dirs:
        dir_obj = Path(dir_path)
        if not dir_obj.exists():
            continue
        
        for file_path in dir_obj.glob('*.{ts,js}'):
            if fix_imports_in_file(file_path, args.dry_run):
                updated_count += 1
        
        # Also check .ts and .js separately
        for file_path in list(dir_obj.glob('*.ts')) + list(dir_obj.glob('*.js')):
            if file_path.suffix in ['.ts', '.js']:
                if fix_imports_in_file(file_path, args.dry_run):
                    updated_count += 1
    
    print()
    print("=" * 80)
    print(f"Summary: {updated_count} files updated")
    if args.dry_run:
        print("(Dry run - no changes made)")
    print("=" * 80)

if __name__ == '__main__':
    main()
