#!/usr/bin/env python3
"""
Fix exam-related imports in shared/ui/exams to use local types
"""

import re
from pathlib import Path

# Constants that should be imported from local types
EXAM_CONSTANTS = [
    'MODERATION_TYPES',
    'EXAM_STATUSES',
    'mapDatabaseStatus',
    'WorkflowStage',
    'ExamStatus'
]

def fix_imports_in_file(filepath: Path, exams_dir: Path) -> bool:
    """Fix import statements in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Determine relative path to types.ts
        if filepath.parent == exams_dir:
            types_path = './types'
        else:
            # In workflow subdirectory
            types_path = '../types'
        
        # Find imports from student-profile/model that include exam constants
        pattern = r"import\s+\{([^}]+)\}\s+from\s+['\"]@/features/student-profile/model['\"];"
        
        def replace_import(match):
            imports = match.group(1)
            import_list = [i.strip() for i in imports.split(',')]
            
            # Separate exam constants from other imports
            exam_imports = []
            other_imports = []
            
            for imp in import_list:
                if any(const in imp for const in EXAM_CONSTANTS):
                    exam_imports.append(imp)
                else:
                    other_imports.append(imp)
            
            # Build replacement
            result = []
            if other_imports:
                result.append(f"import {{ {', '.join(other_imports)} }} from '@/features/student-profile/model';")
            if exam_imports:
                result.append(f"import {{ {', '.join(exam_imports)} }} from '{types_path}';")
            
            return '\n'.join(result) if result else match.group(0)
        
        content = re.sub(pattern, replace_import, content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    except Exception as e:
        print(f"Error updating {filepath}: {e}")
    
    return False

def main():
    """Main execution function."""
    exams_dir = Path('src/shared/ui/exams')
    
    print("🔍 Fixing exam imports in shared/ui/exams...")
    
    updated_count = 0
    for filepath in exams_dir.rglob('*.tsx'):
        if filepath.is_file():
            if fix_imports_in_file(filepath, exams_dir):
                updated_count += 1
                print(f"  ✅ Updated {filepath}")
    
    print(f"\n✅ Updated {updated_count} files")

if __name__ == '__main__':
    main()
