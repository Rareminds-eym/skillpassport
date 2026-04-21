#!/usr/bin/env python3
"""
Script to fix FSD violations by updating hook imports from shared to features
"""
import re
from pathlib import Path

# Mapping of hooks to their correct feature paths
HOOK_MAPPINGS = {
    'useAdaptiveAptitude': '@/features/assessment/model/useAdaptiveAptitude',
    'useAddOnCatalog': '@/features/subscription/model/useAddOnCatalog',
    'useUsageStatistics': '@/features/analytics/model/useUsageStatistics',
    'useLessonPlans': '@/features/educator-copilot/model/useLessonPlans',
    'useMentorAllocation': '@/features/college-admin',
    'useProgramSections': '@/features/college-admin',
    'useOffers': '@/features/recruiter/model/useOffers',
    'useSessionRestore': '@/features/courses/model/useSessionRestore',
    'useOfflineSync': '@/features/courses/model/useOfflineSync',
    'useProfileCompletionPrompt': '@/features/student-profile',
    'useRealtimeActivities': '@/features/analytics/model/useRealtimeActivities',
    'useTutorChat': '@/features/ai-tutor/model/useTutorChat',
    'useVideoSummarizer': '@/features/ai-tutor/model/useVideoSummarizer',
    'useCurriculum': '@/features/educator-copilot/model/useLessonPlans',
    'useSubjectsAndClasses': '@/features/educator-copilot/model/useLessonPlans',
}

# Types that need to be imported from features
TYPE_MAPPINGS = {
    'Offer': '@/features/recruiter/model/useOffers',
    'OfferStats': '@/features/recruiter/model/useOffers',
    'OfferFilters': '@/features/recruiter/model/useOffers',
    'OfferSortOptions': '@/features/recruiter/model/useOffers',
}

def fix_file(filepath):
    """Fix imports in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = []
        
        # Find all imports from @/shared/lib/hooks
        import_pattern = r"import\s+(?:type\s+)?{([^}]+)}\s+from\s+['\"]@/shared/lib/hooks['\"]"
        matches = list(re.finditer(import_pattern, content))
        
        if not matches:
            return False, []
        
        # Process each import statement
        for match in reversed(matches):  # Reverse to maintain positions
            imports_str = match.group(1)
            imports = [imp.strip() for imp in imports_str.split(',')]
            
            # Separate hooks that need to stay vs move
            hooks_to_move = {}
            hooks_to_keep = []
            types_to_move = {}
            
            for imp in imports:
                # Handle type imports
                if imp.startswith('type '):
                    type_name = imp.replace('type ', '').strip()
                    if type_name in TYPE_MAPPINGS:
                        target_path = TYPE_MAPPINGS[type_name]
                        if target_path not in types_to_move:
                            types_to_move[target_path] = []
                        types_to_move[target_path].append(type_name)
                    else:
                        hooks_to_keep.append(imp)
                # Handle regular imports
                elif imp in HOOK_MAPPINGS:
                    target_path = HOOK_MAPPINGS[imp]
                    if target_path not in hooks_to_move:
                        hooks_to_move[target_path] = []
                    hooks_to_move[target_path].append(imp)
                else:
                    hooks_to_keep.append(imp)
            
            # Build replacement
            new_imports = []
            
            # Keep shared hooks import if any remain
            if hooks_to_keep:
                new_imports.append(f"import {{ {', '.join(hooks_to_keep)} }} from '@/shared/lib/hooks'")
            
            # Add new feature imports
            for path, hooks in hooks_to_move.items():
                new_imports.append(f"import {{ {', '.join(hooks)} }} from '{path}'")
            
            # Add type imports
            for path, types in types_to_move.items():
                type_imports = ', '.join([f'type {t}' for t in types])
                new_imports.append(f"import {{ {type_imports} }} from '{path}'")
            
            # Replace in content
            replacement = ';\n'.join(new_imports)
            content = content[:match.start()] + replacement + content[match.end():]
            
            for path, hooks in hooks_to_move.items():
                for hook in hooks:
                    changes_made.append(f"{hook} -> {path}")
            for path, types in types_to_move.items():
                for type_name in types:
                    changes_made.append(f"type {type_name} -> {path}")
        
        # Only write if changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, changes_made
        
        return False, []
    
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False, []

def main():
    """Main function to process all files"""
    src_dir = Path('src')
    fixed_count = 0
    total_changes = []
    
    # Find all TypeScript and JavaScript files
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            was_fixed, changes = fix_file(filepath)
            if was_fixed:
                fixed_count += 1
                print(f"✅ Fixed: {filepath}")
                for change in changes:
                    print(f"   - {change}")
                total_changes.extend(changes)
    
    print(f"\n{'='*60}")
    print(f"✅ Fixed {fixed_count} files")
    print(f"📝 Total changes: {len(total_changes)}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
