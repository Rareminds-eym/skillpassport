#!/usr/bin/env python3

"""
Script to find import errors in the codebase
Identifies imports pointing to non-existent files
"""

import os
import re
import sys
from pathlib import Path
from collections import defaultdict

# Import patterns to match
IMPORT_PATTERNS = [
    # ES6 imports: import ... from '...'
    re.compile(r'import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?[\'"]([^\'"]+)[\'"]'),
    # Dynamic imports: import('...')
    re.compile(r'import\([\'"]([^\'"]+)[\'"]\)'),
    # Require: require('...')
    re.compile(r'require\([\'"]([^\'"]+)[\'"]\)'),
]

EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.json']
SKIP_DIRS = {'node_modules', '.git', 'dist', 'build', '.next', '.migration-backups'}
SOURCE_EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx'}

def resolve_import_path(import_path, from_file, src_dir):
    """Resolve import path to actual file location"""
    
    # Skip node_modules and external packages
    if not import_path.startswith('.') and not import_path.startswith('@/'):
        return None
    
    if import_path.startswith('@/'):
        # Handle @ alias (maps to src/)
        resolved_path = src_dir / import_path[2:]
    else:
        # Handle relative imports
        from_dir = from_file.parent
        resolved_path = (from_dir / import_path).resolve()
    
    # Try different extensions
    for ext in EXTENSIONS:
        full_path = Path(str(resolved_path) + ext)
        if full_path.exists() and full_path.is_file():
            return full_path
    
    # Check if it's a directory with index file
    if resolved_path.exists() and resolved_path.is_dir():
        for ext in ['.ts', '.tsx', '.js', '.jsx']:
            index_path = resolved_path / f'index{ext}'
            if index_path.exists():
                return index_path
    
    return None

def check_file(file_path, src_dir, root_dir):
    """Check a single file for import errors"""
    errors = []
    
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        print(f"Warning: Could not read {file_path}: {e}", file=sys.stderr)
        return errors
    
    for pattern in IMPORT_PATTERNS:
        for match in pattern.finditer(content):
            import_path = match.group(1)
            
            # Only check local imports
            if not (import_path.startswith('.') or import_path.startswith('@/')):
                continue
            
            resolved = resolve_import_path(import_path, file_path, src_dir)
            
            if resolved is None:
                # Calculate line number
                line_number = content[:match.start()].count('\n') + 1
                
                errors.append({
                    'file': str(file_path.relative_to(root_dir)),
                    'line': line_number,
                    'import': import_path,
                    'statement': match.group(0),
                })
    
    return errors

def scan_directory(directory, src_dir, root_dir):
    """Recursively scan directory for source files"""
    all_errors = []
    
    for root, dirs, files in os.walk(directory):
        # Skip certain directories
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            
            # Check only source files
            if file_path.suffix in SOURCE_EXTENSIONS:
                errors = check_file(file_path, src_dir, root_dir)
                all_errors.extend(errors)
    
    return all_errors

def main():
    root_dir = Path.cwd()
    src_dir = root_dir / 'src'
    
    if not src_dir.exists():
        print("Error: 'src' directory not found", file=sys.stderr)
        sys.exit(1)
    
    print('🔍 Scanning for import errors...\n')
    
    errors = scan_directory(src_dir, src_dir, root_dir)
    
    if not errors:
        print('✅ No import errors found!')
        return
    
    print(f'❌ Found {len(errors)} import error(s):\n')
    
    # Group by file
    errors_by_file = defaultdict(list)
    for error in errors:
        errors_by_file[error['file']].append(error)
    
    # Print grouped errors
    for file, file_errors in sorted(errors_by_file.items()):
        print(f'\n📁 {file}')
        for error in file_errors:
            print(f'   Line {error["line"]}: {error["import"]}')
            print(f'   → {error["statement"]}')
    
    print(f'\n\nTotal: {len(errors)} import error(s) in {len(errors_by_file)} file(s)')
    sys.exit(1)

if __name__ == '__main__':
    main()
