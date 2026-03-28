#!/usr/bin/env python3

"""
Script to fix remaining import errors
"""

import os
import re
from pathlib import Path

# Specific file fixes
FILE_SPECIFIC_FIXES = {
    # Exam workflow files - UIExam is in features/exams
    'src/shared/ui/exams/workflow/ExamCreationStep.tsx': [
        (r"from '@/entities/exam'", "from '@/features/exams'"),
    ],
    'src/shared/ui/exams/workflow/InvigilationStep.tsx': [
        (r"from '@/entities/exam'", "from '@/features/exams'"),
    ],
    'src/shared/ui/exams/workflow/MarksEntryStep.tsx': [
        (r"from '@/entities/exam'", "from '@/features/exams'"),
    ],
    'src/shared/ui/exams/workflow/ModerationStep.tsx': [
        (r"from '@/entities/exam'", "from '@/features/exams'"),
    ],
    'src/shared/ui/exams/workflow/PublishingStep.tsx': [
        (r"from '@/features/exams'", "from '@/features/exams'"),
    ],
    'src/shared/ui/exams/workflow/ResultsStep.tsx': [
        (r"from '@/entities/exam'", "from '@/features/exams'"),
    ],
    'src/shared/ui/exams/workflow/TimetableStep.tsx': [
        (r"from '@/entities/exam'", "from '@/features/exams'"),
    ],
    
    # StudentProfileDrawer - fix weird path
    'src/shared/ui/StudentProfileDrawer/hooks/useStudentActions.ts': [
        (r"from '\.\./\@/shared/api/supabaseClient'", "from '@/shared/api/supabaseClient'"),
    ],
    'src/shared/ui/StudentProfileDrawer/hooks/useStudentData.ts': [
        (r"from '\.\./\@/shared/api/supabaseClient'", "from '@/shared/api/supabaseClient'"),
    ],
    'src/shared/ui/StudentProfileDrawer/modals/AdmissionNoteModal.tsx': [
        (r"from '\.\./\@/shared/api/supabaseClient'", "from '@/shared/api/supabaseClient'"),
    ],
    'src/shared/ui/StudentProfileDrawer/modals/MessageModal.tsx': [
        (r"from '\.\./\@/shared/api/supabaseClient'", "from '@/shared/api/supabaseClient'"),
    ],
    'src/shared/ui/StudentProfileDrawer/modals/SchoolAdmissionNoteModal.tsx': [
        (r"from '\.\./\@/shared/api/supabaseClient'", "from '@/shared/api/supabaseClient'"),
    ],
    'src/shared/ui/StudentProfileDrawer/tabs/ClubsCompetitionsTab.tsx': [
        (r"from '\.\./\@/shared/api/supabaseClient'", "from '@/shared/api/supabaseClient'"),
    ],
    'src/shared/ui/StudentProfileDrawer/tabs/EventsTab.tsx': [
        (r"from '\.\./\@/shared/api/supabaseClient'", "from '@/shared/api/supabaseClient'"),
    ],
    'src/shared/ui/StudentProfileDrawer/tabs/ExamResultsTab.tsx': [
        (r"from '\.\./\@/shared/api/supabaseClient'", "from '@/shared/api/supabaseClient'"),
    ],
    'src/shared/ui/StudentProfileDrawer/tabs/OverviewTab.tsx': [
        (r"from '\.\./\@/shared/api/supabaseClient'", "from '@/shared/api/supabaseClient'"),
    ],
    
    # Student types
    'src/features/digital-passport/ui/portfolio/layouts/AIPersonaLayout.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    'src/features/digital-passport/ui/portfolio/layouts/CompactResumeDashboard.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    'src/features/digital-passport/ui/portfolio/layouts/CreativeLayout.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    'src/features/digital-passport/ui/portfolio/layouts/InfographicDashboard.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    'src/features/digital-passport/ui/portfolio/layouts/ModernLayout.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    'src/features/digital-passport/ui/portfolio/layouts/SplitScreenLayout.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    'src/features/digital-portfolio/ui/portfolio/layouts/AIPersonaLayout.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    'src/features/digital-portfolio/ui/portfolio/layouts/CompactResumeDashboard.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    'src/features/digital-portfolio/ui/portfolio/layouts/CreativeLayout.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    'src/features/digital-portfolio/ui/portfolio/layouts/InfographicDashboard.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    'src/features/digital-portfolio/ui/portfolio/layouts/ModernLayout.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    'src/features/digital-portfolio/ui/portfolio/layouts/SplitScreenLayout.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/student'", "from '@/shared/types/student'"),
    ],
    
    # Project types
    'src/features/recruiter-pipeline/ui/ProjectAtoms.tsx': [
        (r"from '\.\./\.\./\.\./\.\./types/project'", "from '@/shared/types/project'"),
    ],
    
    # Data assessment types
    'src/data/assessment/courses.ts': [
        (r"from '\.\./types'", "from '@/shared/types'"),
    ],
    'src/data/assessment/questions/csevbm.ts': [
        (r"from '\.\./\.\./types'", "from '@/shared/types'"),
    ],
    'src/data/assessment/questions/ev-battery.ts': [
        (r"from '\.\./\.\./types'", "from '@/shared/types'"),
    ],
    'src/data/assessment/questions/food-analysis.ts': [
        (r"from '\.\./\.\./types'", "from '@/shared/types'"),
    ],
    'src/data/assessment/questions/green-chemistry.ts': [
        (r"from '\.\./\.\./types'", "from '@/shared/types'"),
    ],
    'src/data/assessment/questions/organic-food.ts': [
        (r"from '\.\./\.\./types'", "from '@/shared/types'"),
    ],
    'src/data/assessment/quizQuestions.ts': [
        (r"from '\.\./types'", "from '@/shared/types'"),
    ],
    'src/data/assessment/testQuestions.ts': [
        (r"from '\.\./types'", "from '@/shared/types'"),
    ],
    
    # Relative path in feature
    'src/features/student-dashboard/api/streakApiService.ts': [
        (r"from '\.\./shared/api/supabaseClient'", "from '@/shared/api/supabaseClient'"),
    ],
    
    # AuthContext.jsx -> AuthContext
    'src/pages/educator/AdminCommunication.tsx': [
        (r"from '\.\./\.\./context/AuthContext\.jsx'", "from '@/features/auth'"),
    ],
}

def fix_file(file_path, root_dir):
    """Fix imports in a single file"""
    try:
        relative_path = str(file_path.relative_to(root_dir)).replace('\\', '/')
        
        if relative_path not in FILE_SPECIFIC_FIXES:
            return False
        
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        # Apply specific fixes for this file
        for pattern, replacement in FILE_SPECIFIC_FIXES[relative_path]:
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
    
    print('Fixing remaining import errors...\n')
    
    fixed_count = 0
    
    for file_path_str in FILE_SPECIFIC_FIXES.keys():
        file_path = root_dir / file_path_str
        if file_path.exists():
            if fix_file(file_path, root_dir):
                fixed_count += 1
                print(f'Fixed: {file_path_str}')
    
    print(f'\nFixed {fixed_count} file(s)')

if __name__ == '__main__':
    main()
