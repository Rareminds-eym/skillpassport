#!/usr/bin/env python3
"""
Fix Truncated Import/Export Paths

The previous script sometimes truncated paths, cutting off the last character(s).
This script finds and fixes those truncated paths.
"""

import re
from pathlib import Path

SRC_DIR = Path('src')

def fix_truncated_paths_in_file(file_path: Path):
    """Fix truncated import/export paths in a single file"""
    content = file_path.read_text(encoding='utf-8')
    original_content = content
    
    # Pattern: from './path/inde'; should be from './path/index';
    content = re.sub(
        r"from '(\./[^']+)/inde';",
        r"from '\1/index';",
        content
    )
    
    # Pattern: from './inde'; should be from './index';
    content = re.sub(
        r"from '\./inde';",
        r"from './index';",
        content
    )
    
    if content != original_content:
        file_path.write_text(content, encoding='utf-8')
        return True
    return False

def main():
    print("Fixing truncated import/export paths...")
    
    # Find all TypeScript files
    ts_files = list(SRC_DIR.rglob('*.ts')) + list(SRC_DIR.rglob('*.tsx'))
    
    fixed_count = 0
    for ts_file in ts_files:
        if fix_truncated_paths_in_file(ts_file):
            print(f"  Fixed: {ts_file.relative_to(SRC_DIR)}")
            fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")
    print("Run 'npm run build:dev' to verify")

if __name__ == '__main__':
    main()
