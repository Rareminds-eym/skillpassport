#!/usr/bin/env python3

"""
Final comprehensive import fix script
"""

import os
import re
from pathlib import Path

# Global pattern replacements
GLOBAL_REPLACEMENTS = [
    # ProfileEditModals -> modals/index
    (r"from ['\"]\.\/ProfileEditModals['\"]", "from './modals'"),
    (r"from ['\"]\.\.\/ProfileEditModals['\"]", "from '../modals'"),
    
    # FeatureGate and Subscription components
    (r"from ['\"]\.\.\/\.\.\/Subscription\/FeatureGate['\"]", "from '@/features/subscription'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/Subscription\/SubscriptionSettingsSection['\"]", "from '@/features/subscription'"),
    
    # Common components
    (r"from ['\"]\.\.\/\.\.\/common\/SearchBar['\"]", "from '@/shared/ui'"),
    (r"from ['\"]\.\.\/\.\.\/common\/DemoModal['\"]", "from '@/shared/ui'"),
    (r"from ['\"]\.\.\/\.\.\/shared\/ConfirmModal['\"]", "from '@/shared/ui'"),
    
    # OTPInput
    (r"from ['\"]\.\.\/OTPInput['\"]", "from '@/shared/ui'"),
    
    # Student feature-specific paths
    (r"from ['\"]\.\.\/api\/studentProfileService['\"]", "from '@/features/student-profile/api'"),
    
    # Subscription stores
    (r"from ['\"]\.\.\/stores['\"]", "from '@/stores'"),
]

def fix_file(file_path):
    """Fix imports in a single file"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        # Apply all global replacements
        for pattern, replacement in GLOBAL_REPLACEMENTS:
            content = re.sub(pattern, replacement, content)
        
        # Only write if changed
        if content != original_content:
            file_path.write_text(content, encoding='utf-8')
            return True
        return False
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")
        return False

def main():
    root_dir = Path.cwd()
    src_dir = root_dir / 'src'
    
    if not src_dir.exists():
        print("Error: 'src' directory not found")
        return
    
    print('Fixing final import errors...\n')
    
    fixed_count = 0
    skip_dirs = {'node_modules', '.git', 'dist', 'build', '.next', '.migration-backups', '__tests__'}
    source_extensions = {'.ts', '.tsx', '.js', '.jsx'}
    
    for root, dirs, files in os.walk(src_dir):
        # Skip certain directories
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for file in files:
            file_path = Path(root) / file
            
            # Check only source files
            if file_path.suffix in source_extensions:
                if fix_file(file_path):
                    fixed_count += 1
                    print(f'Fixed: {file_path.relative_to(root_dir)}')
    
    print(f'\nFixed {fixed_count} file(s)')

if __name__ == '__main__':
    main()
