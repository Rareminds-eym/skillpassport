#!/usr/bin/env python3
"""
Fix markAttendance import references after renaming to markClubAttendance
"""
from pathlib import Path
import re

def fix_file(filepath):
    """Fix markAttendance references in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Replace clubsService.markAttendance with clubsService.markClubAttendance
        content = re.sub(
            r'clubsService\.markAttendance\(',
            'clubsService.markClubAttendance(',
            content
        )
        
        # Replace examinationService.markAttendance with examinationService.markExamAttendance
        content = re.sub(
            r'examinationService\.markAttendance\(',
            'examinationService.markExamAttendance(',
            content
        )
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    src_dir = Path('src')
    fixed = 0
    files_checked = 0
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            files_checked += 1
            if fix_file(filepath):
                fixed += 1
                print(f"Fixed: {filepath}")
    
    print(f"\nChecked {files_checked} files")
    print(f"Fixed {fixed} files")

if __name__ == '__main__':
    main()
