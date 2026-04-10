#!/usr/bin/env python3
"""
Merge services/ directories into existing api/ directories.
"""

import os
import re
from pathlib import Path
from typing import List

def update_imports_in_file(filepath: Path, feature_name: str) -> bool:
    """Update import statements from services/ to api/."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Update absolute imports from services to api
        pattern = rf"(@/features/{re.escape(feature_name)})/services"
        replacement = rf"\1/api"
        content = re.sub(pattern, replacement, content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    except Exception as e:
        print(f"Error updating {filepath}: {e}")
    
    return False

def merge_services_to_api(feature_dir: Path, src_dir: Path) -> bool:
    """Merge services/ directory into api/ directory."""
    feature_name = feature_dir.name
    services_dir = feature_dir / 'services'
    api_dir = feature_dir / 'api'
    
    if not services_dir.exists():
        return False
    
    if not api_dir.exists():
        print(f"  ⚠️  api/ doesn't exist, this shouldn't happen")
        return False
    
    print(f"\n📦 Merging {feature_name}/services/ into api/")
    
    # Move all files from services/ to api/
    moved_files = 0
    conflicts = []
    
    for item in services_dir.rglob('*'):
        if item.is_file():
            relative_path = item.relative_to(services_dir)
            target_path = api_dir / relative_path
            
            # Create parent directories if needed
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            if target_path.exists():
                conflicts.append(str(relative_path))
                print(f"  ⚠️  Conflict: {relative_path} already exists in api/")
            else:
                try:
                    item.rename(target_path)
                    moved_files += 1
                except Exception as e:
                    print(f"  ❌ Failed to move {relative_path}: {e}")
    
    print(f"  ✅ Moved {moved_files} files to api/")
    
    if conflicts:
        print(f"  ⚠️  {len(conflicts)} conflicts - manual merge needed")
        return False
    
    # Remove empty services/ directory
    try:
        # Remove empty subdirectories first
        for dirpath in sorted(services_dir.rglob('*'), reverse=True):
            if dirpath.is_dir() and not any(dirpath.iterdir()):
                dirpath.rmdir()
        
        # Remove services/ itself if empty
        if not any(services_dir.iterdir()):
            services_dir.rmdir()
            print(f"  ✅ Removed empty services/ directory")
    except Exception as e:
        print(f"  ⚠️  Could not remove services/ directory: {e}")
    
    # Update imports across codebase
    updated_count = 0
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx'] and filepath.is_file():
            if update_imports_in_file(filepath, feature_name):
                updated_count += 1
    
    print(f"  ✅ Updated {updated_count} import statements")
    
    return True

def main():
    """Main execution function."""
    src_dir = Path('src')
    features_dir = src_dir / 'features'
    
    features_with_both = [
        'educator-copilot',
        'recruiter-copilot',
        'university-ai'
    ]
    
    print("🔍 Merging services/ directories into api/...")
    
    merged_count = 0
    for feature_name in features_with_both:
        feature_dir = features_dir / feature_name
        if feature_dir.exists():
            if merge_services_to_api(feature_dir, src_dir):
                merged_count += 1
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✅ Merged {merged_count}/{len(features_with_both)} services/ directories")
    print(f"\n🎉 Services merge complete!")

if __name__ == '__main__':
    main()
