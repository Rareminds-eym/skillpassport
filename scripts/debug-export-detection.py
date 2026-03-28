#!/usr/bin/env python3
import os
import re
from pathlib import Path
from collections import defaultdict

ROOT_DIR = Path(__file__).parent.parent

def extract_imports_from_file(file_path):
    imports = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
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
                    imports.append({'name': name, 'path': path, 'file': str(file_path.relative_to(ROOT_DIR))})
    except: pass
    return imports

def extract_exports_from_file(file_path):
    exports = {'named': set(), 'default': None, 'reexports': []}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
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
        pattern2 = r"export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)"
        for match in re.finditer(pattern2, content):
            exports['named'].add(match.group(1))
        if re.search(r"export\s+default\s+", content):
            exports['default'] = True
        pattern4 = r"export\s+\*\s+from\s+['\"]([^'\"]+)['\"]"
        for match in re.finditer(pattern4, content):
            exports['reexports'].append(match.group(1))
    except: pass
    return exports

def resolve_import_path(import_path, from_file):
    if import_path.startswith('@/'):
        import_path = import_path[2:]
        base = ROOT_DIR / 'src'
    elif import_path.startswith('.'):
        base = (ROOT_DIR / from_file).parent
    else:
        return None
    
    # Try extensions in order: index files first, then direct files
    for ext in ['/index.ts', '/index.tsx', '/index.js', '/index.jsx', '.ts', '.tsx', '.js', '.jsx', '']:
        full_path = base / (import_path + ext)
        if full_path.exists() and full_path.is_file():
            return full_path
    return None

# Test specific case
test_import = {
    'name': 'TokenRefreshErrorNotification',
    'path': './app/providers/token-refresh-notification',
    'file': 'src/App.tsx'
}

print(f"Testing: {test_import['name']} from {test_import['path']}")
print(f"Imported in: {test_import['file']}")
print()

resolved = resolve_import_path(test_import['path'], test_import['file'])
print(f"Resolved to: {resolved}")
print(f"Is index file: {'index.' in resolved.name if resolved else 'N/A'}")
print()

if resolved:
    exports = extract_exports_from_file(resolved)
    print(f"Exports in file:")
    print(f"  Named: {exports['named']}")
    print(f"  Default: {exports['default']}")
    print(f"  Re-exports: {exports['reexports']}")
    print()
    
    if test_import['name'] in exports['named']:
        print("FOUND in named exports")
    elif exports['default']:
        print("Has default export")
    else:
        print("MISSING")
