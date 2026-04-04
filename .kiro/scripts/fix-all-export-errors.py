#!/usr/bin/env python3
"""
Comprehensive Export Error Fixer

Reads all feature index.ts files, validates every export added by the previous script,
and fixes or removes invalid exports.

Issues to fix:
1. Named export syntax for default exports
2. Exports referencing non-existent files
3. Exports referencing non-existent named exports
4. Duplicate exports (same symbol exported twice)
5. Type exports that should be value exports or vice versa
"""

import re
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional

SRC_DIR = Path('src')

def get_file_exports(file_path: Path) -> Dict:
    """Analyze a file to determine what it exports and how"""
    if not file_path.exists():
        return {'exists': False, 'default': None, 'named': set(), 'types': set()}
    
    content = file_path.read_text(encoding='utf-8')
    result = {
        'exists': True,
        'default': None,
        'named': set(),
        'types': set()
    }
    
    # Check for default export
    if re.search(r'export\s+default\s+', content):
        result['default'] = True
    
    # Check for named exports
    for m in re.finditer(r'export\s+(?:const|function|class|let|var|async\s+function)\s+(\w+)', content):
        result['named'].add(m.group(1))
    
    # Check for type/interface exports
    for m in re.finditer(r'export\s+(?:type|interface|enum)\s+(\w+)', content):
        result['types'].add(m.group(1))
    
    # Check for re-exports: export { X } from ...
    for m in re.finditer(r'export\s+\{([^}]+)\}', content):
        names = m.group(1)
        for name in names.split(','):
            name = name.strip()
            if ' as ' in name:
                name = name.split(' as ')[-1].strip()
            if name and name != 'default':
                result['named'].add(name)
    
    return result

def resolve_export_path(index_dir: Path, rel_path: str) -> Path:
    """Resolve a relative export path to an actual file"""
    base = index_dir / rel_path
    
    # Try various extensions
    for ext in ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']:
        candidate = base.parent / (base.name + ext) if not ext.startswith('/') else Path(str(base) + ext)
        if candidate.exists():
            return candidate
    
    return base

def validate_and_fix_index(index_path: Path) -> int:
    """Validate and fix exports in an index file"""
    content = index_path.read_text(encoding='utf-8')
    original_content = content
    index_dir = index_path.parent
    fixes = 0
    
    lines = content.split('\n')
    new_lines = []
    seen_exports = {}  # track exported names to detect duplicates
    
    for line in lines:
        stripped = line.strip()
        
        # Skip empty lines and comments
        if not stripped or stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
            new_lines.append(line)
            continue
        
        # Match export statements with from clause
        export_match = re.match(
            r"export\s+(?:(type)\s+)?\{\s*([^}]*)\s*\}\s+from\s+'([^']+)';",
            stripped
        )
        
        if not export_match:
            # Match: export * from './path'
            star_match = re.match(r"export\s+\*\s+from\s+'([^']+)';", stripped)
            if star_match:
                rel_path = star_match.group(1)
                resolved = resolve_export_path(index_dir, rel_path)
                if not resolved.exists() and not (index_dir / rel_path).is_dir():
                    print(f"  REMOVE (file not found): {stripped}")
                    fixes += 1
                    continue
            new_lines.append(line)
            continue
        
        is_type = export_match.group(1) == 'type'
        export_names_raw = export_match.group(2)
        rel_path = export_match.group(3)
        
        # Parse export names
        export_names = []
        is_default_as = False
        for name_part in export_names_raw.split(','):
            name_part = name_part.strip()
            if not name_part:
                continue
            if 'default as' in name_part:
                is_default_as = True
                actual_name = name_part.split('default as')[-1].strip()
                export_names.append(('default_as', actual_name))
            elif ' as ' in name_part:
                orig, alias = name_part.split(' as ')
                export_names.append(('alias', alias.strip(), orig.strip()))
            else:
                export_names.append(('named', name_part))
        
        # Resolve the file
        resolved = resolve_export_path(index_dir, rel_path)
        
        if not resolved.exists():
            print(f"  REMOVE (file not found): {stripped}")
            fixes += 1
            continue
        
        # Get file's actual exports
        file_exports = get_file_exports(resolved)
        
        # Check for duplicates
        skip_line = False
        for entry in export_names:
            name = entry[1] if len(entry) > 1 else entry[0]
            if name in seen_exports:
                print(f"  REMOVE (duplicate): {name} already exported from {seen_exports[name]}")
                skip_line = True
                fixes += 1
                break
        
        if skip_line:
            continue
        
        # Validate each export
        valid_exports = []
        needs_fix = False
        
        for entry in export_names:
            if entry[0] == 'default_as':
                name = entry[1]
                if file_exports['default']:
                    valid_exports.append(f"default as {name}")
                    seen_exports[name] = rel_path
                else:
                    # Maybe it's a named export
                    if name in file_exports['named'] or name in file_exports['types']:
                        valid_exports.append(name)
                        seen_exports[name] = rel_path
                        needs_fix = True
                    else:
                        print(f"  REMOVE (not found): {name} from {rel_path}")
                        needs_fix = True
                        fixes += 1
            elif entry[0] == 'named':
                name = entry[1]
                if name in file_exports['named']:
                    valid_exports.append(name)
                    seen_exports[name] = rel_path
                elif name in file_exports['types']:
                    # Should be type export
                    if not is_type:
                        valid_exports.append(name)
                        seen_exports[name] = rel_path
                        # We'll keep it as-is since TS handles this
                elif file_exports['default'] and len(export_names) == 1:
                    # It's a default export used as named
                    valid_exports.append(f"default as {name}")
                    seen_exports[name] = rel_path
                    needs_fix = True
                    print(f"  FIX default: {name} from {rel_path}")
                    fixes += 1
                else:
                    print(f"  REMOVE (not found): {name} from {rel_path}")
                    needs_fix = True
                    fixes += 1
            elif entry[0] == 'alias':
                alias = entry[1]
                orig = entry[2]
                valid_exports.append(f"{orig} as {alias}")
                seen_exports[alias] = rel_path
        
        if not valid_exports:
            # All exports were invalid, skip the line
            continue
        
        if needs_fix:
            type_prefix = 'type ' if is_type else ''
            new_line = f"export {type_prefix}{{ {', '.join(valid_exports)} }} from '{rel_path}';"
            new_lines.append(new_line)
        else:
            new_lines.append(line)
    
    new_content = '\n'.join(new_lines)
    
    # Clean up multiple blank lines
    new_content = re.sub(r'\n{3,}', '\n\n', new_content)
    
    if new_content != original_content:
        index_path.write_text(new_content, encoding='utf-8')
    
    return fixes

def main():
    print("Comprehensive export validation and fix...")
    
    # Process all feature index files
    index_files = sorted((SRC_DIR / 'features').rglob('index.ts'))
    
    total_fixes = 0
    for index_file in index_files:
        # Only process top-level feature index files
        rel = index_file.relative_to(SRC_DIR / 'features')
        parts = rel.parts
        if len(parts) > 2:  # Skip deeply nested index files
            continue
        
        print(f"\n{'='*50}")
        print(f"Validating: {index_file.relative_to(SRC_DIR)}")
        fixes = validate_and_fix_index(index_file)
        if fixes:
            total_fixes += fixes
            print(f"  → {fixes} fixes applied")
    
    print(f"\n{'='*50}")
    print(f"Total fixes: {total_fixes}")
    print("Run 'npm run build:dev' to verify")

if __name__ == '__main__':
    main()
