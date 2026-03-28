#!/usr/bin/env python3
"""
FSD Export Fixer - Comprehensive Solution
Automatically adds missing exports to index files while maintaining FSD structure
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

def find_source_file_for_export(export_name, search_dir):
    """Find the source file that contains a specific export"""
    
    for file_path in search_dir.rglob('*'):
        if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            # Skip index files, test files, node_modules
            if (file_path.name.startswith('index.') or 
                'node_modules' in str(file_path) or 
                '.test.' in str(file_path) or 
                '.spec.' in str(file_path)):
                continue
            
            exports = extract_exports_from_file(file_path)
            
            # Check if this file exports the name
            if export_name in exports['named']:
                return file_path
            
            # Check default export (use filename as export name)
            if exports['default'] and file_path.stem == export_name:
                return file_path
    
    return None

def get_relative_import_path(source_file, index_file):
    """Get relative import path from index file to source file"""
    try:
        rel_path = os.path.relpath(source_file, index_file.parent)
        rel_path = rel_path.replace('\\', '/')
        
        # Remove extension
        rel_path = re.sub(r'\.(ts|tsx|js|jsx)$', '', rel_path)
        
        # Ensure it starts with ./
        if not rel_path.startswith('.'):
            rel_path = './' + rel_path
        
        return rel_path
    except ValueError:
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

def add_export_to_index(index_path, export_name, source_file):
    """Add an export statement to an index file"""
    
    try:
        # Read current content
        if index_path.exists():
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
        else:
            print(f"⚠️  Index file doesn't exist: {index_path}")
            return False
        
        # Check if already exported (avoid duplicates)
        # Check for: export { name } or export * from './path' that might include it
        if re.search(rf"\b{re.escape(export_name)}\b", content):
            return False
        
        # Get relative path from index to source
        rel_path = get_relative_import_path(source_file, index_path)
        if not rel_path:
            return False
        
        # Determine export statement
        exports_from_source = extract_exports_from_file(source_file)
        
        # Check if it's a default export
        if exports_from_source['default'] and source_file.stem == export_name:
            export_line = f"export {{ default as {export_name} }} from '{rel_path}';\n"
        else:
            export_line = f"export {{ {export_name} }} from '{rel_path}';\n"
        
        # Append to file
        with open(index_path, 'a', encoding='utf-8') as f:
            f.write(export_line)
        
        return True
        
    except Exception as e:
        print(f"❌ Error adding export to {index_path}: {e}")
        return False

def main():
    print("🔍 Finding missing exports...\n")
    
    missing = find_missing_exports()
    
    if not missing:
        print("✅ No missing exports found!")
        return
    
    print(f"Found {len(missing)} missing exports\n")
    
    # Group by export file (index files only)
    by_index_file = defaultdict(list)
    for item in missing:
        export_file = item['export_file']
        # Only process index files
        if 'index.' in Path(export_file).name:
            by_index_file[export_file].append(item)
    
    print(f"🔧 Processing {len(by_index_file)} index files...\n")
    
    fixed_count = 0
    skipped_count = 0
    
    for index_file_path, items in sorted(by_index_file.items()):
        index_path = ROOT_DIR / index_file_path
        
        if not index_path.exists():
            print(f"⚠️  Skipping non-existent index: {index_file_path}")
            continue
        
        print(f"📁 {index_file_path}")
        
        # Get directory to search for source files
        search_dir = index_path.parent
        
        # Process each missing export
        for item in items:
            export_name = item['name']
            
            # Find source file
            source_file = find_source_file_for_export(export_name, search_dir)
            
            if not source_file:
                print(f"   ⚠️  Could not find source for: {export_name}")
                skipped_count += 1
                continue
            
            # Add export to index
            if add_export_to_index(index_path, export_name, source_file):
                print(f"   ✓ Added: {export_name} from {source_file.name}")
                fixed_count += 1
            else:
                skipped_count += 1
        
        print()
    
    print(f"\n✅ Summary:")
    print(f"   Fixed: {fixed_count} exports")
    print(f"   Skipped: {skipped_count} exports (already exist or not found)")
    print(f"\n💡 Run 'python scripts/find-missing-exports.py' to verify remaining issues")

if __name__ == '__main__':
    main()
