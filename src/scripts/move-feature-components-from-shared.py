#!/usr/bin/env python3
"""
Move feature-level components from shared/ui/ to appropriate features
Task 7.2: Move feature-level components to features
"""

import os
import re
from pathlib import Path

def update_imports_in_file(filepath, component_name, new_import_path):
    """Update import statements in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern 1: import KPICard from '@/shared/ui/KPICard'
        pattern1 = rf"import\s+{component_name}\s+from\s+['\"]@/shared/ui/{component_name}['\"]"
        replacement1 = f"import {{ {component_name} }} from '{new_import_path}'"
        content = re.sub(pattern1, replacement1, content)
        
        # Pattern 2: import KPICard from '@/shared/ui'
        pattern2 = rf"import\s+{component_name}\s+from\s+['\"]@/shared/ui['\"]"
        replacement2 = f"import {{ {component_name} }} from '{new_import_path}'"
        content = re.sub(pattern2, replacement2, content)
        
        # Pattern 3: import { KPICard } from '@/shared/ui'
        pattern3 = rf"import\s+\{{\s*{component_name}\s*\}}\s+from\s+['\"]@/shared/ui['\"]"
        replacement3 = f"import {{ {component_name} }} from '{new_import_path}'"
        content = re.sub(pattern3, replacement3, content)
        
        # Pattern 4: import { KPICard } from '@/shared/ui/KPICard'
        pattern4 = rf"import\s+\{{\s*{component_name}\s*\}}\s+from\s+['\"]@/shared/ui/{component_name}['\"]"
        replacement4 = f"import {{ {component_name} }} from '{new_import_path}'"
        content = re.sub(pattern4, replacement4, content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error updating {filepath}: {e}")
        return False

def main():
    src_dir = Path('src')
    
    # Components to update
    components = [
        {
            'name': 'KPICard',
            'new_import': '@/features/analytics',
            'deprecated_file': 'src/shared/ui/KPICard.tsx'
        },
        {
            'name': 'KPIDashboard',
            'new_import': '@/widgets/kpi-dashboard',
            'deprecated_file': 'src/shared/ui/KPIDashboard.tsx'
        },
    ]
    
    print("=" * 80)
    print("Task 7.2: Moving feature-level components from shared/ui/ to features")
    print("=" * 80)
    
    total_updated = 0
    
    # Process each component
    for comp in components:
        name = comp['name']
        new_import = comp['new_import']
        deprecated_file = comp['deprecated_file']
        
        print(f"\n{name}:")
        print(f"  Deprecated file: {deprecated_file}")
        print(f"  New import path: {new_import}")
        
        # Find and update all imports
        print(f"  Updating imports across codebase...")
        updated_files = []
        
        for filepath in src_dir.rglob('*'):
            if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx'] and filepath.is_file():
                # Skip the deprecated file itself
                if str(filepath) == deprecated_file:
                    continue
                
                # Skip node_modules, dist, migration backups
                if any(part in filepath.parts for part in ['node_modules', 'dist', '.migration-backups']):
                    continue
                
                if update_imports_in_file(filepath, name, new_import):
                    updated_files.append(str(filepath))
        
        if updated_files:
            print(f"  ✓ Updated {len(updated_files)} files:")
            for f in updated_files[:10]:  # Show first 10
                print(f"    - {f}")
            if len(updated_files) > 10:
                print(f"    ... and {len(updated_files) - 10} more")
            total_updated += len(updated_files)
        else:
            print(f"  ℹ No import updates needed")
    
    print("\n" + "=" * 80)
    print("Summary:")
    print("=" * 80)
    print(f"✓ Updated {total_updated} files total")
    print("✓ KPICard imports now use @/features/analytics")
    print("✓ KPIDashboard imports now use @/widgets/kpi-dashboard")
    print("\nNext steps:")
    print("1. Run: npm run build:dev")
    print("2. If build succeeds, remove deprecated files:")
    print("   - src/shared/ui/KPICard.tsx")
    print("   - src/shared/ui/KPIDashboard.tsx")
    print("=" * 80)

if __name__ == '__main__':
    main()
