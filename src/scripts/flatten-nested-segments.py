#!/usr/bin/env python3
"""
Flatten nested non-standard directories within FSD segments.
E.g., ui/components/ -> ui/, ui/types/ -> model/
"""

import os
import re
from pathlib import Path
from typing import List

def flatten_ui_components(ui_dir: Path) -> bool:
    """Flatten ui/components/ directory by moving contents up to ui/."""
    components_dir = ui_dir / 'components'
    
    if not components_dir.exists():
        return False
    
    feature_name = ui_dir.parent.name
    print(f"\n📁 Flattening {feature_name}/ui/components/")
    
    moved_files = 0
    conflicts = []
    
    for item in components_dir.iterdir():
        target_path = ui_dir / item.name
        
        if target_path.exists():
            conflicts.append(item.name)
            print(f"  ⚠️  Conflict: {item.name} already exists in ui/")
        else:
            try:
                item.rename(target_path)
                moved_files += 1
            except Exception as e:
                print(f"  ❌ Failed to move {item.name}: {e}")
    
    print(f"  ✅ Moved {moved_files} items to ui/")
    
    if conflicts:
        print(f"  ⚠️  {len(conflicts)} conflicts - manual merge needed")
        return False
    
    # Remove empty components/ directory
    try:
        if not any(components_dir.iterdir()):
            components_dir.rmdir()
            print(f"  ✅ Removed empty components/ directory")
    except Exception as e:
        print(f"  ⚠️  Could not remove components/ directory: {e}")
    
    return True

def move_ui_types_to_model(ui_dir: Path) -> bool:
    """Move ui/types/ to feature model/ directory."""
    types_dir = ui_dir / 'types'
    
    if not types_dir.exists():
        return False
    
    feature_dir = ui_dir.parent
    feature_name = feature_dir.name
    model_dir = feature_dir / 'model'
    
    print(f"\n🔤 Moving {feature_name}/ui/types/ to model/")
    
    # Create model/ if it doesn't exist
    model_dir.mkdir(exist_ok=True)
    
    moved_files = 0
    conflicts = []
    
    for item in types_dir.iterdir():
        target_path = model_dir / item.name
        
        if target_path.exists():
            conflicts.append(item.name)
            print(f"  ⚠️  Conflict: {item.name} already exists in model/")
        else:
            try:
                item.rename(target_path)
                moved_files += 1
            except Exception as e:
                print(f"  ❌ Failed to move {item.name}: {e}")
    
    print(f"  ✅ Moved {moved_files} files to model/")
    
    if conflicts:
        print(f"  ⚠️  {len(conflicts)} conflicts - manual merge needed")
        return False
    
    # Remove empty types/ directory
    try:
        if not any(types_dir.iterdir()):
            types_dir.rmdir()
            print(f"  ✅ Removed empty types/ directory")
    except Exception as e:
        print(f"  ⚠️  Could not remove types/ directory: {e}")
    
    return True

def main():
    """Main execution function."""
    src_dir = Path('src')
    features_dir = src_dir / 'features'
    
    print("🔍 Scanning for nested non-standard directories...")
    
    flattened_count = 0
    types_moved_count = 0
    
    for feature_dir in features_dir.iterdir():
        if not feature_dir.is_dir() or feature_dir.name.startswith('.'):
            continue
        
        ui_dir = feature_dir / 'ui'
        if ui_dir.exists():
            # Flatten ui/components/
            if flatten_ui_components(ui_dir):
                flattened_count += 1
            
            # Move ui/types/ to model/
            if move_ui_types_to_model(ui_dir):
                types_moved_count += 1
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✅ Flattened {flattened_count} ui/components/ directories")
    print(f"✅ Moved {types_moved_count} ui/types/ directories to model/")
    print(f"\n🎉 Nested directory cleanup complete!")

if __name__ == '__main__':
    main()
