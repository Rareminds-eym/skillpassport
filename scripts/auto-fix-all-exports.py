#!/usr/bin/env python3
"""
Comprehensive Export Fixer
Automatically adds missing exports to all index files
"""

import os
import re
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

def find_all_exports_in_directory(directory):
    """Find all exported symbols in a directory"""
    all_exports = {}
    
    for file_path in directory.rglob('*'):
        if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            if 'node_modules' in str(file_path) or file_path.name.startswith('index.'):
                continue
            
            exports = extract_exports_from_file(file_path)
            for export_name in exports['named']:
                all_exports[export_name] = file_path
            
            if exports['default']:
                # Use filename without extension as default export name
                default_name = file_path.stem
                all_exports[default_name] = file_path
    
    return all_exports

def update_index_file(index_path, missing_names, directory_exports):
    """Update index file with missing exports"""
    
    try:
        # Read current content
        if index_path.exists():
            content = index_path.read_text(encoding='utf-8')
        else:
            index_path.parent.mkdir(parents=True, exist_ok=True)
            content = ''
        
        # Track what we add
        added = []
        
        for name in missing_names:
            # Skip if already exported
            if re.search(rf"\b{name}\b", content):
                continue
            
            # Find source file
            if name in directory_exports:
                source_file = directory_exports[name]
                
                # Calculate relative path
                try:
                    rel_path = os.path.relpath(source_file, index_path.parent)
                    rel_path = rel_path.replace('\\', '/')
                    if not rel_path.startswith('.'):
                        rel_path = './' + rel_path
                    rel_path = re.sub(r'\.(ts|tsx|js|jsx)$', '', rel_path)
                    
                    # Add export
                    export_line = f"export {{ {name} }} from '{rel_path}';\n"
                    content += export_line
                    added.append(name)
                    
                except ValueError:
                    pass
        
        if added:
            index_path.write_text(content, encoding='utf-8')
            return added
        
        return []
        
    except Exception as e:
        print(f"Error updating {index_path}: {e}")
        return []

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
    print("🔍 Finding and fixing missing exports...\n")
    
    missing = find_missing_exports()
    
    if not missing:
        print("✅ No missing exports found!")
        return
    
    print(f"Found {len(missing)} missing exports\n")
    
    # Group by export file (index files)
    by_file = defaultdict(list)
    for item in missing:
        export_file = item['export_file']
        # Only process index files
        if 'index.' in Path(export_file).name:
            by_file[export_file].append(item)
    
    print(f"🔧 Processing {len(by_file)} index files...\n")
    
    fixed_files = 0
    fixed_exports = 0
    
    for export_file, items in sorted(by_file.items()):
        export_path = ROOT_DIR / export_file
        
        if not export_path.exists():
            continue
        
        export_dir = export_path.parent
        
        # Find all exports in this directory
        directory_exports = find_all_exports_in_directory(export_dir)
        
        # Get missing names
        missing_names = list(set(item['name'] for item in items))
        
        # Update index file
        added = update_index_file(export_path, missing_names, directory_exports)
        
        if added:
            fixed_files += 1
            fixed_exports += len(added)
            print(f"✓ {export_file}")
            for name in added[:5]:  # Show first 5
                print(f"  + {name}")
            if len(added) > 5:
                print(f"  ... and {len(added) - 5} more")
            print()
    
    print(f"\n✅ Fixed {fixed_exports} exports in {fixed_files} files")

if __name__ == '__main__':
    main()
