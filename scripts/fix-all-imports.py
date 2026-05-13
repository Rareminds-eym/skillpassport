#!/usr/bin/env python3
"""
Script to fix all imports/exports after duplicate file cleanup.
"""

import os
import re
from pathlib import Path

# Map of old import paths to new import paths
IMPORT_REPLACEMENTS = [
    # Messaging modals - moved to modals subdirectory
    (r"from ['\"](.*)features/messaging/ui/MessageModal['\"]", r"from '\1features/messaging/ui/modals/MessageModal'"),
    (r"from ['\"](.*)features/messaging/ui/DeleteConversationModal['\"]", r"from '\1features/messaging/ui/modals/DeleteConversationModal'"),
    (r"from ['\"](.*)features/messaging/ui/NewAdminConversationModal['\"]", r"from '\1features/messaging/ui/modals/NewAdminConversationModal'"),
    (r"from ['\"](.*)features/messaging/ui/NewEducatorConversationModal['\"]", r"from '\1features/messaging/ui/modals/NewEducatorConversationModal'"),
    (r"from ['\"](.*)features/messaging/ui/NewCollegeEducatorAdminConversationModal['\"]", r"from '\1features/messaging/ui/modals/NewCollegeEducatorAdminConversationModal'"),
    (r"from ['\"](.*)features/messaging/ui/NewLearnerConversationModalEducator['\"]", r"from '\1features/messaging/ui/modals/NewLearnerConversationModalEducator'"),
    (r"from ['\"](.*)features/messaging/ui/NewLearnerConversationModal['\"]", r"from '\1features/messaging/ui/modals/NewLearnerConversationModal'"),
    (r"from ['\"](.*)features/messaging/ui/NewLearnerConversationModalCollegeAdmin['\"]", r"from '\1features/messaging/ui/modals/NewLearnerConversationModalCollegeAdmin'"),
    (r"from ['\"](.*)features/messaging/ui/NewEducatorAdminConversationModal['\"]", r"from '\1features/messaging/ui/modals/NewEducatorAdminConversationModal'"),
    (r"from ['\"](.*)features/messaging/ui/NewSchoolAdminEducatorConversationModal['\"]", r"from '\1features/messaging/ui/modals/NewSchoolAdminEducatorConversationModal'"),
    (r"from ['\"](.*)features/messaging/ui/NewCollegeAdminEducatorConversationModal['\"]", r"from '\1features/messaging/ui/modals/NewCollegeAdminEducatorConversationModal'"),
    (r"from ['\"](.*)features/messaging/ui/NewCollegeAdminConversationModal['\"]", r"from '\1features/messaging/ui/modals/NewCollegeAdminConversationModal'"),
    (r"from ['\"](.*)features/messaging/ui/NewCollegeLecturerConversationModal['\"]", r"from '\1features/messaging/ui/modals/NewCollegeLecturerConversationModal'"),
    
    # learner profile - moved to features/learner-profile
    (r"from ['\"](.*)entities/learner/ui/learnerProfileDrawer/tabs/AcademicTab['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/tabs/AcademicTab'"),
    (r"from ['\"](.*)entities/learner/ui/learnerProfileDrawer/tabs/ClubsCompetitionsTab['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/tabs/ClubsCompetitionsTab'"),
    (r"from ['\"](.*)entities/learner/ui/learnerProfileDrawer/tabs/ExamResultsTab['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/tabs/ExamResultsTab'"),
    (r"from ['\"](.*)entities/learner/ui/learnerProfileDrawer/tabs/DocumentsTab['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/tabs/DocumentsTab'"),
    (r"from ['\"](.*)entities/learner/ui/learnerProfileDrawer/tabs/NotesTab['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/tabs/NotesTab'"),
    (r"from ['\"](.*)entities/learner/ui/tabs/EventsTab['\"]", r"from '\1features/learner-profile/ui/tabs/EventsTab'"),
    (r"from ['\"](.*)entities/learner/ui/learnerProfileDrawer/hooks['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/hooks'"),
    (r"from ['\"](.*)entities/learner/ui/learnerProfileDrawer/types['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/types'"),
    (r"from ['\"](.*)entities/learner/ui/learnerProfileDrawer/components/LessonSection['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/components/LessonSection'"),
    
    # learner profile modals
    (r"from ['\"](.*)features/learner-profile/ui/modals/AdmissionNoteModal['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/modals/AdmissionNoteModal'"),
    (r"from ['\"](.*)features/learner-profile/ui/modals/DocumentsModal['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/modals/DocumentsModal'"),
    (r"from ['\"](.*)features/learner-profile/ui/modals/GraduationModal['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/modals/GraduationModal'"),
    (r"from ['\"](.*)features/learner-profile/ui/modals/MessageModal['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/modals/MessageModal'"),
    (r"from ['\"](.*)features/learner-profile/ui/modals/SchoolAdmissionNoteModal['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/modals/SchoolAdmissionNoteModal'"),
    (r"from ['\"](.*)features/learner-profile/ui/modals/ApprovalModal['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/modals/ApprovalModal'"),
    (r"from ['\"](.*)features/learner-profile/ui/modals/PromotionModal['\"]", r"from '\1features/learner-profile/ui/learnerProfileDrawer/modals/PromotionModal'"),
    
    # Educator components moved to college-admin
    (r"from ['\"](.*)features/educator/ui/ManageLearnersModal['\"]", r"from '\1features/college-admin/ui/modals/ManageLearnersModal'"),
    (r"from ['\"](.*)features/educator/ui/modals/BulkDeleteLearnersModal['\"]", r"from '\1features/college-admin/ui/modals/BulkDeleteLearnersModal'"),
    (r"from ['\"](.*)features/educator/ui/modals/EditLearnerModal['\"]", r"from '\1features/college-admin/ui/modals/EditLearnerModal'"),
    (r"from ['\"](.*)features/educator/ui/modals/DeleteLearnerModal['\"]", r"from '\1features/college-admin/ui/modals/DeleteLearnerModal'"),
    (r"from ['\"](.*)features/educator/ui/ManageProgramLearnersModal['\"]", r"from '\1features/college-admin/ui/modals/ManageProgramLearnersModal'"),
    (r"from ['\"](.*)features/educator/ui/MentorResponseModal['\"]", r"from '\1features/college-admin/ui/modals/MentorResponseModal'"),
    (r"from ['\"](.*)features/educator/ui/teacher/SwapRequestCard['\"]", r"from '\1features/college-admin/ui/SwapRequestCard'"),
    (r"from ['\"](.*)features/educator/ui/teacher/SwapRequestModal['\"]", r"from '\1features/college-admin/ui/modals/SwapRequestModal'"),
    (r"from ['\"](.*)features/educator/ui/AssignEducatorModal['\"]", r"from '\1features/courses/ui/AssignEducatorModal'"),
    (r"from ['\"](.*)features/educator/ui/FloatingEducatorAIButton['\"]", r"from '\1shared/ui/FloatingEducatorAIButton'"),
    (r"from ['\"](.*)features/educator/ui/modals/DiversityExportModal['\"]", r"from '\1features/recruiter-pipeline/ui/modals/DiversityExportModal'"),
    (r"from ['\"](.*)features/educator/api/dashboardApi['\"]", r"from '\1features/educator-copilot/api/dashboardApi'"),
    
    # College admin components moved from pages
    (r"from ['\"](.*)pages/admin/collegeAdmin/components/ModerationPanel['\"]", r"from '\1features/college-admin/ui/components/ModerationPanel'"),
    (r"from ['\"](.*)pages/admin/collegeAdmin/components/TimetableScheduler['\"]", r"from '\1features/college-admin/ui/components/TimetableScheduler'"),
    (r"from ['\"](.*)pages/admin/collegeAdmin/components/MarkEntryGrid['\"]", r"from '\1features/college-admin/ui/components/MarkEntryGrid'"),
    (r"from ['\"](.*)pages/admin/collegeAdmin/components/Timetable/components/modals/BreakModal['\"]", r"from '\1features/college-admin/ui/components/Timetable/components/modals/BreakModal'"),
    
    # Recruiter components moved to recruiter-pipeline
    (r"from ['\"](.*)features/recruiter/ui/AdvancedCharts['\"]", r"from '\1features/recruiter-pipeline/ui/AdvancedCharts'"),
    (r"from ['\"](.*)features/recruiter/ui/DateRangePicker['\"]", r"from '\1features/recruiter-pipeline/ui/DateRangePicker'"),
    (r"from ['\"](.*)features/recruiter/ui/PipelineStats['\"]", r"from '\1features/recruiter-pipeline/ui/PipelineStats'"),
    (r"from ['\"](.*)features/recruiter/ui/CandidateQuickView['\"]", r"from '\1features/recruiter-pipeline/ui/CandidateQuickView'"),
    (r"from ['\"](.*)features/recruiter/ui/filters/AdvancedRequisitionFilters['\"]", r"from '\1features/recruiter-pipeline/ui/AdvancedRequisitionFilters'"),
    (r"from ['\"](.*)features/recruiter/ui/AnalyticsComponents['\"]", r"from '\1features/recruiter-pipeline/ui/AnalyticsComponents'"),
    (r"from ['\"](.*)features/recruiter/ui/PipelineSortMenu['\"]", r"from '\1features/recruiter-pipeline/ui/PipelineSortMenu'"),
    (r"from ['\"](.*)features/recruiter/ui/modals/DiversityExportModal['\"]", r"from '\1features/recruiter-pipeline/ui/modals/DiversityExportModal'"),
    (r"from ['\"](.*)features/recruiter-pipeline/ui/FloatingRecruiterAIButton['\"]", r"from '\1shared/ui/FloatingRecruiterAIButton'"),
    
    # Marketing components moved to shared
    (r"from ['\"](.*)features/marketing/ui/skillpassport/HeroSection['\"]", r"from '\1shared/ui/marketing/HeroSection'"),
    (r"from ['\"](.*)features/marketing/ui/skillpassport/EarlyAccessSection['\"]", r"from '\1shared/ui/marketing/EarlyAccessSection'"),
    (r"from ['\"](.*)features/marketing/ui/skillpassport/NeedHelpSection['\"]", r"from '\1shared/ui/marketing/NeedHelpSection'"),
    (r"from ['\"](.*)features/marketing/ui/skillpassport/WhatYouGetSection['\"]", r"from '\1shared/ui/marketing/WhatYouGetSection'"),
    (r"from ['\"](.*)features/marketing/ui/skillpassport/WhatIsSection['\"]", r"from '\1shared/ui/marketing/WhatIsSection'"),
    (r"from ['\"](.*)features/marketing/ui/skillpassport/WhoIsThisForSection['\"]", r"from '\1shared/ui/marketing/WhoIsThisForSection'"),
    (r"from ['\"](.*)features/marketing/ui/skillpassport/AboutRaremindsSection['\"]", r"from '\1shared/ui/marketing/AboutRaremindsSection'"),
    
    # Shared UI components
    (r"from ['\"](.*)features/college-admin/ui/events/components/ConfirmModal['\"]", r"from '\1shared/ui/ConfirmModal'"),
    
    # Type definitions moved to shared/types
    (r"from ['\"](.*)features/courses/model/course-types['\"]", r"from '\1shared/types/educator/course'"),
    (r"from ['\"](.*)features/placement/model/project-types['\"]", r"from '\1shared/types/project'"),
    (r"from ['\"](.*)features/college-admin/model/college-types['\"]", r"from '\1shared/types/college'"),
    (r"from ['\"](.*)features/college-admin/model/class-swap-types['\"]", r"from '\1shared/types/classSwap'"),
    (r"from ['\"](.*)features/assessment/model/adaptive-aptitude-types['\"]", r"from '\1shared/types/adaptiveAptitude'"),
    (r"from ['\"](.*)entities/recruiter/model/types['\"]", r"from '\1shared/types/recruiter'"),
    
    # API services moved to features
    (r"from ['\"](.*)entities/learner/api/learnerActivityService['\"]", r"from '\1features/learner-profile/api/learnerActivityService'"),
    (r"from ['\"](.*)entities/learner/api/learnerExamService['\"]", r"from '\1features/exams/api/learnerExamService'"),
    (r"from ['\"](.*)entities/learner/api/learnerClassService['\"]", r"from '\1features/learner-profile/api/learnerClassService'"),
    (r"from ['\"](.*)features/myclass/api/learnerClassService['\"]", r"from '\1features/learner-profile/api/learnerClassService'"),
    (r"from ['\"](.*)features/digital-portfolio/api/learnerDocumentService['\"]", r"from '\1features/learner-profile/api/learnerDocumentService'"),
    (r"from ['\"](.*)features/opportunities/api/pipelineService['\"]", r"from '\1features/recruiter-pipeline/api/pipelineService'"),
    
    # Functions library moved to src
    (r"from ['\"](.*)functions/lib/response['\"]", r"from '\1functions-lib/response'"),
    (r"from ['\"](.*)functions/lib/types['\"]", r"from '\1functions-lib/types'"),
    (r"from ['\"](.*)functions/lib/supabase['\"]", r"from '\1functions-lib/supabase'"),
    
    # Subscription UI moved to base
    (r"from ['\"](.*)features/subscription/ui/individual/SubscriptionDetails['\"]", r"from '\1features/subscription/ui/SubscriptionDetails'"),
    (r"from ['\"](.*)features/subscription/ui/individual/AddOnCard['\"]", r"from '\1features/subscription/ui/AddOnCard'"),
    (r"from ['\"](.*)features/subscription/ui/individual/ReceiptCard['\"]", r"from '\1features/subscription/ui/ReceiptCard'"),
    (r"from ['\"](.*)features/subscription/ui/individual/TransactionList['\"]", r"from '\1features/subscription/ui/TransactionList'"),
    (r"from ['\"](.*)features/subscription/ui/individual/TransactionGrid['\"]", r"from '\1features/subscription/ui/TransactionGrid'"),
    
    # Courses - TypeScript versions
    (r"from ['\"](.*)features/courses/lib/recommendations/embeddingBatch['\"]", r"from '\1features/courses/api/embeddingBatch'"),
    (r"from ['\"](.*)features/courses/lib/recommendations/config['\"]", r"from '\1features/courses/api/config'"),
    (r"from ['\"](.*)features/courses/lib/recommendations/embeddingService['\"]", r"from '\1features/courses/api/embeddingService'"),
    (r"from ['\"](.*)features/courses/lib/recommendations/fieldDomainService['\"]", r"from '\1features/courses/api/fieldDomainService'"),
    (r"from ['\"](.*)entities/learner/ui/courses/RestoreProgressModal['\"]", r"from '\1features/courses/ui/RestoreProgressModal'"),
    (r"from ['\"](.*)entities/learner/ui/courses/CourseDetailModal['\"]", r"from '\1features/courses/ui/CourseDetailModal'"),
    (r"from ['\"](.*)features/admin/ui/modals/CourseDetailModal['\"]", r"from '\1features/courses/ui/CourseDetailModal'"),
    
    # Widgets
    (r"from ['\"](.*)features/learner-profile/ui/AchievementsExpanded['\"]", r"from '\1widgets/learner-dashboard/ui/AchievementsExpanded'"),
    (r"from ['\"](.*)features/learner-profile/ui/SkillTrackerExpanded['\"]", r"from '\1widgets/learner-dashboard/ui/SkillTrackerExpanded'"),
    (r"from ['\"](.*)features/learner-profile/ui/Generateresumepdf['\"]", r"from '\1widgets/learner-dashboard/ui/Generateresumepdf'"),
    
    # Shared lib
    (r"from ['\"](.*)shared/lib/cn['\"]", r"from '\1shared/lib/utils/cn'"),
    (r"from ['\"](.*)features/assessment/lib/employabilityCalculator['\"]", r"from '\1shared/lib/employabilityCalculator'"),
    
    # Config
    (r"from ['\"](.*)functions/api/storage/config/fileSizeLimits['\"]", r"from '\1shared/config/fileSizeLimits'"),
    
    # Subscription lib - TypeScript versions
    (r"from ['\"](.*)features/subscription/lib/pdfReceiptGenerator['\"]", r"from '\1features/subscription/api/pdfReceiptGenerator'"),
    (r"from ['\"](.*)features/subscription/model/usePaymentVerification['\"]", r"from '\1features/subscription/lib/usePaymentVerification'"),
    
    # School admin
    (r"from ['\"](.*)features/admin/ui/modals/DocumentViewerModal['\"]", r"from '\1features/school-admin/ui/modals/DocumentViewerModal'"),
]

