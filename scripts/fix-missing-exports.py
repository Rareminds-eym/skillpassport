#!/usr/bin/env python3
"""
Fix Missing Exports Script
Automatically adds missing exports to index files
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
                if name:
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

def find_source_file(export_name, export_dir):
    """Find the source file that contains the export"""
    
    for file_path in export_dir.rglob('*'):
        if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            if 'node_modules' in str(file_path) or file_path.name.startswith('index.'):
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Check for named export
                if re.search(rf"export\s+(?:const|let|var|function|class|interface|type|enum)\s+{export_name}\b", content):
                    return file_path
                
                # Check for default export with matching name
                if re.search(rf"export\s+default\s+{export_name}\b", content):
                    return file_path
                    
                # Check for function/class definition followed by export
                if re.search(rf"(?:const|let|var|function|class)\s+{export_name}\b", content) and \
                   re.search(rf"export\s+{{[^}}]*{export_name}[^}}]*}}", content):
                    return file_path
                    
            except Exception:
                pass
    
    return None

def add_export_to_index(index_path, export_name, source_file, export_dir):
    """Add export to index file"""
    
    try:
        # Create index if it doesn't exist
        if not index_path.exists():
            index_path.parent.mkdir(parents=True, exist_ok=True)
            index_path.write_text('', encoding='utf-8')
        
        content = index_path.read_text(encoding='utf-8')
        
        # Calculate relative path from index to source
        try:
            rel_path = os.path.relpath(source_file, index_path.parent)
            rel_path = rel_path.replace('\\', '/')
            if not rel_path.startswith('.'):
                rel_path = './' + rel_path
            # Remove extension
            rel_path = re.sub(r'\.(ts|tsx|js|jsx)$', '', rel_path)
        except ValueError:
            return False
        
        # Check if already exported
        if re.search(rf"export\s+{{[^}}]*{export_name}[^}}]*}}\s+from\s+['\"]", content):
            return False
        if re.search(rf"export\s+\*\s+from\s+['\"].*{re.escape(rel_path)}['\"]", content):
            return False
        
        # Add export
        export_line = f"export {{ {export_name} }} from '{rel_path}';\n"
        content += export_line
        
        index_path.write_text(content, encoding='utf-8')
        return True
        
    except Exception as e:
        print(f"Error adding export to {index_path}: {e}")
        return False

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
    print("🔍 Finding missing exports...\n")
    
    missing = find_missing_exports()
    
    if not missing:
        print("✅ No missing exports found!")
        return
    
    print(f"Found {len(missing)} missing exports\n")
    
    # Group by export file
    by_file = defaultdict(list)
    for item in missing:
        by_file[item['export_file']].append(item)
    
    print(f"🔧 Fixing {len(by_file)} index files...\n")
    
    fixed_files = 0
    fixed_exports = 0
    
    for export_file, items in sorted(by_file.items()):
        export_path = ROOT_DIR / export_file
        
        if not export_path.exists():
            continue
        
        # Skip if not an index file
        if not export_path.name.startswith('index.'):
            continue
        
        export_dir = export_path.parent
        file_fixed = False
        
        for item in items:
            # Find source file
            source_file = find_source_file(item['name'], export_dir)
            
            if source_file:
                if add_export_to_index(export_path, item['name'], source_file, export_dir):
                    fixed_exports += 1
                    file_fixed = True
                    print(f"  ✓ Added {item['name']} from {source_file.name}")
        
        if file_fixed:
            fixed_files += 1
            print(f"📁 Updated: {export_file}\n")
    
    print(f"\n✅ Summary:")
    print(f"   Fixed {fixed_exports} exports in {fixed_files} files")

if __name__ == '__main__':
    main()
