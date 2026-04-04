#!/usr/bin/env python3
"""
Fix imports for role-specific components that were moved from shared/ui to features.
Task 7.1 of FSD Violations Cleanup
"""

import os
import re
from pathlib import Path

# Define import replacements
IMPORT_REPLACEMENTS = [
    # ClassManagementModals - moved to college-admin
    {
        'old': r"import\s*\{\s*([^}]*AssignEducatorModal[^}]*),\s*([^}]*ManageStudentsModal[^}]*)\s*\}\s*from\s*['\"]@/shared/ui/admin/modals/ClassManagementModals['\"]",
        'new': r"import { \1, \2 } from '@/features/college-admin'",
    },
    # DocumentViewerModal - moved to school-admin
    {
        'old': r"import\s+DocumentViewerModal\s+from\s+['\"]@/shared/ui/admin/modals/DocumentViewerModal['\"]",
        'new': "import { DocumentViewerModal } from '@/features/school-admin'",
    },
    # FacultyDocumentViewerModal - moved to college-admin
    {
        'old': r"import\s+FacultyDocumentViewerModal\s+from\s+['\"]@/shared/ui/admin/modals/FacultyDocumentViewerModal['\"]",
        'new': "import { FacultyDocumentViewerModal } from '@/features/college-admin'",
    },
    # FeeStructureModal - moved to university-admin
    {
        'old': r"import\s+FeeStructureModal\s+from\s+['\"]@/shared/ui/admin/universityAdmin/FeeStructureModal['\"]",
        'new': "import { FeeStructureModal } from '@/features/university-admin'",
    },
    # ResultsAnalytics - moved to university-admin
    {
        'old': r"import\s+ResultsAnalytics\s+from\s+['\"]@/shared/ui/admin/universityAdmin/ResultsAnalytics['\"]",
        'new': "import { ResultsAnalytics } from '@/features/university-admin'",
    },
    # ResultsComponents - moved to university-admin
    {
        'old': r"import\s*\{([^}]+)\}\s*from\s*['\"]@/shared/ui/admin/universityAdmin/ResultsComponents['\"]",
        'new': r"import {\1} from '@/features/university-admin'",
    },
    # Exam components - moved to exams feature
    {
        'old': r"import\s+StatsCard\s+from\s+['\"]@/shared/ui/exams/StatsCard['\"]",
        'new': "import { StatsCard } from '@/features/exams'",
    },
    {
        'old': r"import\s+TypeBadge\s+from\s+['\"]@/shared/ui/exams/TypeBadge['\"]",
        'new': "import { TypeBadge } from '@/features/exams'",
    },
    {
        'old': r"import\s+ModalWrapper\s+from\s+['\"]@/shared/ui/exams/ModalWrapper['\"]",
        'new': "import { ModalWrapper } from '@/features/exams'",
    },
    {
        'old': r"import\s+ExamCard\s+from\s+['\"]@/shared/ui/exams/ExamCard['\"]",
        'new': "import { ExamCard } from '@/features/exams'",
    },
    {
        'old': r"import\s+CreateExamForm\s+from\s+['\"]@/shared/ui/exams/CreateExamForm['\"]",
        'new': "import { CreateExamForm } from '@/features/exams'",
    },
    {
        'old': r"import\s+ExamWorkflowManager\s+from\s+['\"]@/shared/ui/exams/ExamWorkflowManager['\"]",
        'new': "import { ExamWorkflowManager } from '@/features/exams'",
    },
    {
        'old': r"import\s+PerformanceTrends\s+from\s+['\"]@/shared/ui/exams/PerformanceTrends['\"]",
        'new': "import { PerformanceTrends } from '@/features/exams'",
    },
    {
        'old': r"import\s*\{\s*EXAM_STATUSES\s*\}\s*from\s*['\"]@/shared/ui/exams/types['\"]",
        'new': "import { EXAM_STATUSES } from '@/features/exams'",
    },
    # FloatingEducatorAIButton - moved to educator
    {
        'old': r"import\s+FloatingEducatorAIButton\s+from\s+['\"]@/shared/ui/FloatingEducatorAIButton['\"]",
        'new': "import { FloatingEducatorAIButton } from '@/features/educator'",
    },
    # FloatingRecruiterAIButton - moved to recruiter-pipeline
    {
        'old': r"import\s+FloatingRecruiterAIButton\s+from\s+['\"]@/shared/ui/FloatingRecruiterAIButton['\"]",
        'new': "import { FloatingRecruiterAIButton } from '@/features/recruiter-pipeline'",
    },
    # AssessmentReportDrawer - moved to assessment
    {
        'old': r"import\s+AssessmentReportDrawer\s+from\s+['\"]@/shared/ui/AssessmentReportDrawer['\"]",
        'new': "import { AssessmentReportDrawer } from '@/features/assessment'",
    },
]

def fix_imports_in_file(filepath):
    """Fix imports in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all replacements
        for replacement in IMPORT_REPLACEMENTS:
            content = re.sub(replacement['old'], replacement['new'], content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"⚠️  Error fixing {filepath}: {e}")
        return False

def main():
    print("=" * 60)
    print("Fixing imports for moved role-specific components")
    print("=" * 60)
    print()
    
    src_dir = Path('src')
    fixed_files = []
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            if fix_imports_in_file(filepath):
                fixed_files.append(str(filepath))
                print(f"✅ Fixed: {filepath}")
    
    print(f"\n" + "=" * 60)
    print(f"✅ SUMMARY")
    print(f"=" * 60)
    print(f"Files fixed: {len(fixed_files)}")
    
    if fixed_files:
        print(f"\nFixed files:")
        for f in fixed_files:
            print(f"  - {f}")

if __name__ == '__main__':
    main()
