#!/usr/bin/env python3
"""
Batch fix all export issues by running build, parsing errors, and fixing them.
"""

import os
import re
import subprocess
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).parent.parent
BACKUP_DIR = WORKSPACE_ROOT / '.migration-backups' / 'backup-2026-03-21T08-40-21-393Z'
SRC_DIR = WORKSPACE_ROOT / 'src'

def run_build():
    """Run build and return output."""
    print("🔨 Running build...")
    result = subprocess.run(
        'npm run build:dev',
        cwd=WORKSPACE_ROOT,
        capture_output=True,
        text=True,
        timeout=180,
        shell=True
    )
    return result.stdout + result.stderr

def parse_errors(output):
    """Parse missing export errors from build output."""
    errors = []
    pattern = r'"([^"]+)"\s+is not exported by\s+"([^"]+)"'
    
    for match in re.finditer(pattern, output):
        export_name = match.group(1)
        export_file = match.group(2).replace('src/', '')
        errors.append({'name': export_name, 'file': export_file})
    
    return errors

def find_in_backup(name):
    """Find where a symbol is defined in backup."""
    for root, dirs, files in os.walk(BACKUP_DIR):
        for file in files:
            if not file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                continue
            
            filepath = Path(root) / file
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # Check for export or definition
                    patterns = [
                        rf'\bexport\s+(const|function|class|interface|type|enum)\s+{name}\b',
                        rf'\bexport\s+default\s+{name}\b',
                        rf'\b(const|function|class)\s+{name}\s*[=\(]',
                    ]
                    
                    for pattern in patterns:
                        if re.search(pattern, content):
                            return filepath, content
            except:
                continue
    
    return None, None

def extract_full_definition(content, name):
    """Extract complete definition including types."""
    lines = content.split('\n')
    result = []
    found = False
    brace_count = 0
    in_def = False
    
    for i, line in enumerate(lines):
        # Look for the definition
        if not found:
            patterns = [
                rf'\bexport\s+(const|function|class|interface|type|enum)\s+{name}\b',
                rf'\b(const|function|class|interface|type|enum)\s+{name}\b',
            ]
            
            for pattern in patterns:
                if re.search(pattern, line):
                    found = True
                    # Check for related types/interfaces above
                    for j in range(max(0, i-20), i):
                        prev_line = lines[j]
                        if re.search(rf'\b(interface|type|enum)\s+\w+', prev_line):
                            result.append(prev_line)
                    break
        
        if found:
            result.append(line)
            
            # Count braces
            for char in line:
                if char == '{':
                    brace_count += 1
                    in_def = True
                elif char == '}':
                    brace_count -= 1
            
            # Check if complete
            if in_def and brace_count == 0:
                break
            
            if ';' in line and not in_def and '=>' in line:
                break
    
    return '\n'.join(result) if result else None

def fix_export(error):
    """Fix a single export error."""
    name = error['name']
    file = error['file']
    
    print(f"\n🔍 Fixing: {name} in {file}")
    
    # Find in backup
    backup_file, backup_content = find_in_backup(name)
    
    if not backup_file:
        print(f"  ❌ Not found in backup")
        return False
    
    print(f"  ✓ Found in backup: {backup_file.name}")
    
    # Check if it's an index file that needs the export added
    target_path = SRC_DIR / file
    
    if not target_path.exists():
        print(f"  ❌ Target file doesn't exist")
        return False
    
    with open(target_path, 'r', encoding='utf-8') as f:
        current = f.read()
    
    # Check if already exported
    if f'export {{ {name}' in current or f'export * from' in current:
        print(f"  ℹ️  Already exported")
        return False
    
    # Determine source location
    # If it's an index.ts, find where the symbol should come from
    if target_path.name == 'index.ts':
        # Look for api/, lib/, ui/, model/ subdirectories
        parent_dir = target_path.parent
        
        for subdir in ['api', 'lib', 'ui', 'model', 'config']:
            subdir_path = parent_dir / subdir
            if subdir_path.exists():
                # Check if symbol exists in this subdir
                for ts_file in subdir_path.glob('*.ts'):
                    if ts_file.name == 'index.ts':
                        continue
                    
                    try:
                        with open(ts_file, 'r', encoding='utf-8') as f:
                            if name in f.read():
                                # Add export from this file
                                rel_path = f'./{subdir}/{ts_file.stem}'
                                export_line = f"\nexport {{ {name} }} from '{rel_path}';"
                                
                                with open(target_path, 'a', encoding='utf-8') as f:
                                    f.write(export_line)
                                
                                print(f"  ✅ Added export from {rel_path}")
                                return True
                    except:
                        continue
        
        # If not found in subdirs, try to create the file
        # Determine best location (api for functions, lib for utilities, config for constants)
        if name.isupper() or 'CONFIG' in name or 'DATE' in name:
            subdir = 'config'
        elif 'login' in name.lower() or 'signup' in name.lower() or 'auth' in name.lower():
            subdir = 'api'
        else:
            subdir = 'lib'
        
        subdir_path = parent_dir / subdir
        subdir_path.mkdir(exist_ok=True)
        
        # Extract definition from backup
        definition = extract_full_definition(backup_content, name)
        
        if definition:
            # Create new file
            new_file = subdir_path / f'{name.lower()}.ts'
            
            # Add necessary imports
            imports = []
            if 'supabase' in definition:
                imports.append("import { supabase } from '@/shared/api/supabaseClient';")
            
            full_content = '\n'.join(imports) + '\n\n' + definition + '\n'
            
            with open(new_file, 'w', encoding='utf-8') as f:
                f.write(full_content)
            
            # Add export to index
            rel_path = f'./{subdir}/{new_file.stem}'
            export_line = f"\nexport {{ {name} }} from '{rel_path}';"
            
            with open(target_path, 'a', encoding='utf-8') as f:
                f.write(export_line)
            
            print(f"  ✅ Created {new_file.name} and added export")
            return True
    
    return False

def main():
    print("🚀 Batch Fix All Export Errors")
    print("=" * 70)
    
    max_iterations = 10
    iteration = 0
    
    while iteration < max_iterations:
        iteration += 1
        print(f"\n{'='*70}")
        print(f"Iteration {iteration}/{max_iterations}")
        print(f"{'='*70}")
        
        # Run build
        output = run_build()
        
        # Parse errors
        errors = parse_errors(output)
        
        if not errors:
            print("\n✅ BUILD SUCCESSFUL! No more export errors!")
            return
        
        print(f"\n📋 Found {len(errors)} export errors")
        
        # Fix errors
        fixed = 0
        for error in errors[:5]:  # Fix first 5 per iteration
            if fix_export(error):
                fixed += 1
        
        if fixed == 0:
            print("\n⚠️  Could not fix any errors automatically")
            print("Remaining errors:")
            for error in errors[:10]:
                print(f"  - {error['name']} in {error['file']}")
            break
        
        print(f"\n✅ Fixed {fixed} exports in this iteration")
    
    print("\n" + "=" * 70)
    print("⚠️  Max iterations reached or no more auto-fixes available")

if __name__ == '__main__':
    main()
