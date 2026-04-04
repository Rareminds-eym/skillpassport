#!/usr/bin/env python3
"""
Fix Malformed Export Paths

The previous script added exports with incorrect paths ending in 'x'.
This script fixes those malformed exports.
"""

import re
from pathlib import Path

SRC_DIR = Path('src')

def fix_malformed_exports_in_file(file_path: Path):
    """Fix malformed export paths in a single file"""
    content = file_path.read_text(encoding='utf-8')
    original_content = content
    
    # Pattern 1: export { X } from './path/filex';
    # Should be: export { X } from './path/file';
    content = re.sub(
        r"from '(\./[^']+)x';",
        r"from '\1';",
        content
    )
    
    # Pattern 2: Empty exports like: export {  } from './ui/DebugRolesx';
    # Remove these entirely
    content = re.sub(
        r"export\s+\{\s*\}\s+from\s+'[^']+';?\n?",
        "",
        content
    )
    
    if content != original_content:
        file_path.write_text(content, encoding='utf-8')
        return True
    return False

def main():
    print("Fixing malformed export paths...")
    
    # Find all index.ts files in features
    index_files = list((SRC_DIR / 'features').rglob('index.ts'))
    
    fixed_count = 0
    for index_file in index_files:
        if fix_malformed_exports_in_file(index_file):
            print(f"  Fixed: {index_file.relative_to(SRC_DIR)}")
            fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")
    print("Run 'npm run build:dev' to verify")

if __name__ == '__main__':
    main()
