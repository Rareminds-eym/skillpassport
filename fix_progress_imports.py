#!/usr/bin/env python3
import os
import re
from pathlib import Path

def fix_progress_imports(filepath):
    """Fix progress imports to use PascalCase"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Replace @/shared/ui/progress with @/shared/ui/Progress
        content = re.sub(
            r"from ['\"]@/shared/ui/progress['\"]",
            "from '@/shared/ui/Progress'",
            content
        )
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
    return False

def main():
    src_dir = Path('src')
    fixed = 0
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            if fix_progress_imports(filepath):
                print(f"Fixed: {filepath}")
                fixed += 1
    
    print(f"\nTotal files fixed: {fixed}")

if __name__ == '__main__':
    main()
