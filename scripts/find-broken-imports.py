#!/usr/bin/env python3
"""
Find all broken imports by checking if imported files exist.
"""

import os
import re
from pathlib import Path

def resolve_import_path(file_path, import_path):
    """Resolve relative import path to absolute path."""
    if import_path.startswith('@/'):
        # Alias import
        return Path('src') / import_path[2:]
    elif import_path.startswith('./') or import_path.startswith('../'):
        # Relative import
        base_dir = Path(file_path).parent
        resolved = (base_dir / import_path).resolve()
        return resolved
    else:
        # Node module or other
        return None

def check_file_exists(path):
    """Check if file exists with common extensions."""
    if path is None:
        return True  # Skip node modules
    
    # Try exact path
    if path.exists():
        return True
    
    # Try with extensions
    for ext in ['.ts', '.tsx', '.js', '.jsx', '.json']:
        if path.with_suffix(ext).exists():
            return True
    
    # Try as directory with index
    if path.is_dir():
        for ext in ['.ts', '.tsx', '.js', '.jsx']:
            if (path / f'index{ext}').exists():
                return True
    
    # Try adding index to path
    for ext in ['.ts', '.tsx', '.js', '.jsx']:
        if (path / f'index{ext}').exists():
            return True
    
    return False

def find_imports_in_file(filepath):
    """Find all imports in a file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Match import statements
        import_pattern = r'(?:import|export).*?from\s+[\'"]([^\'"]+)[\'"]'
        imports = re.findall(import_pattern, content)
        
        broken = []
        for imp in imports:
            resolved = resolve_import_path(filepath, imp)
            if resolved and not check_file_exists(resolved):
                broken.append((imp, resolved))
        
        return broken
    except Exception as e:
        return []

def main():
    src_dir = Path('src')
    
    all_broken = {}
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx'] and filepath.is_file():
            broken = find_imports_in_file(filepath)
            if broken:
                all_broken[str(filepath)] = broken
    
    if all_broken:
        print("=" * 60)
        print("BROKEN IMPORTS FOUND")
        print("=" * 60)
        
        for file, imports in sorted(all_broken.items()):
            print(f"\n{file}:")
            for imp, resolved in imports:
                print(f"  X {imp}")
                print(f"    -> {resolved}")
        
        print(f"\n{'=' * 60}")
        print(f"Total files with broken imports: {len(all_broken)}")
        print(f"{'=' * 60}")
    else:
        print("OK - No broken imports found!")

if __name__ == "__main__":
    main()
