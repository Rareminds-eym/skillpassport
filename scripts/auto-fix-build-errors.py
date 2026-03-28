#!/usr/bin/env python3
"""
Automatically fix build errors by:
1. Running the build and capturing errors
2. Parsing missing export errors
3. Finding exports in backup files
4. Adding missing exports to index files
"""

import os
import re
import subprocess
import sys
from pathlib import Path
from collections import defaultdict

WORKSPACE_ROOT = Path(__file__).parent.parent
BACKUP_DIR = WORKSPACE_ROOT / '.migration-backups' / 'backup-2026-03-21T08-40-21-393Z'
SRC_DIR = WORKSPACE_ROOT / 'src'

def run_build():
    """Run the build and capture errors."""
    print("🔨 Running build to capture errors...")
    result = subprocess.run(
        ['npm', 'run', 'build:dev'],
        cwd=WORKSPACE_ROOT,
        capture_output=True,
        text=True,
        timeout=180
    )
    return result.stdout + result.stderr

def parse_build_errors(build_output):
    """Parse build output to extract missing export errors."""
    errors = []
    
    # Pattern: "exportName" is not exported by "path/to/file.ts"
    pattern = r'"([^"]+)"\s+is not exported by\s+"([^"]+)"'
    
    for match in re.finditer(pattern, build_output):
        export_name = match.group(1)
        export_file = match.group(2)
        
        # Convert to relative path
        export_file = export_file.replace('src/', '')
        
        errors.append({
            'export_name': export_name,
            'export_file': export_file
        })
    
    return errors

def find_in_backup(search_term, file_pattern='*.ts'):
    """Search for a term in backup files."""
    results = []
    
    for root, dirs, files in os.walk(BACKUP_DIR):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                filepath = Path(root) / file
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if search_term in content:
                            results.append((filepath, content))
                except:
                    continue
    
    return results

def extract_export_statement(content, export_name):
    """Extract the export statement for a given name."""
    lines = content.split('\n')
    
    # Look for various export patterns
    patterns = [
        rf'^export\s+(const|function|class|interface|type|enum)\s+{export_name}\b',
        rf'^export\s+async\s+(const|function)\s+{export_name}\b',
        rf'^export\s+default\s+(const|function|class)?\s*{export_name}\b',
        rf'^export\s+\{{\s*{export_name}',
    ]
    
    for i, line in enumerate(lines):
        for pattern in patterns:
            if re.search(pattern, line.strip()):
                # Found the export, now extract it
                if 'const' in line or 'function' in line or 'class' in line:
                    # Extract full definition
                    return extract_definition(lines, i, export_name)
                elif 'interface' in line or 'type' in line or 'enum' in line:
                    return extract_type_definition(lines, i)
                else:
                    # Simple export statement
                    return line.strip()
    
    return None

def extract_definition(lines, start_idx, name):
    """Extract a complete function/const/class definition."""
    result = []
    brace_count = 0
    paren_count = 0
    in_def = False
    
    for i in range(start_idx, len(lines)):
        line = lines[i]
        result.append(line)
        
        # Count braces and parens
        for char in line:
            if char == '{':
                brace_count += 1
                in_def = True
            elif char == '}':
                brace_count -= 1
            elif char == '(':
                paren_count += 1
            elif char == ')':
                paren_count -= 1
        
        # Check if definition is complete
        if in_def and brace_count == 0:
            break
        
        # For arrow functions without braces
        if '=>' in line and ';' in line and brace_count == 0:
            break
    
    return '\n'.join(result)

def extract_type_definition(lines, start_idx):
    """Extract a complete type/interface/enum definition."""
    result = []
    brace_count = 0
    
    for i in range(start_idx, len(lines)):
        line = lines[i]
        result.append(line)
        
        for char in line:
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
        
        if brace_count == 0 and '{' in ''.join(result):
            break
        
        # For simple type aliases
        if ';' in line and brace_count == 0:
            break
    
    return '\n'.join(result)

def add_export_to_index(index_file, export_name, source_file):
    """Add an export statement to an index file."""
    index_path = SRC_DIR / index_file
    
    if not index_path.exists():
        print(f"  ⚠️  Index file doesn't exist: {index_file}")
        return False
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if export already exists
    if f"export {{ {export_name} }}" in content or f"export * from" in content:
        print(f"  ℹ️  Export might already exist in {index_file}")
        return False
    
    # Determine the relative import path
    index_dir = index_path.parent
    source_path = SRC_DIR / source_file.replace(index_file, '')
    
    # Calculate relative path
    try:
        rel_path = os.path.relpath(source_path.parent, index_dir).replace('\\', '/')
        if not rel_path.startswith('.'):
            rel_path = './' + rel_path
    except:
        rel_path = './api'
    
    # Add export statement
    export_statement = f"\nexport {{ {export_name} }} from '{rel_path}/{source_path.stem}';"
    
    with open(index_path, 'a', encoding='utf-8') as f:
        f.write(export_statement)
    
    print(f"  ✅ Added export to {index_file}")
    return True

def main():
    print("🚀 Auto-Fix Build Errors")
    print("=" * 70)
    
    # Run build and get errors
    build_output = run_build()
    
    # Parse errors
    errors = parse_build_errors(build_output)
    
    if not errors:
        print("\n✅ No export errors found!")
        return
    
    print(f"\n📋 Found {len(errors)} export errors")
    
    # Group errors by export file
    errors_by_file = defaultdict(list)
    for error in errors:
        errors_by_file[error['export_file']].append(error['export_name'])
    
    # Fix each file
    fixed_count = 0
    for export_file, export_names in errors_by_file.items():
        print(f"\n📁 Fixing {export_file}")
        print(f"   Missing exports: {', '.join(export_names)}")
        
        for export_name in export_names:
            # Search in backup
            results = find_in_backup(export_name)
            
            if results:
                print(f"  ✓ Found {export_name} in {len(results)} backup files")
                
                # Try to add export to index
                if add_export_to_index(export_file, export_name, export_file):
                    fixed_count += 1
            else:
                print(f"  ❌ Could not find {export_name} in backups")
    
    print("\n" + "=" * 70)
    print(f"✅ Fixed {fixed_count} exports")
    print("\n💡 Run 'npm run build:dev' again to check for remaining errors")

if __name__ == '__main__':
    main()
