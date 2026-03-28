#!/usr/bin/env python3
"""
Fix circular import issues by finding original implementations in migration backups
and creating proper service files with actual implementations instead of re-exports.
"""

import os
import re
import json
from pathlib import Path

# Workspace root
WORKSPACE_ROOT = Path(__file__).parent.parent
BACKUP_DIR = WORKSPACE_ROOT / '.migration-backups' / 'backup-2026-03-21T08-40-21-393Z'
SRC_DIR = WORKSPACE_ROOT / 'src'

def find_function_in_backup(function_name, backup_dir):
    """Search for a function definition in backup files."""
    for root, dirs, files in os.walk(backup_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                filepath = Path(root) / file
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Look for function definition
                        patterns = [
                            rf'export\s+(const|function)\s+{function_name}\s*[=\(]',
                            rf'export\s+async\s+(const|function)\s+{function_name}\s*[=\(]',
                            rf'(const|function)\s+{function_name}\s*[=\(]',
                        ]
                        for pattern in patterns:
                            if re.search(pattern, content):
                                return filepath, content
                except Exception as e:
                    continue
    return None, None

def extract_function_code(content, function_name):
    """Extract the complete function code from file content."""
    # Find the function start
    patterns = [
        rf'(export\s+)?(const|function)\s+{function_name}\s*[=\(]',
        rf'(export\s+)?async\s+(const|function)\s+{function_name}\s*[=\(]',
    ]
    
    start_pos = -1
    for pattern in patterns:
        match = re.search(pattern, content)
        if match:
            start_pos = match.start()
            break
    
    if start_pos == -1:
        return None
    
    # Extract from start to the end of the function
    # This is a simple heuristic - find matching braces
    brace_count = 0
    in_function = False
    func_code = []
    lines = content[start_pos:].split('\n')
    
    for line in lines:
        func_code.append(line)
        
        # Count braces
        for char in line:
            if char == '{':
                brace_count += 1
                in_function = True
            elif char == '}':
                brace_count -= 1
        
        # If we've closed all braces and we were in a function, we're done
        if in_function and brace_count == 0:
            break
    
    return '\n'.join(func_code)

def extract_imports_from_function(func_code):
    """Extract any imports needed for the function."""
    # Look for common imports in the function
    imports = set()
    
    # Check for supabase usage
    if 'supabase' in func_code:
        imports.add("import { supabase } from '@/shared/api/supabaseClient';")
    
    return list(imports)

def fix_circular_import(service_file, function_name, backup_dir):
    """Fix a circular import by finding the original implementation."""
    print(f"\n🔍 Searching for {function_name} in backups...")
    
    backup_file, backup_content = find_function_in_backup(function_name, backup_dir)
    
    if not backup_file:
        print(f"  ❌ Could not find {function_name} in backups")
        return False
    
    print(f"  ✓ Found in {backup_file.relative_to(WORKSPACE_ROOT)}")
    
    # Extract the function code
    func_code = extract_function_code(backup_content, function_name)
    
    if not func_code:
        print(f"  ❌ Could not extract function code for {function_name}")
        return False
    
    # Get necessary imports
    imports = extract_imports_from_function(func_code)
    
    # Read current service file
    service_path = SRC_DIR / service_file
    
    if not service_path.exists():
        print(f"  ❌ Service file does not exist: {service_path}")
        return False
    
    with open(service_path, 'r', encoding='utf-8') as f:
        current_content = f.read()
    
    # Check if it's a circular re-export
    if f"from '@/features/" in current_content and 'export {' in current_content:
        print(f"  ⚠️  Detected circular re-export, replacing with actual implementation")
        
        # Build new content with imports and function
        new_content = '\n'.join(imports) + '\n\n' + func_code + '\n'
        
        with open(service_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"  ✅ Fixed {service_file}")
        return True
    else:
        print(f"  ℹ️  File doesn't have circular import pattern, skipping")
        return False

# Known circular imports to fix
CIRCULAR_IMPORTS = [
    {
        'service_file': 'features/auth/api/studentAuthService.ts',
        'function_name': 'loginStudent'
    },
]

def main():
    print("🔧 Fixing Circular Import Issues")
    print("=" * 60)
    
    fixed_count = 0
    
    for item in CIRCULAR_IMPORTS:
        if fix_circular_import(item['service_file'], item['function_name'], BACKUP_DIR):
            fixed_count += 1
    
    print("\n" + "=" * 60)
    print(f"✅ Fixed {fixed_count} circular imports")

if __name__ == '__main__':
    main()
