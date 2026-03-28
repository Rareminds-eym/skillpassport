#!/usr/bin/env python3
"""Fix all default import issues by converting them to named imports"""
import os
import re
from pathlib import Path

def fix_imports_in_file(filepath):
    """Fix imports in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = []
        
        # Fix SubscriptionProtectedRoute
        if 'import SubscriptionProtectedRoute from "@/features/subscription"' in content:
            content = content.replace(
                'import SubscriptionProtectedRoute from "@/features/subscription"',
                'import { SubscriptionProtectedRoute } from "@/features/subscription"'
            )
            changes_made.append("SubscriptionProtectedRoute")
        
        # Fix OrganizationGuard
        if 'import OrganizationGuard from "@/features/subscription"' in content:
            content = content.replace(
                'import OrganizationGuard from "@/features/subscription"',
                'import { OrganizationGuard } from "@/shared/lib/guards"'
            )
            changes_made.append("OrganizationGuard")
        
        # Fix DatePicker with single quotes
        if "import DatePicker from '@/features/subscription'" in content:
            content = content.replace(
                "import DatePicker from '@/features/subscription'",
                "import { DatePicker } from '@/features/subscription'"
            )
            changes_made.append("DatePicker")
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {filepath}")
            for change in changes_made:
                print(f"  - {change}")
            return True
        
        return False
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def main():
    """Find and fix all import issues in src directory"""
    src_dir = Path('src')
    fixed_count = 0
    
    print("Scanning for import issues...")
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.js', '.jsx', '.ts', '.tsx'] and filepath.is_file():
            if fix_imports_in_file(filepath):
                fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")

if __name__ == '__main__':
    main()
