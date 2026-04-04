#!/usr/bin/env python3
"""
Task 14: Replace relative imports with absolute @/ path aliases.
Converts ../../ style imports to @/ imports across src/ (excluding src/migration/).
"""
import re
import os
from pathlib import Path

# Workspace root
ROOT = Path(__file__).parent

def resolve_absolute_path(file_path: Path, relative_import: str) -> str | None:
    """Resolve a relative import to an absolute @/ path."""
    # Get the directory of the importing file
    file_dir = file_path.parent
    
    # Resolve the relative path
    try:
        resolved = (file_dir / relative_import).resolve()
    except Exception:
        return None
    
    # Get src/ directory
    src_dir = ROOT / 'src'
    
    # Check if resolved path is within src/
    try:
        rel_to_src = resolved.relative_to(src_dir)
        return '@/' + str(rel_to_src).replace('\\', '/')
    except ValueError:
        # Path is outside src/ (e.g., assets, public)
        # Try relative to ROOT
        try:
            rel_to_root = resolved.relative_to(ROOT)
            # For paths outside src/ (like public/, assets/), keep relative
            return None
        except ValueError:
            return None

def fix_file(file_path: Path) -> int:
    """Fix relative imports in a file. Returns number of fixes made."""
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        print(f"  ERROR reading {file_path}: {e}")
        return 0
    
    original = content
    fixes = 0
    
    # Match import statements with relative paths (../../ or more levels)
    # Pattern: import ... from '../../...' or import ... from "../../..."
    pattern = re.compile(
        r"""(import\s+(?:[^'"]*?\s+from\s+)?)(["'])(\.\.\/[^"']+)(["'])""",
        re.MULTILINE
    )
    
    def replace_import(match):
        nonlocal fixes
        prefix = match.group(1)
        quote1 = match.group(2)
        rel_path = match.group(3)
        quote2 = match.group(4)
        
        # Only process paths with 2+ levels up (../../)
        if not rel_path.startswith('../../') and not rel_path.startswith('../..\\'):
            return match.group(0)
        
        # Strip any trailing extension for resolution
        # but keep it for the final path
        abs_path = resolve_absolute_path(file_path, rel_path)
        
        if abs_path is None:
            return match.group(0)
        
        fixes += 1
        return f"{prefix}{quote1}{abs_path}{quote2}"
    
    new_content = pattern.sub(replace_import, content)
    
    if new_content != original:
        try:
            file_path.write_text(new_content, encoding='utf-8')
        except Exception as e:
            print(f"  ERROR writing {file_path}: {e}")
            return 0
    
    return fixes

def should_skip(file_path: Path) -> bool:
    """Skip files that should not be processed."""
    path_str = str(file_path).replace('\\', '/')
    
    # Skip migration tooling (internal relative imports are fine there)
    if '/src/migration/' in path_str:
        return True
    
    # Skip test files in __tests__ that test migration tooling
    if '/src/migration/' in path_str:
        return True
    
    # Skip node_modules
    if 'node_modules' in path_str:
        return True
    
    return False

def main():
    src_dir = ROOT / 'src'
    
    total_files = 0
    total_fixes = 0
    fixed_files = []
    
    extensions = {'.ts', '.tsx', '.js', '.jsx'}
    
    for file_path in src_dir.rglob('*'):
        if file_path.suffix not in extensions:
            continue
        if should_skip(file_path):
            continue
        
        total_files += 1
        fixes = fix_file(file_path)
        
        if fixes > 0:
            total_fixes += fixes
            rel = file_path.relative_to(ROOT)
            fixed_files.append((str(rel), fixes))
            print(f"  Fixed {fixes} import(s): {rel}")
    
    print(f"\n{'='*60}")
    print(f"Scanned: {total_files} files")
    print(f"Fixed:   {len(fixed_files)} files")
    print(f"Total:   {total_fixes} imports converted")

if __name__ == '__main__':
    main()
