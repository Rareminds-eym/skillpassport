#!/usr/bin/env python3

"""
Script to find CRITICAL import errors in the codebase
Filters out test files, migration files, and focuses on production code
"""

import os
import re
import sys
from pathlib import Path
from collections import defaultdict

# Import patterns to match
IMPORT_PATTERNS = [
    re.compile(r'import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?[\'"]([^\'"]+)[\'"]'),
    re.compile(r'import\([\'"]([^\'"]+)[\'"]\)'),
    re.compile(r'require\([\'"]([^\'"]+)[\'"]\)'),
]

EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.json']
SKIP_DIRS = {'node_modules', '.git', 'dist', 'build', '.next', '.migration-backups'}
SOURCE_EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx'}

# Patterns to skip (test files, migration files, etc.)
SKIP_PATTERNS = [
    r'__tests__',
    r'\.test\.',
    r'\.spec\.',
    r'src[/\\]migration[/\\]',
    r'\.property\.test\.',
]

def should_skip_file(file_path):
    """Check if file should be skipped"""
    file_str = str(file_path)
    for pattern in SKIP_PATTERNS:
        if re.search(pattern, file_str):
            return True
    return False

def resolve_import_path(import_path, from_file, src_dir):
    """Resolve import path to actual file location"""
    
    # Skip node_modules and external packages
    if not import_path.startswith('.') and not import_path.startswith('@/'):
        return None
    
    if import_path.startswith('@/'):
        resolved_path = src_dir / import_path[2:]
    else:
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
    except Exception:
        return errors
    
    for pattern in IMPORT_PATTERNS:
        for match in pattern.finditer(content):
            import_path = match.group(1)
            
            # Only check local imports
            if not (import_path.startswith('.') or import_path.startswith('@/')):
                continue
            
            # Skip placeholder imports
            if import_path in ['...', './utils', '../shared/helpers', './local']:
                continue
            
            resolved = resolve_import_path(import_path, file_path, src_dir)
            
            if resolved is None:
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
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            
            # Skip test and migration files
            if should_skip_file(file_path):
                continue
            
            # Check only source files
            if file_path.suffix in SOURCE_EXTENSIONS:
                errors = check_file(file_path, src_dir, root_dir)
                all_errors.extend(errors)
    
    return all_errors

def categorize_errors(errors):
    """Categorize errors by type"""
    categories = {
        'context': [],
        'services': [],
        'hooks': [],
        'utils': [],
        'config': [],
        'ui_components': [],
        'data': [],
        'assets': [],
        'other': []
    }
    
    for error in errors:
        import_path = error['import']
        
        if 'context' in import_path.lower():
            categories['context'].append(error)
        elif 'service' in import_path.lower() or '/api/' in import_path:
            categories['services'].append(error)
        elif 'hook' in import_path.lower() or import_path.startswith('@/hooks'):
            categories['hooks'].append(error)
        elif 'util' in import_path.lower() or 'helper' in import_path.lower():
            categories['utils'].append(error)
        elif 'config' in import_path.lower():
            categories['config'].append(error)
        elif '/ui/' in import_path or import_path.startswith('./ui/'):
            categories['ui_components'].append(error)
        elif '/data/' in import_path or 'mock' in import_path.lower():
            categories['data'].append(error)
        elif 'assets' in import_path.lower() or '.webp' in import_path or '.json' in import_path:
            categories['assets'].append(error)
        else:
            categories['other'].append(error)
    
    return categories

def main():
    root_dir = Path.cwd()
    src_dir = root_dir / 'src'
    
    if not src_dir.exists():
        print("Error: 'src' directory not found", file=sys.stderr)
        sys.exit(1)
    
    print('Scanning for CRITICAL import errors (excluding tests & migrations)...\n')
    
    errors = scan_directory(src_dir, src_dir, root_dir)
    
    if not errors:
        print('No critical import errors found!')
        return
    
    print(f'Found {len(errors)} critical import error(s)\n')
    
    # Categorize errors
    categories = categorize_errors(errors)
    
    # Print by category
    for category, cat_errors in categories.items():
        if not cat_errors:
            continue
        
        print(f'\n{"="*60}')
        print(f'{category.upper().replace("_", " ")} ({len(cat_errors)} errors)')
        print(f'{"="*60}')
        
        errors_by_file = defaultdict(list)
        for error in cat_errors:
            errors_by_file[error['file']].append(error)
        
        for file, file_errors in sorted(errors_by_file.items()):
            print(f'\n{file}')
            for error in file_errors:
                print(f'   Line {error["line"]}: {error["import"]}')
    
    print(f'\n\n{"="*60}')
    print(f'SUMMARY')
    print(f'{"="*60}')
    for category, cat_errors in categories.items():
        if cat_errors:
            print(f'{category.replace("_", " ").title()}: {len(cat_errors)} errors')
    
    print(f'\nTotal: {len(errors)} critical import error(s)')

if __name__ == '__main__':
    main()
