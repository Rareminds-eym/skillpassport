#!/usr/bin/env python3
"""
Standardize FSD segment names across all features.
Renames non-standard segments to FSD-compliant names and updates all imports.
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Mapping of non-standard names to standard FSD segment names
SEGMENT_MAPPINGS = {
    'components': 'ui',
    'services': 'api',
    'utils': 'lib',
}

# Non-standard segments that need relocation
RELOCATE_TO_LIB = ['prompts', 'config', 'handlers']
RELOCATE_TYPES = ['types']

def find_non_standard_segments(features_dir: Path) -> Dict[str, List[Path]]:
    """Find all non-standard segment directories in features."""
    results = {
        'rename': [],  # (old_path, new_name)
        'relocate_to_lib': [],  # paths to move to lib/
        'relocate_types': [],  # types/ directories
    }
    
    for feature_dir in features_dir.iterdir():
        if not feature_dir.is_dir() or feature_dir.name.startswith('.'):
            continue
            
        # Check for segments to rename
        for old_name, new_name in SEGMENT_MAPPINGS.items():
            old_path = feature_dir / old_name
            if old_path.exists():
                results['rename'].append((old_path, new_name))
        
        # Check for segments to relocate to lib/
        for segment_name in RELOCATE_TO_LIB:
            segment_path = feature_dir / segment_name
            if segment_path.exists():
                results['relocate_to_lib'].append(segment_path)
        
        # Check for types/ directories
        types_path = feature_dir / 'types'
        if types_path.exists():
            results['relocate_types'].append(types_path)
    
    return results

def get_import_pattern(old_segment: str, feature_name: str) -> str:
    """Generate regex pattern for finding imports."""
    # Match both @/features/feature-name/segment and relative imports
    return rf"from\s+['\"]@/features/{re.escape(feature_name)}/{re.escape(old_segment)}"

def update_imports_in_file(filepath: Path, old_segment: str, new_segment: str, feature_name: str) -> bool:
    """Update import statements in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Update absolute imports
        pattern = rf"(@/features/{re.escape(feature_name)})/{re.escape(old_segment)}"
        replacement = rf"\1/{new_segment}"
        content = re.sub(pattern, replacement, content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    except Exception as e:
        print(f"Error updating {filepath}: {e}")
    
    return False

def update_all_imports(src_dir: Path, old_segment: str, new_segment: str, feature_name: str) -> int:
    """Update imports across all source files."""
    updated_count = 0
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx'] and filepath.is_file():
            if update_imports_in_file(filepath, old_segment, new_segment, feature_name):
                updated_count += 1
    
    return updated_count

def rename_segment(old_path: Path, new_name: str, src_dir: Path) -> bool:
    """Rename a segment directory and update all imports."""
    feature_name = old_path.parent.name
    old_name = old_path.name
    new_path = old_path.parent / new_name
    
    print(f"\n📁 Renaming {feature_name}/{old_name}/ to {new_name}/")
    
    # Check if target already exists
    if new_path.exists():
        print(f"  ⚠️  Target {new_path} already exists, skipping rename")
        return False
    
    # Rename the directory
    try:
        old_path.rename(new_path)
        print(f"  ✅ Renamed directory")
    except Exception as e:
        print(f"  ❌ Failed to rename: {e}")
        return False
    
    # Update imports
    updated = update_all_imports(src_dir, old_name, new_name, feature_name)
    print(f"  ✅ Updated {updated} import statements")
    
    return True

def move_to_lib(segment_path: Path, src_dir: Path) -> bool:
    """Move a non-standard segment into lib/ directory."""
    feature_dir = segment_path.parent
    feature_name = feature_dir.name
    segment_name = segment_path.name
    lib_dir = feature_dir / 'lib'
    
    print(f"\n📦 Moving {feature_name}/{segment_name}/ to lib/{segment_name}/")
    
    # Create lib/ if it doesn't exist
    lib_dir.mkdir(exist_ok=True)
    
    target_path = lib_dir / segment_name
    
    # Check if target already exists
    if target_path.exists():
        print(f"  ⚠️  Target {target_path} already exists, skipping move")
        return False
    
    # Move the directory
    try:
        segment_path.rename(target_path)
        print(f"  ✅ Moved directory")
    except Exception as e:
        print(f"  ❌ Failed to move: {e}")
        return False
    
    # Update imports
    updated = update_all_imports(src_dir, segment_name, f'lib/{segment_name}', feature_name)
    print(f"  ✅ Updated {updated} import statements")
    
    return True

def handle_types_directory(types_path: Path, src_dir: Path) -> bool:
    """Handle types/ directory - move to model/ or shared/types/."""
    feature_dir = types_path.parent
    feature_name = feature_dir.name
    model_dir = feature_dir / 'model'
    
    print(f"\n🔤 Processing {feature_name}/types/")
    
    # Check if this is a nested types/ (e.g., ui/types/)
    if types_path.parent.name in ['ui', 'api', 'model', 'lib']:
        print(f"  ℹ️  Nested types/ in {types_path.parent.name}/, moving to model/")
        target_dir = feature_dir / 'model'
    else:
        # Top-level types/ in feature
        target_dir = model_dir
    
    target_dir.mkdir(exist_ok=True)
    
    # Move all files from types/ to model/
    moved_files = 0
    try:
        for item in types_path.iterdir():
            target_path = target_dir / item.name
            if target_path.exists():
                print(f"  ⚠️  {item.name} already exists in target, skipping")
                continue
            item.rename(target_path)
            moved_files += 1
        
        # Remove empty types/ directory
        if not any(types_path.iterdir()):
            types_path.rmdir()
            print(f"  ✅ Moved {moved_files} files to model/")
        else:
            print(f"  ⚠️  types/ directory not empty after move")
            return False
    except Exception as e:
        print(f"  ❌ Failed to move types: {e}")
        return False
    
    # Update imports
    if types_path.parent.name in ['ui', 'api', 'model', 'lib']:
        old_import = f"{types_path.parent.name}/types"
        new_import = "model"
    else:
        old_import = "types"
        new_import = "model"
    
    updated = update_all_imports(src_dir, old_import, new_import, feature_name)
    print(f"  ✅ Updated {updated} import statements")
    
    return True

def main():
    """Main execution function."""
    src_dir = Path('src')
    features_dir = src_dir / 'features'
    
    if not features_dir.exists():
        print("❌ src/features directory not found")
        return
    
    print("🔍 Scanning for non-standard FSD segments...")
    segments = find_non_standard_segments(features_dir)
    
    total_renames = len(segments['rename'])
    total_relocations = len(segments['relocate_to_lib']) + len(segments['relocate_types'])
    
    print(f"\nFound:")
    print(f"  - {total_renames} segments to rename")
    print(f"  - {len(segments['relocate_to_lib'])} segments to relocate to lib/")
    print(f"  - {len(segments['relocate_types'])} types/ directories to handle")
    
    if total_renames == 0 and total_relocations == 0:
        print("\n✅ All segments already use standard FSD names!")
        return
    
    # Task 5.1, 5.2, 5.3: Rename components/ -> ui/, services/ -> api/, utils/ -> lib/
    print("\n" + "="*60)
    print("TASK 5.1-5.3: Renaming standard segments")
    print("="*60)
    
    renamed_count = 0
    for old_path, new_name in segments['rename']:
        if rename_segment(old_path, new_name, src_dir):
            renamed_count += 1
    
    # Task 5.4: Relocate types/ segments
    print("\n" + "="*60)
    print("TASK 5.4: Relocating types/ directories")
    print("="*60)
    
    types_count = 0
    for types_path in segments['relocate_types']:
        if handle_types_directory(types_path, src_dir):
            types_count += 1
    
    # Task 5.5: Relocate non-standard segments
    print("\n" + "="*60)
    print("TASK 5.5: Relocating non-standard segments to lib/")
    print("="*60)
    
    relocated_count = 0
    for segment_path in segments['relocate_to_lib']:
        if move_to_lib(segment_path, src_dir):
            relocated_count += 1
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✅ Renamed {renamed_count}/{total_renames} segments")
    print(f"✅ Relocated {types_count}/{len(segments['relocate_types'])} types/ directories")
    print(f"✅ Relocated {relocated_count}/{len(segments['relocate_to_lib'])} non-standard segments")
    print(f"\n🎉 Segment standardization complete!")
    print(f"\n⚠️  Next step: Run 'npm run build:dev' to verify all imports")

if __name__ == '__main__':
    main()