def fix_imports_in_file(filepath):
    """Fix imports in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = []
        
        for pattern, replacement in IMPORT_REPLACEMENTS:
            matches = re.findall(pattern, content)
            if matches:
                content = re.sub(pattern, replacement, content)
                changes_made.append(f"  - {pattern[:50]}...")
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, changes_made
        
        return False, []
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False, []

def main():
    src_dir = Path('src')
    functions_dir = Path('functions')
    
    fixed_files = []
    total_changes = 0
    
    # Process src directory
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx'] and filepath.is_file():
            changed, changes = fix_imports_in_file(filepath)
            if changed:
                fixed_files.append(str(filepath))
                total_changes += len(changes)
                print(f"\n✓ Fixed: {filepath}")
                for change in changes[:3]:  # Show first 3 changes
                    print(change)
    
    # Process functions directory if it exists
    if functions_dir.exists():
        for filepath in functions_dir.rglob('*'):
            if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx'] and filepath.is_file():
                changed, changes = fix_imports_in_file(filepath)
                if changed:
                    fixed_files.append(str(filepath))
                    total_changes += len(changes)
                    print(f"\n✓ Fixed: {filepath}")
                    for change in changes[:3]:
                        print(change)
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Files fixed: {len(fixed_files)}")
    print(f"  Total import changes: {total_changes}")
    print(f"{'='*60}")
    
    if fixed_files:
        print("\nFixed files:")
        for f in fixed_files[:20]:  # Show first 20
            print(f"  - {f}")
        if len(fixed_files) > 20:
            print(f"  ... and {len(fixed_files) - 20} more")

if __name__ == "__main__":
    main()
