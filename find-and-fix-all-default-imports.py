from pathlib import Path
import re

# Map of modules to their components that should be named exports
NAMED_EXPORT_PATTERNS = {
    '@/features/college-admin': [
        'ManageStudentsModal', 'AssignmentFileUpload', 'StudentSelectionModal',
        'SwapRequestModal', 'SwapRequestCard', 'GradingModal', 'MentorResponseModal',
        'AddStudentModal', 'ManageProgramStudentsModal', 'DeleteStudentModal',
        'EditStudentModal', 'BulkDeleteStudentsModal', 'EnrollStudentModal',
        'CreateCircularModal', 'CourseMappingModal', 'FacultyAssignmentModal',
        'HODAssignmentModal', 'InterventionModal', 'InterventionFeedbackModal',
        'MentorCapacityModal', 'MentorDetailsModal', 'MentorSelectionModal',
        'ReassignModal', 'AllocationConfigurationModal', 'AddDepartmentModal',
        'EditDepartmentModal', 'DepartmentDetailsDrawer', 'CollegeCurriculumBuilderUI',
        'CollegeLessonPlanUI', 'NewCollegeAdminConversationModal',
        'NewCollegeAdminEducatorConversationModal'
    ],
    '@/features/courses': [
        'CourseCard', 'CourseFilters', 'CreateCourseModal', 'CourseDetailDrawer',
        'CourseDetailModal', 'AddLessonModal', 'AssignEducatorModal',
        'ResourceUploadComponent', 'QuizProgressTracker', 'RestoreProgressModal',
        'SyncStatusIndicator', 'CoursePlayer'
    ],
    '@/shared/ui': [
        'AssessmentReportDrawer', 'SearchBar', 'Footer', 'ConfirmModal',
        'Loader', 'ScrollToTop', 'ProtectedRoute', 'ActivityFeed',
        'ImageUpload', 'DemoModal', 'FloatingAIButton', 'FloatingEducatorAIButton',
        'FloatingRecruiterAIButton', 'CareerAIToolsGrid', 'KPICard', 'KPIDashboard',
        'OTPInput', 'SEOHead', 'Modal', 'NotificationModal', 'ConfirmationModal',
        'ChartDownloadButton', 'ShinyButtonDemo', 'ShinyButtonExamples'
    ]
}

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix each module's components
    for module, components in NAMED_EXPORT_PATTERNS.items():
        for component in components:
            # Escape special regex characters in module path
            escaped_module = re.escape(module)
            
            # Pattern: import ComponentName from 'module'
            pattern = f"import {component} from '{module}'"
            replacement = f"import {{ {component} }} from '{module}'"
            content = content.replace(pattern, replacement)
            
            # Pattern: import ComponentName from "module"
            pattern = f'import {component} from "{module}"'
            replacement = f'import {{ {component} }} from "{module}"'
            content = content.replace(pattern, replacement)
    
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
