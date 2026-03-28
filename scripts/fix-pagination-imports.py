#!/usr/bin/env python3
"""
Fix Pagination imports to use named imports instead of default imports
"""
import os
import re

# Files that need to be updated
files_to_update = [
    "src/pages/student/MyLearning.jsx",
    "src/pages/student/Opportunities.jsx",
    "src/pages/educator/DigitalPortfolioPage.tsx",
    "src/pages/educator/ProgramSectionsPage.tsx",
    "src/pages/educator/MyMentees.tsx",
    "src/pages/educator/ClassesPage.tsx",
    "src/pages/admin/collegeAdmin/Studentdataadmission.tsx",
    "src/pages/admin/universityAdmin/StudentEnrollments.tsx",
    "src/pages/admin/collegeAdmin/MentorAllocation.tsx",
    "src/pages/admin/collegeAdmin/EnrolledStudents.tsx",
    "src/pages/admin/collegeAdmin/DigitalPortfolio.tsx",
    "src/pages/admin/collegeAdmin/Departmentmanagement.tsx",
    "src/pages/admin/collegeAdmin/CourseMapping.tsx",
    "src/pages/admin/universityAdmin/CollegeRegistration.tsx",
    "src/pages/admin/collegeAdmin/Attendancetracking.tsx",
    "src/pages/admin/schoolAdmin/StudentAdmissions.tsx",
    "src/pages/admin/schoolAdmin/DigitalPortfolio.tsx",
    "src/pages/admin/schoolAdmin/ClassManagement.tsx",
    "src/pages/admin/schoolAdmin/AttendanceReports.tsx",
    "src/features/college-admin/ui/StudentSelectionModal.tsx",
    "src/features/college-admin/ui/CollegeCurriculumBuilderUI.tsx",
    "src/features/college-admin/ui/CollegeLessonPlanUI.tsx",
]

def fix_pagination_import(file_path):
    """Fix Pagination import from default to named import"""
    if not os.path.exists(file_path):
        print(f"⚠️  File not found: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: import Pagination from '@/shared/ui';
    content = re.sub(
        r"import Pagination from '@/shared/ui';",
        "import { Pagination } from '@/shared/ui';",
        content
    )
    
    # Pattern 2: import Pagination from '@/shared/ui'
    content = re.sub(
        r"import Pagination from '@/shared/ui'",
        "import { Pagination } from '@/shared/ui'",
        content
    )
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed: {file_path}")
        return True
    else:
        print(f"⏭️  No changes needed: {file_path}")
        return False

def main():
    print("🔧 Fixing Pagination imports to use named imports...\n")
    
    fixed_count = 0
    for file_path in files_to_update:
        if fix_pagination_import(file_path):
            fixed_count += 1
    
    print(f"\n✨ Fixed {fixed_count} files")

if __name__ == "__main__":
    main()
