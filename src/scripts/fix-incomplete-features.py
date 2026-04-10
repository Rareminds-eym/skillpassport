#!/usr/bin/env python3
"""
Fix incomplete features by creating missing ui/ and model/ segments
"""

from pathlib import Path
import shutil

def rename_components_to_ui(feature_path):
    """Rename components/ directory to ui/"""
    components_dir = feature_path / 'components'
    ui_dir = feature_path / 'ui'
    
    if components_dir.exists() and not ui_dir.exists():
        print(f"  Renaming {components_dir} to {ui_dir}")
        shutil.move(str(components_dir), str(ui_dir))
        return True
    return False

def create_model_from_types(feature_path):
    """Create model/ directory and move types/ into it if types/ exists"""
    types_dir = feature_path / 'types'
    model_dir = feature_path / 'model'
    
    if types_dir.exists() and not model_dir.exists():
        print(f"  Creating {model_dir} and moving types/ into it")
        model_dir.mkdir(exist_ok=True)
        
        # Move types files to model/
        for file in types_dir.iterdir():
            if file.is_file():
                dest = model_dir / file.name
                print(f"    Moving {file} to {dest}")
                shutil.move(str(file), str(dest))
        
        # Remove empty types directory
        if not any(types_dir.iterdir()):
            types_dir.rmdir()
            print(f"    Removed empty {types_dir}")
        
        return True
    return False

def create_empty_model(feature_path):
    """Create an empty model/ directory with index.ts"""
    model_dir = feature_path / 'model'
    
    if not model_dir.exists():
        print(f"  Creating {model_dir}")
        model_dir.mkdir(exist_ok=True)
        
        # Create index.ts
        index_file = model_dir / 'index.ts'
        index_file.write_text("// Model exports\n")
        print(f"    Created {index_file}")
        return True
    return False

def create_empty_ui(feature_path):
    """Create an empty ui/ directory with index.ts"""
    ui_dir = feature_path / 'ui'
    
    if not ui_dir.exists():
        print(f"  Creating {ui_dir}")
        ui_dir.mkdir(exist_ok=True)
        
        # Create index.ts
        index_file = ui_dir / 'index.ts'
        index_file.write_text("// UI exports\n")
        print(f"    Created {index_file}")
        return True
    return False

def fix_features():
    """Fix all incomplete features"""
    
    incomplete_features = {
        'broadcast': {'missing': ['ui']},
        'career-assistant': {'missing': ['ui'], 'has_components': True},
        'educator-copilot': {'missing': ['ui', 'model'], 'has_components': True, 'has_types': True},
        'library': {'missing': ['ui', 'model']},
        'marketing': {'missing': ['model']},
        'notifications': {'missing': ['ui']},
        'onboarding': {'missing': ['model']},
        'promotional': {'missing': ['ui']},
        'recruiter-copilot': {'missing': ['ui', 'model'], 'has_components': True, 'has_types': True},
        'recruiter-pipeline': {'missing': ['model']},
        'university-ai': {'missing': ['ui', 'model'], 'has_components': True, 'has_types': True}
    }
    
    features_dir = Path('src/features')
    
    print("=" * 80)
    print("FIXING INCOMPLETE FEATURES")
    print("=" * 80)
    print()
    
    for feature_name, info in incomplete_features.items():
        feature_path = features_dir / feature_name
        
        if not feature_path.exists():
            print(f"⚠️  {feature_name}: Directory not found, skipping")
            continue
        
        print(f"📦 {feature_name}")
        print(f"   Path: {feature_path}")
        print(f"   Missing: {', '.join(info['missing'])}")
        
        changes_made = False
        
        # Step 1: Rename components/ to ui/ if needed
        if info.get('has_components') and 'ui' in info['missing']:
            if rename_components_to_ui(feature_path):
                changes_made = True
                info['missing'].remove('ui')
        
        # Step 2: Create model/ from types/ if needed
        if info.get('has_types') and 'model' in info['missing']:
            if create_model_from_types(feature_path):
                changes_made = True
                info['missing'].remove('model')
        
        # Step 3: Create missing ui/ if still needed
        if 'ui' in info['missing']:
            if create_empty_ui(feature_path):
                changes_made = True
        
        # Step 4: Create missing model/ if still needed
        if 'model' in info['missing']:
            if create_empty_model(feature_path):
                changes_made = True
        
        if changes_made:
            print(f"   ✅ Fixed")
        else:
            print(f"   ℹ️  No changes needed")
        
        print()
    
    print("=" * 80)
    print("COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    fix_features()
