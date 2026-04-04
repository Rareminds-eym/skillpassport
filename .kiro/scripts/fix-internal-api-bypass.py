#!/usr/bin/env python3
"""
Fix Internal API Bypass Violations

This script identifies and fixes imports that bypass feature public APIs by importing
directly from /ui/, /api/, /model/, or /lib/ segments.

Strategy:
1. Identify all internal API bypass imports
2. Check if components are exported from feature index files
3. Add missing exports to index files
4. Update import statements to use feature index
"""

import re
import json
from pathlib import Path
from typing import List, Dict, Set, Tuple

# Load violation report
VIOLATION_REPORT = Path('.kiro/specs/fsd-violations-cleanup/violation-report-2026-04-01T06-05-31-065Z.json')
SRC_DIR = Path('src')

def load_violations() -> List[Dict]:
    """Load internal API bypass violations from report"""
    with open(VIOLATION_REPORT, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['importViolations']['internalAPIBypass']

def parse_import_statement(import_stmt: str) -> Tuple[List[str], str]:
    """
    Parse import statement to extract imported names and module path
    
    Returns: (list of imported names, module path)
    """
    # Handle default imports: import X from 'path'
    default_match = re.search(r'import\s+(\w+)\s+from\s+[\'"]([^\'"]+)[\'"]', import_stmt)
    if default_match and not '{' in import_stmt:
        return ([default_match.group(1)], default_match.group(2))
    
    # Handle named imports: import { X, Y } from 'path'
    named_match = re.search(r'import\s+\{([^}]+)\}\s+from\s+[\'"]([^\'"]+)[\'"]', import_stmt)
    if named_match:
        names = [n.strip().split(' as ')[0].strip() for n in named_match.group(1).split(',')]
        return (names, named_match.group(2))
    
    # Handle type imports: import type { X } from 'path'
    type_match = re.search(r'import\s+type\s+\{([^}]+)\}\s+from\s+[\'"]([^\'"]+)[\'"]', import_stmt)
    if type_match:
        names = [n.strip().split(' as ')[0].strip() for n in type_match.group(1).split(',')]
        return (names, type_match.group(2))
    
    return ([], '')

def extract_feature_name(module_path: str) -> str:
    """Extract feature name from module path like @/features/feature-name/ui/Component"""
    match = re.search(r'@/features/([^/]+)/', module_path)
    return match.group(1) if match else ''

def get_feature_index_path(feature_name: str) -> Path:
    """Get path to feature index file"""
    return SRC_DIR / 'features' / feature_name / 'index.ts'

def read_feature_exports(feature_name: str) -> Set[str]:
    """Read existing exports from feature index file"""
    index_path = get_feature_index_path(feature_name)
    if not index_path.exists():
        return set()
    
    content = index_path.read_text(encoding='utf-8')
    exports = set()
    
    # Match: export { X } from './segment/file'
    for match in re.finditer(r'export\s+\{([^}]+)\}\s+from', content):
        names = [n.strip().split(' as ')[-1].strip() for n in match.group(1).split(',')]
        exports.update(names)
    
    # Match: export { default as X } from './segment/file'
    for match in re.finditer(r'export\s+\{\s*default\s+as\s+(\w+)\s*\}', content):
        exports.add(match.group(1))
    
    # Match: export * from './segment'
    # This exports everything, so we'd need to check the actual files
    
    return exports

def find_component_in_feature(feature_name: str, component_name: str) -> str:
    """Find the segment and file path for a component within a feature"""
    feature_dir = SRC_DIR / 'features' / feature_name
    
    # Search in ui/, api/, model/, lib/ segments
    for segment in ['ui', 'api', 'model', 'lib']:
        segment_dir = feature_dir / segment
        if not segment_dir.exists():
            continue
        
        # Look for files matching the component name
        for file_path in segment_dir.rglob('*'):
            if not file_path.is_file():
                continue
            
            # Check if file exports the component
            if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
                content = file_path.read_text(encoding='utf-8')
                
                # Check for export default ComponentName or export const ComponentName
                if (f'export default {component_name}' in content or
                    f'export const {component_name}' in content or
                    f'export function {component_name}' in content or
                    f'export class {component_name}' in content or
                    f'export type {component_name}' in content or
                    f'export interface {component_name}' in content):
                    
                    # Return relative path from feature root
                    rel_path = file_path.relative_to(feature_dir)
                    return f'./{rel_path.as_posix()}'.replace('.ts', '').replace('.tsx', '').replace('.js', '').replace('.jsx', '')
    
    return ''

def add_export_to_index(feature_name: str, component_name: str, source_path: str):
    """Add export to feature index file"""
    index_path = get_feature_index_path(feature_name)
    
    # Create index file if it doesn't exist
    if not index_path.exists():
        index_path.parent.mkdir(parents=True, exist_ok=True)
        index_path.write_text('', encoding='utf-8')
    
    content = index_path.read_text(encoding='utf-8')
    
    # Check if already exported
    if f'export {{ {component_name} }}' in content or f'export {{ default as {component_name} }}' in content:
        return False
    
    # Add export
    export_line = f"export {{ {component_name} }} from '{source_path}';\n"
    
    # Try to add in appropriate section
    if content:
        content += '\n' + export_line
    else:
        content = export_line
    
    index_path.write_text(content, encoding='utf-8')
    return True

def update_import_in_file(file_path: str, old_import: str, feature_name: str, imported_names: List[str]):
    """Update import statement in file to use feature index"""
    file_path_obj = Path(file_path)
    if not file_path_obj.exists():
        return False
    
    content = file_path_obj.read_text(encoding='utf-8')
    
    # Create new import statement
    if len(imported_names) == 1:
        # Check if it was a default import
        if 'import {' not in old_import and 'import type' not in old_import:
            new_import = f"import {{ {imported_names[0]} }} from '@/features/{feature_name}';"
        else:
            new_import = f"import {{ {', '.join(imported_names)} }} from '@/features/{feature_name}';"
    else:
        new_import = f"import {{ {', '.join(imported_names)} }} from '@/features/{feature_name}';"
    
    # Handle type imports
    if 'import type' in old_import:
        new_import = new_import.replace('import {', 'import type {')
    
    # Replace old import with new import
    # Normalize whitespace for matching
    old_import_normalized = ' '.join(old_import.split())
    content_normalized = ' '.join(content.split())
    
    if old_import_normalized in content_normalized:
        content = content.replace(old_import.strip(), new_import)
        file_path_obj.write_text(content, encoding='utf-8')
        return True
    
    return False

def main():
    print("Loading internal API bypass violations...")
    violations = load_violations()
    print(f"Found {len(violations)} violations")
    
    # Group violations by feature
    by_feature = {}
    for v in violations:
        imported_names, module_path = parse_import_statement(v['importStatement'])
        if not imported_names or not module_path:
            continue
        
        feature_name = extract_feature_name(module_path)
        if not feature_name:
            continue
        
        if feature_name not in by_feature:
            by_feature[feature_name] = []
        
        by_feature[feature_name].append({
            'file': v['file'],
            'line': v['line'],
            'import': v['importStatement'],
            'names': imported_names,
            'module': module_path
        })
    
    print(f"\nViolations across {len(by_feature)} features")
    
    # Process each feature
    exports_added = 0
    imports_updated = 0
    
    for feature_name, feature_violations in sorted(by_feature.items()):
        print(f"\n{'='*60}")
        print(f"Feature: {feature_name}")
        print(f"Violations: {len(feature_violations)}")
        
        # Get existing exports
        existing_exports = read_feature_exports(feature_name)
        print(f"Existing exports: {len(existing_exports)}")
        
        # Collect all components that need to be exported
        components_to_export = set()
        for v in feature_violations:
            components_to_export.update(v['names'])
        
        # Add missing exports
        for component in components_to_export:
            if component in existing_exports:
                print(f"  ✓ {component} already exported")
                continue
            
            # Find component in feature
            source_path = find_component_in_feature(feature_name, component)
            if source_path:
                if add_export_to_index(feature_name, component, source_path):
                    print(f"  + Added export: {component} from {source_path}")
                    exports_added += 1
            else:
                print(f"  ✗ Could not find {component} in feature")
        
        # Update imports
        for v in feature_violations:
            if update_import_in_file(v['file'], v['import'], feature_name, v['names']):
                print(f"  → Updated import in {Path(v['file']).name}")
                imports_updated += 1
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Exports added: {exports_added}")
    print(f"  Imports updated: {imports_updated}")
    print(f"\nRun 'npm run build:dev' to verify changes")

if __name__ == '__main__':
    main()
