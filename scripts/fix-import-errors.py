#!/usr/bin/env python3

"""
Script to automatically fix import errors in the codebase
"""

import os
import re
from pathlib import Path

# Import replacements mapping
IMPORT_REPLACEMENTS = [
    # Context imports -> FSD structure
    (r"from ['\"]\.\.\/\.\.\/context\/AuthContext['\"]", "from '@/features/auth'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/context\/AuthContext['\"]", "from '@/features/auth'"),
    (r"from ['\"]\.\.\/context\/AuthContext\.jsx['\"]", "from '@/features/auth'"),
    (r"from ['\"]\.\.\/\.\.\/context\/GlobalPresenceContext['\"]", "from '@/stores'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/context\/GlobalPresenceContext['\"]", "from '@/stores'"),
    (r"from ['\"]@/context\/GlobalPresenceContext['\"]", "from '@/stores'"),
    
    # Stores imports
    (r"from ['\"]@/stores\/globalPresenceStore\.js['\"]", "from '@/stores'"),
    
    # Services imports
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/services\/messageService['\"]", "from '@/shared/api/messageService'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/services\/messageService['\"]", "from '@/shared/api/messageService'"),
    
    # Supabase client imports
    (r"from ['\"]\.\./\.\./@/shared/api/supabaseClient['\"]", "from '@/shared/api/supabaseClient'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/supabaseClient['\"]", "from '@/shared/api/supabaseClient'"),
    
    # Utils imports
    (r"from ['\"]\.\.\/\.\.\/lib\/utils['\"]", "from '@/shared/lib/utils'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils['\"]", "from '@/shared/lib/utils'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/utils\/helpers['\"]", "from '@/shared/lib/helpers'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/utils\/api['\"]", "from '@/shared/api/supabaseClient'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/utils\/fileValidation['\"]", "from '@/shared/lib/fileValidation'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/utils\/employabilityCalculator['\"]", "from '@/shared/lib/employabilityCalculator'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/utils\/settingsErrorHandler['\"]", "from '@/shared/lib/settingsErrorHandler'"),
    
    # Config imports
    (r"from ['\"]\.\.\/\.\.\/\.\.\/config\/logging['\"]", "from '@/shared/config/logging'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/config\/fileSizeLimits['\"]", "from '@/shared/config/fileSizeLimits'"),
    
    # Hooks imports
    (r"from ['\"]\.\.\/\.\.\/\.\.\/hooks\/useExams['\"]", "from '@/entities/exam'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\/useStudentSettings['\"]", "from '@/entities/student'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\/useStudentDataByEmail['\"]", "from '@/entities/student'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\/useStudentCertificates['\"]", "from '@/entities/student'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\/useStudentProjects['\"]", "from '@/entities/student'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\/useStudentExperience['\"]", "from '@/entities/student'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\/useStudentEducation['\"]", "from '@/entities/student'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\/useStudentSkills['\"]", "from '@/entities/student'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\/useInstitutions['\"]", "from '@/entities/institution'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\/useStudentMessageNotifications['\"]", "from '@/features/messaging'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/hooks\/useStudentData['\"]", "from '@/entities/student'"),
    (r"from ['\"]\.\.\/\.\.\/\.\.\/hooks\/useStudentDataById['\"]", "from '@/entities/student'"),
    
    # Widget UI component imports (relative to absolute)
    (r"from ['\"]\.\/ui\/(card|button|badge|progress|tabs|dialog|input|label|textarea|alert-dialog|autocomplete)['\"]", 
     r"from '@/shared/ui/\1'"),
    (r"from ['\"]\.\.\/ui\/(card|button|badge|progress|tabs|dialog|input|label|textarea|alert-dialog|autocomplete)['\"]", 
     r"from '@/shared/ui/\1'"),
    (r"from ['\"]\.\.\/\.\.\/ui\/(card|button|badge|progress|tabs|dialog|input|label|textarea|alert-dialog|autocomplete)['\"]", 
     r"from '@/shared/ui/\1'"),
]

# Named import replacements (for specific hooks)
NAMED_IMPORT_REPLACEMENTS = [
    (r"import \{ useAuth \}", "import { useAuth }"),  # Keep as is, just verify path
]

def fix_file(file_path):
    """Fix imports in a single file"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        # Apply all replacements
        for pattern, replacement in IMPORT_REPLACEMENTS:
            content = re.sub(pattern, replacement, content)
        
        # Only write if changed
        if content != original_content:
            file_path.write_text(content, encoding='utf-8')
            return True
        return False
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")
        return False

def main():
    root_dir = Path.cwd()
    src_dir = root_dir / 'src'
    
    if not src_dir.exists():
        print("Error: 'src' directory not found")
        return
    
    print('🔧 Fixing import errors...\n')
    
    fixed_count = 0
    skip_dirs = {'node_modules', '.git', 'dist', 'build', '.next', '.migration-backups', '__tests__', 'test'}
    source_extensions = {'.ts', '.tsx', '.js', '.jsx'}
    
    for root, dirs, files in os.walk(src_dir):
        # Skip certain directories
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for file in files:
            file_path = Path(root) / file
            
            # Check only source files
            if file_path.suffix in source_extensions:
                if fix_file(file_path):
                    fixed_count += 1
                    print(f'✓ Fixed: {file_path.relative_to(root_dir)}')
    
    print(f'\n✅ Fixed {fixed_count} file(s)')

if __name__ == '__main__':
    main()
