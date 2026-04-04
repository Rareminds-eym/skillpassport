#!/usr/bin/env python3
"""
Move remaining feature-specific components from shared/ui/ to appropriate features
Task 7.2 continuation: Move FloatingAIButton, ActivityFeed, ChartDownloadButton
"""

import os
import shutil
import re
from pathlib import Path

def update_imports_in_file(filepath, component_name, old_import, new_import):
    """Update import statements in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern 1: import Component from '@/shared/ui/Component'
        pattern1 = rf"import\s+{component_name}\s+from\s+['\"]@/shared/ui/{component_name}['\"]"
        replacement1 = f"import {{ {component_name} }} from '{new_import}'"
        content = re.sub(pattern1, replacement1, content)
        
        # Pattern 2: import Component from '@/shared/ui'
        pattern2 = rf"import\s+{component_name}\s+from\s+['\"]@/shared/ui['\"]"
        replacement2 = f"import {{ {component_name} }} from '{new_import}'"
        content = re.sub(pattern2, replacement2, content)
        
        # Pattern 3: import { Component } from '@/shared/ui'
        pattern3 = rf"import\s+\{{\s*{component_name}\s*\}}\s+from\s+['\"]@/shared/ui['\"]"
        replacement3 = f"import {{ {component_name} }} from '{new_import}'"
        content = re.sub(pattern3, replacement3, content)
        
        # Pattern 4: import { Component } from '@/shared/ui/Component'
        pattern4 = rf"import\s+\{{\s*{component_name}\s*\}}\s+from\s+['\"]@/shared/ui/{component_name}['\"]"
        replacement4 = f"import {{ {component_name} }} from '{new_import}'"
        content = re.sub(pattern4, replacement4, content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error updating {filepath}: {e}")
        return False

def move_file(source, destination):
    """Move a file to a new location"""
    try:
        os.makedirs(os.path.dirname(destination), exist_ok=True)
        shutil.move(source, destination)
        return True
    except Exception as e:
        print(f"Error moving file: {e}")
        return False

def main():
    src_dir = Path('src')
    
    # Components to move
    components = [
        {
            'name': 'FloatingAIButton',
            'source': 'src/shared/ui/FloatingAIButton.tsx',
            'destination': 'src/features/career-assistant/ui/FloatingAIButton.tsx',
            'new_import': '@/features/career-assistant'
        },
        {
            'name': 'ActivityFeed',
            'source': 'src/shared/ui/ActivityFeed.tsx',
            'destination': 'src/features/recruiter/ui/ActivityFeed.tsx',
            'new_import': '@/features/recruiter'
        },
        {
            'name': 'ChartDownloadButton',
            'source': 'src/shared/ui/ChartDownloadButton.tsx',
            'destination': 'src/features/recruiter/ui/ChartDownloadButton.tsx',
            'new_import': '@/features/recruiter'
        },
    ]
    
    print("=" * 80)
    print("Task 7.2: Moving remaining feature-specific components from shared/ui/")
    print("=" * 80)
    
    total_updated = 0
    
    for comp in components:
        name = comp['name']
        source = comp['source']
        destination = comp['destination']
        new_import = comp['new_import']
        
        print(f"\n{name}:")
        print(f"  Source: {source}")
        print(f"  Destination: {destination}")
        print(f"  New import: {new_import}")
        
        # Check if source exists
        if not os.path.exists(source):
            print(f"  ✗ Source file not found")
            continue
        
        # Move the file
        if move_file(source, destination):
            print(f"  ✓ File moved successfully")
        else:
            print(f"  ✗ Failed to move file")
            continue
        
        # Update imports across codebase
        print(f"  Updating imports across codebase...")
        updated_files = []
        
        for filepath in src_dir.rglob('*'):
            if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx'] and filepath.is_file():
                # Skip node_modules, dist, migration backups
                if any(part in filepath.parts for part in ['node_modules', 'dist', '.migration-backups']):
                    continue
                
                if update_imports_in_file(filepath, name, source, new_import):
                    updated_files.append(str(filepath))
        
        if updated_files:
            print(f"  ✓ Updated {len(updated_files)} files")
            total_updated += len(updated_files)
        else:
            print(f"  ℹ No import updates needed")
    
    print("\n" + "=" * 80)
    print("Summary:")
    print("=" * 80)
    print(f"✓ Moved 3 feature-specific components")
    print(f"✓ Updated {total_updated} import statements")
    print("\nComponents moved:")
    print("  - FloatingAIButton → @/features/career-assistant")
    print("  - ActivityFeed → @/features/recruiter")
    print("  - ChartDownloadButton → @/features/recruiter")
    print("\nNext steps:")
    print("1. Update feature index files to export these components")
    print("2. Update shared/ui/index.ts to remove these exports")
    print("3. Run: npm run build:dev")
    print("=" * 80)

if __name__ == '__main__':
    main()
