#!/usr/bin/env python3
"""
Fix modal import issues across the codebase.
Changes named imports to default imports where the export is default.
"""

from pathlib import Path
import re

def fix_file(filepath):
    """Fix modal imports in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix educator modals - all are default exports
        modals = [
            'AddStudentModal',
            'EditStudentModal', 
            'DeleteStudentModal',
            'BulkDeleteStudentsModal',
            'CSVImportModal',
            'ScheduleInterviewModal',
            'DiversityExportModal',
            'AddToShortlistModal'
        ]
        
        for modal in modals:
            # Fix: import { Modal } from '@/features/educator/ui/modals/...'
            # To: import Modal from '@/features/educator/ui/modals/...'
            pattern = rf"import\s*\{{\s*{modal}\s*\}}\s*from\s*(['\"])@/features/educator/ui/modals/([^'\"]+)\1"
            replacement = rf"import {modal} from \1@/features/educator/ui/modals/\2\1"
            content = re.sub(pattern, replacement, content)
        
        # Fix college-admin modals
        college_modals = [
            'AddStudentModal',
            'EditStudentModal',
            'DeleteStudentModal',
            'BulkDeleteStudentsModal',
            'ManageStudentsModal',
            'ManageProgramStudentsModal',
            'MentorResponseModal',
            'SwapRequestModal'
        ]
        
        for modal in college_modals:
            # Fix: import { Modal } from '@/features/college-admin'
            # To: import Modal from '@/features/college-admin'
            pattern = rf"import\s*\{{\s*{modal}\s*\}}\s*from\s*(['\"])@/features/college-admin\1"
            replacement = rf"import {modal} from \1@/features/college-admin\1"
            content = re.sub(pattern, replacement, content)
        
        # If content changed, write it back
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Main function to fix all files."""
    src_dir = Path('src')
    fixed_count = 0
    
    # Find all TypeScript/JavaScript files
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            if fix_file(filepath):
                print(f"✓ Fixed: {filepath}")
                fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} file(s)")

if __name__ == '__main__':
    main()
