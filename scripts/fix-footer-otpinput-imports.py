#!/usr/bin/env python3
"""Fix Footer and OTPInput imports from default to named"""
from pathlib import Path

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        changes = []
        
        if "import Footer from '@/shared/ui'" in content:
            content = content.replace(
                "import Footer from '@/shared/ui'",
                "import { Footer } from '@/shared/ui'"
            )
            changes.append("Footer")
        
        if "import OTPInput from '@/shared/ui'" in content:
            content = content.replace(
                "import OTPInput from '@/shared/ui'",
                "import { OTPInput } from '@/shared/ui'"
            )
            changes.append("OTPInput")
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {filepath}")
            for change in changes:
                print(f"  - {change}")
            return True
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    src_dir = Path('src')
    fixed = 0
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx'] and filepath.is_file():
            if fix_file(filepath):
                fixed += 1
    
    print(f"\nFixed {fixed} files")

if __name__ == '__main__':
    main()
