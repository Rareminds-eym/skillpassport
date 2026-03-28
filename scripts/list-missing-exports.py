#!/usr/bin/env python3
"""
List Missing Exports - Simple version
Shows first 50 missing exports with details
"""

import os
import re
import sys
from pathlib import Path
from collections import defaultdict

ROOT_DIR = Path(__file__).parent.parent

def extract_imports_from_file(file_path):
    """Extract all imports from a file"""
    imports = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Match: import { name1, name2 } from 'path'
        pattern1 = r"import\s+{([^}]+)}\s+from\s+['\"]([^'\"]+)['\"]"
        for match in re.finditer(pattern1, content):
            names = match.group(1)
            path = match.group(2)
            for name in names.split(','):
                name = name.strip()
                name = re.sub(r'^type\s+', '', name)
                if ' as ' in name:
                    name = name.split(' as ')[0].strip()
                if name and not name.startswith('//'):
                    imports.append({
                        'name': name,
                        'path': path,
                        'file': str(file_path.relative_to(ROOT_DIR))
                    })
        
        # Match: import name from 'path'
        pattern2 = r"import\s+(\w+)\s+from\s+['\"]([^'\"]+)['\"]"
        for match in re.finditer(pattern2, content):
            name = match.group(1)
            path = match.group(2)
            if name and name != 'type':
                imports.append({
                    'name': name,
                    'path': path,
                    'file': str(file_path.relative_to(ROOT_DIR)),
                    'default': True
                })
                
    except Exception as e:
        pass
    
    return imports

def extract_exports_from_file(file_path):
    """Extract all exports from a file"""
    exports = {
        'named': set(),
        'default': None,
        'reexports': []
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Named exports: export { name1, name2 }
        pattern1 = r"export\s+{([^}]+)}"
        for match in re.finditer(pattern1, content):
            names = match.group(1)
            for name in names.split(','):
                name = name.strip()
                name = re.sub(r'^type\s+', '', name)
                if ' as ' in name:
                    name = name.split(' as ')[-1].strip()
                if name:
                    exports['named'].add(name)
        
        # Direct exports: export const/function/class name
        pattern2 = r"export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)"
        for match in re.finditer(pattern2, content):
            exports['named'].add(match.group(1))
        
        # Default export
        pattern3 = r"export\s+default\s+"
        if re.search(pattern3, content):
            exports['default'] = True
        
        # Re-exports: export * from 'path'
        pattern4 = r"export\s+\*\s+from\s+['\"]([^'\"]+)['\"]"
        for match in re.finditer(pattern4, content):
            exports['reexports'].append(match.group(1))
            
    except Exception as e:
        pass
    
    return exports

def resolve_import_path(import_path, from_file):
    """Resolve import path to actual file"""
    
    if import_path.startswith('@/'):
        import_path = import_path[2:]
        base = ROOT_DIR / 'src'
    elif import_path.startswith('.'):
        base = (ROOT_DIR / from_file).parent
    else:
        return None
    
    for ext in ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx']:
        full_path = base / (import_path + ext)
        if full_path.exists():
            return full_path
    
    return None

def find_missing_exports():
    """Find all missing exports"""
    
    all_imports = []
    src_dir = ROOT_DIR / 'src'
    
    for file_path in src_dir.rglob('*'):
        if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            if 'node_modules' in str(file_path) or '.test.' in str(file_path) or '.spec.' in str(file_path):
                continue
            imports = extract_imports_from_file(file_path)
            all_imports.extend(imports)
    
    imports_by_path = defaultdict(list)
    for imp in all_imports:
        imports_by_path[imp['path']].append(imp)
    
    missing_exports = []
    
    for import_path, imports in imports_by_path.items():
        if not import_path.startswith('@/') and not import_path.startswith('.'):
            continue
        
        example_file = imports[0]['file']
        resolved_path = resolve_import_path(import_path, example_file)
        
        if not resolved_path:
            continue
        
        exports = extract_exports_from_file(resolved_path)
        
        for imp in imports:
            is_default = imp.get('default', False)
            
            if is_default:
                if not exports['default']:
                    missing_exports.append({
                        'name': imp['name'],
                        'type': 'default',
                        'import_path': import_path,
                        'export_file': str(resolved_path.relative_to(ROOT_DIR)),
                        'importing_file': imp['file']
                    })
            else:
                if imp['name'] not in exports['named']:
                    found_in_reexport = False
                    for reexport_path in exports['reexports']:
                        reexport_resolved = resolve_import_path(reexport_path, str(resolved_path.relative_to(ROOT_DIR)))
                        if reexport_resolved:
                            reexport_exports = extract_exports_from_file(reexport_resolved)
                            if imp['name'] in reexport_exports['named']:
                                found_in_reexport = True
                                break
                    
                    if not found_in_reexport:
                        missing_exports.append({
                            'name': imp['name'],
                            'type': 'named',
                            'import_path': import_path,
                            'export_file': str(resolved_path.relative_to(ROOT_DIR)),
                            'importing_file': imp['file']
                        })
    
    seen = set()
    unique_missing = []
    for item in missing_exports:
        key = (item['name'], item['export_file'])
        if key not in seen:
            seen.add(key)
            unique_missing.append(item)
    
    return unique_missing

def main():
    missing = find_missing_exports()
    
    if not missing:
        print("No missing exports found!")
        return
    
    print(f"Total: {len(missing)} missing exports")
    print()
    
    # Group by export file
    by_file = defaultdict(list)
    for item in missing:
        by_file[item['export_file']].append(item)
    
    print(f"Files: {len(by_file)}")
    print()
    
    # Show first 50
    count = 0
    for export_file, items in sorted(by_file.items()):
        if count >= 50:
            break
        
        print(f"{export_file}")
        names = sorted(set(item['name'] for item in items))
        for name in names[:10]:
            example = next(item for item in items if item['name'] == name)
            print(f"  - {name} (imported by: {example['importing_file']})")
        if len(names) > 10:
            print(f"  ... and {len(names) - 10} more")
        print()
        count += 1

if __name__ == '__main__':
    # Force UTF-8 output
    if sys.platform == 'win32':
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    
    main()
