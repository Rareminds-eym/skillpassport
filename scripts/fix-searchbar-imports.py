#!/usr/bin/env python3
"""Fix SearchBar imports from default to named"""
from pathlib import Path

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if "import SearchBar from '@/shared/ui'" in content:
            content = content.replace(
                "import SearchBar from '@/shared/ui'",
                "import { SearchBar } from '@/shared/ui'"
            )
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {filepath}")
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
