#!/usr/bin/env python3
"""
Validate that all features have minimum required segments (ui/ and model/)
"""

from pathlib import Path
import json

def validate_features():
    features_dir = Path('src/features')
    
    if not features_dir.exists():
        print("Error: src/features directory not found")
        return
    
    results = {
        'complete': [],
        'incomplete': [],
        'total': 0
    }
    
    # Get all feature directories
    feature_dirs = [d for d in features_dir.iterdir() if d.is_dir()]
    results['total'] = len(feature_dirs)
    
    print("=" * 80)
    print("FEATURE SEGMENT VALIDATION")
    print("=" * 80)
    print(f"\nValidating {results['total']} features...\n")
    
    for feature_dir in sorted(feature_dirs):
        feature_name = feature_dir.name
        
        # Check for required segments
        has_ui = (feature_dir / 'ui').exists()
        has_model = (feature_dir / 'model').exists()
        
        # Get all segments
        segments = [d.name for d in feature_dir.iterdir() if d.is_dir()]
        
        is_complete = has_ui and has_model
        
        feature_info = {
            'name': feature_name,
            'path': str(feature_dir),
            'has_ui': has_ui,
            'has_model': has_model,
            'segments': segments,
            'is_complete': is_complete
        }
        
        if is_complete:
            results['complete'].append(feature_info)
        else:
            results['incomplete'].append(feature_info)
            print(f"❌ {feature_name}")
            print(f"   Path: {feature_dir}")
            print(f"   Has ui/: {has_ui}")
            print(f"   Has model/: {has_model}")
            print(f"   Segments: {', '.join(segments) if segments else 'none'}")
            print()
    
    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total features: {results['total']}")
    print(f"Complete features (have ui/ and model/): {len(results['complete'])}")
    print(f"Incomplete features: {len(results['incomplete'])}")
    print()
    
    if results['incomplete']:
        print("INCOMPLETE FEATURES:")
        for feature in results['incomplete']:
            missing = []
            if not feature['has_ui']:
                missing.append('ui/')
            if not feature['has_model']:
                missing.append('model/')
            print(f"  - {feature['name']}: missing {', '.join(missing)}")
    else:
        print("✅ All features have minimum required segments!")
    
    print()
    
    # Save results to JSON
    output_file = Path('src/scripts/feature-validation-results.json')
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to: {output_file}")
    
    return results

if __name__ == '__main__':
    results = validate_features()
    
    # Exit with error code if there are incomplete features
    if results['incomplete']:
        exit(1)
    else:
        exit(0)
