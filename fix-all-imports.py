from pathlib import Path
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix course components - should be named exports
    content = re.sub(
        r"import CourseCard from '@/features/courses'",
        "import { CourseCard } from '@/features/courses'",
        content
    )
    content = re.sub(
        r"import CourseFilters from '@/features/courses'",
        "import { CourseFilters } from '@/features/courses'",
        content
    )
    content = re.sub(
        r"import CreateCourseModal from '@/features/courses'",
        "import { CreateCourseModal } from '@/features/courses'",
        content
    )
    content = re.sub(
        r"import CourseDetailDrawer from '@/features/courses'",
        "import { CourseDetailDrawer } from '@/features/courses'",
        content
    )
    
    # Fix shared UI components
    content = re.sub(
        r"import AssessmentReportDrawer from '@/shared/ui'",
        "import { AssessmentReportDrawer } from '@/shared/ui'",
        content
    )
    content = re.sub(
        r"import SearchBar from '@/shared/ui'",
        "import { SearchBar } from '@/shared/ui'",
        content
    )
    content = re.sub(
        r"import Footer from '@/shared/ui'",
        "import { Footer } from '@/shared/ui'",
        content
    )
    content = re.sub(
        r"import ConfirmModal from '@/shared/ui'",
        "import { ConfirmModal } from '@/shared/ui'",
        content
    )
    
    # Fix college-admin components
    content = re.sub(
        r"import ManageStudentsModal from '@/features/college-admin'",
        "import { ManageStudentsModal } from '@/features/college-admin'",
        content
    )
    content = re.sub(
        r"import AssignmentFileUpload from '@/features/college-admin'",
        "import { AssignmentFileUpload } from '@/features/college-admin'",
        content
    )
    content = re.sub(
        r"import StudentSelectionModal from '@/features/college-admin'",
        "import { StudentSelectionModal } from '@/features/college-admin'",
        content
    )
    content = re.sub(
        r"import SwapRequestModal from '@/features/college-admin'",
        "import { SwapRequestModal } from '@/features/college-admin'",
        content
    )
    content = re.sub(
        r"import SwapRequestCard from '@/features/college-admin'",
        "import { SwapRequestCard } from '@/features/college-admin'",
        content
    )
    content = re.sub(
        r"import GradingModal from '@/features/college-admin'",
        "import { GradingModal } from '@/features/college-admin'",
        content
    )
    content = re.sub(
        r"import MentorResponseModal from '@/features/college-admin'",
        "import { MentorResponseModal } from '@/features/college-admin'",
        content
    )
    content = re.sub(
        r"import AddStudentModal from '@/features/college-admin'",
        "import { AddStudentModal } from '@/features/college-admin'",
        content
    )
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path('src')
    fixed = 0
    files_fixed = []
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            if fix_file(filepath):
                fixed += 1
                files_fixed.append(str(filepath))
                print(f"Fixed: {filepath}")
    
    print(f"\n✅ Total files fixed: {fixed}")
    
if __name__ == '__main__':
    main()
