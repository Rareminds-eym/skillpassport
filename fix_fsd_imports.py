import os
import re
from pathlib import Path

def fix_file(filepath):
    """Fix FSD violations in a single file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Fix usePermission and usePermissions imports
    # Pattern 1: import { usePermission } from '@/shared/lib/hooks'
    content = re.sub(
        r"import\s*{\s*usePermission\s*}\s*from\s*['\"]@/shared/lib/hooks['\"]",
        "import { usePermission } from '@/entities/user/model/usePermissions'",
        content
    )
    
    # Pattern 2: import { usePermissions } from '@/shared/lib/hooks'
    content = re.sub(
        r"import\s*{\s*usePermissions\s*}\s*from\s*['\"]@/shared/lib/hooks['\"]",
        "import { usePermissions } from '@/entities/user/model/usePermissions'",
        content
    )
    
    # Pattern 3: import { usePermission, usePermissions } from '@/shared/lib/hooks'
    content = re.sub(
        r"import\s*{\s*usePermission\s*,\s*usePermissions\s*}\s*from\s*['\"]@/shared/lib/hooks['\"]",
        "import { usePermission, usePermissions } from '@/entities/user/model/usePermissions'",
        content
    )
    content = re.sub(
        r"import\s*{\s*usePermissions\s*,\s*usePermission\s*}\s*from\s*['\"]@/shared/lib/hooks['\"]",
        "import { usePermissions, usePermission } from '@/entities/user/model/usePermissions'",
        content
    )
    
    # Fix useStudentRealtimeActivities imports
    content = re.sub(
        r"import\s*{\s*useStudentRealtimeActivities\s*}\s*from\s*['\"]@/shared/lib/hooks['\"]",
        "import { useStudentRealtimeActivities } from '@/entities/student/model/useStudentRealtimeActivities'",
        content
    )
    
    # Fix mixed imports - need to split them
    # Pattern: import { usePermission, otherHook } from '@/shared/lib/hooks'
    permission_pattern = r"import\s*{\s*([^}]*usePermission[^}]*)\s*}\s*from\s*['\"]@/shared/lib/hooks['\"]"
    matches = re.finditer(permission_pattern, content)
    
    for match in matches:
        imports_str = match.group(1)
        imports = [imp.strip() for imp in imports_str.split(',')]
        
        permission_imports = []
        other_imports = []
        
        for imp in imports:
            if 'usePermission' in imp:
                permission_imports.append(imp)
            else:
                other_imports.append(imp)
        
        if permission_imports and other_imports:
            # Split into two imports
            new_imports = f"import {{ {', '.join(permission_imports)} }} from '@/entities/user/model/usePermissions';\nimport {{ {', '.join(other_imports)} }} from '@/shared/lib/hooks'"
            content = content.replace(match.group(0), new_imports)
    
    # Similar for useStudentRealtimeActivities
    student_pattern = r"import\s*{\s*([^}]*useStudentRealtimeActivities[^}]*)\s*}\s*from\s*['\"]@/shared/lib/hooks['\"]"
    matches = re.finditer(student_pattern, content)
    
    for match in matches:
        imports_str = match.group(1)
        imports = [imp.strip() for imp in imports_str.split(',')]
        
        student_imports = []
        other_imports = []
        
        for imp in imports:
            if 'useStudentRealtimeActivities' in imp:
                student_imports.append(imp)
            else:
                other_imports.append(imp)
        
        if student_imports and other_imports:
            # Split into two imports
            new_imports = f"import {{ {', '.join(student_imports)} }} from '@/entities/student/model/useStudentRealtimeActivities';\nimport {{ {', '.join(other_imports)} }} from '@/shared/lib/hooks'"
            content = content.replace(match.group(0), new_imports)
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    
    return False

def main():
    src_dir = Path('src')
    fixed_files = []
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            try:
                if fix_file(filepath):
                    fixed_files.append(str(filepath))
            except Exception as e:
                print(f"Error processing {filepath}: {e}")
    
    print(f"Fixed {len(fixed_files)} files:")
    for f in fixed_files:
        print(f"  - {f}")

if __name__ == '__main__':
    main()
