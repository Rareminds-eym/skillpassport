#!/usr/bin/env python3
"""
Script to fix duplicate files in the codebase.
Based on FSD architecture, we keep files in their proper locations and remove duplicates.
"""

import os
import shutil
from pathlib import Path

# Define duplicate sets and which file to keep (first in list is kept, rest are deleted)
DUPLICATES = [
    # Messaging modals - keep in modals subdirectory
    ["src/features/messaging/ui/modals/MessageModal.tsx", "src/features/messaging/ui/MessageModal.tsx"],
    ["src/features/messaging/ui/modals/DeleteConversationModal.tsx", "src/features/messaging/ui/DeleteConversationModal.tsx"],
    ["src/features/messaging/ui/modals/NewAdminConversationModal.jsx", "src/features/messaging/ui/NewAdminConversationModal.jsx"],
    ["src/features/messaging/ui/modals/NewEducatorConversationModal.jsx", "src/features/messaging/ui/NewEducatorConversationModal.jsx"],
    ["src/features/messaging/ui/modals/NewCollegeEducatorAdminConversationModal.jsx", "src/features/messaging/ui/NewCollegeEducatorAdminConversationModal.jsx"],
    ["src/features/messaging/ui/modals/NewStudentConversationModalEducator.jsx", "src/features/messaging/ui/NewStudentConversationModalEducator.jsx"],
    ["src/features/messaging/ui/modals/NewStudentConversationModal.jsx", "src/features/messaging/ui/NewStudentConversationModal.jsx"],
    ["src/features/messaging/ui/modals/NewStudentConversationModalCollegeAdmin.jsx", "src/features/messaging/ui/NewStudentConversationModalCollegeAdmin.jsx"],
    ["src/features/messaging/ui/modals/NewEducatorAdminConversationModal.jsx", "src/features/messaging/ui/NewEducatorAdminConversationModal.jsx"],
    ["src/features/messaging/ui/modals/NewSchoolAdminEducatorConversationModal.jsx", "src/features/messaging/ui/NewSchoolAdminEducatorConversationModal.jsx"],
    ["src/features/messaging/ui/modals/NewCollegeAdminEducatorConversationModal.jsx", "src/features/messaging/ui/NewCollegeAdminEducatorConversationModal.jsx", "src/features/college-admin/ui/NewCollegeAdminEducatorConversationModal.jsx"],
    ["src/features/messaging/ui/modals/NewCollegeAdminConversationModal.jsx", "src/features/messaging/ui/NewCollegeAdminConversationModal.jsx", "src/features/college-admin/ui/NewCollegeAdminConversationModal.jsx"],
    
    # Student profile - keep in features/student-profile
    ["src/features/student-profile/ui/StudentProfileDrawer/tabs/AcademicTab.tsx", "src/entities/student/ui/StudentProfileDrawer/tabs/AcademicTab.tsx", "src/features/student-profile/ui/tabs/AcademicTab.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/tabs/ClubsCompetitionsTab.tsx", "src/entities/student/ui/StudentProfileDrawer/tabs/ClubsCompetitionsTab.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/tabs/ExamResultsTab.tsx", "src/entities/student/ui/StudentProfileDrawer/tabs/ExamResultsTab.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/tabs/DocumentsTab.tsx", "src/entities/student/ui/StudentProfileDrawer/tabs/DocumentsTab.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/tabs/NotesTab.tsx", "src/entities/student/ui/StudentProfileDrawer/tabs/NotesTab.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/tabs/AssessmentsTab.tsx", "src/features/student-profile/ui/tabs/AssessmentsTab.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/hooks/index.ts", "src/entities/student/ui/StudentProfileDrawer/hooks/index.ts"],
    ["src/features/student-profile/ui/StudentProfileDrawer/types/index.ts", "src/entities/student/ui/StudentProfileDrawer/types/index.ts"],
    ["src/features/student-profile/ui/StudentProfileDrawer/components/LessonSection.tsx", "src/entities/student/ui/StudentProfileDrawer/components/LessonSection.tsx"],
    ["src/features/student-profile/ui/tabs/EventsTab.tsx", "src/entities/student/ui/tabs/EventsTab.tsx"],
    
    # Student profile modals
    ["src/features/student-profile/ui/StudentProfileDrawer/modals/AdmissionNoteModal.tsx", "src/features/student-profile/ui/modals/AdmissionNoteModal.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/modals/DocumentsModal.tsx", "src/features/student-profile/ui/modals/DocumentsModal.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/modals/GraduationModal.tsx", "src/features/student-profile/ui/modals/GraduationModal.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/modals/MessageModal.tsx", "src/features/student-profile/ui/modals/MessageModal.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/modals/SchoolAdmissionNoteModal.tsx", "src/features/student-profile/ui/modals/SchoolAdmissionNoteModal.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/modals/ApprovalModal.tsx", "src/features/student-profile/ui/modals/ApprovalModal.tsx"],
    ["src/features/student-profile/ui/StudentProfileDrawer/modals/PromotionModal.tsx", "src/features/student-profile/ui/modals/PromotionModal.tsx"],
    
    # College admin vs Educator - keep in respective features
    ["src/features/college-admin/ui/modals/ManageStudentsModal.tsx", "src/features/educator/ui/ManageStudentsModal.tsx"],
    ["src/features/college-admin/ui/modals/BulkDeleteStudentsModal.tsx", "src/features/educator/ui/modals/BulkDeleteStudentsModal.tsx"],
    ["src/features/college-admin/ui/modals/EditStudentModal.tsx", "src/features/educator/ui/modals/EditStudentModal.tsx"],
    ["src/features/college-admin/ui/modals/DeleteStudentModal.tsx", "src/features/educator/ui/modals/DeleteStudentModal.tsx"],
    ["src/features/college-admin/ui/modals/ManageProgramStudentsModal.tsx", "src/features/educator/ui/ManageProgramStudentsModal.tsx"],
    ["src/features/college-admin/ui/modals/MentorResponseModal.tsx", "src/features/educator/ui/MentorResponseModal.tsx"],
    ["src/features/college-admin/ui/SwapRequestCard.tsx", "src/features/educator/ui/teacher/SwapRequestCard.tsx"],
    ["src/features/college-admin/ui/modals/SwapRequestModal.tsx", "src/features/educator/ui/teacher/SwapRequestModal.tsx"],
    
    # College admin components - keep in features
    ["src/features/college-admin/ui/components/ModerationPanel.tsx", "src/pages/admin/collegeAdmin/components/ModerationPanel.tsx"],
    ["src/features/college-admin/ui/components/TimetableScheduler.tsx", "src/pages/admin/collegeAdmin/components/TimetableScheduler.tsx"],
    ["src/features/college-admin/ui/components/MarkEntryGrid.tsx", "src/pages/admin/collegeAdmin/components/MarkEntryGrid.tsx"],
    ["src/features/college-admin/ui/components/Timetable/components/modals/BreakModal.tsx", "src/pages/admin/collegeAdmin/components/Timetable/components/modals/BreakModal.tsx"],
    
    # Recruiter vs Recruiter-pipeline - keep in recruiter-pipeline (newer)
    ["src/features/recruiter-pipeline/ui/AdvancedCharts.tsx", "src/features/recruiter/ui/AdvancedCharts.tsx"],
    ["src/features/recruiter-pipeline/ui/DateRangePicker.tsx", "src/features/recruiter/ui/DateRangePicker.tsx"],
    ["src/features/recruiter-pipeline/ui/PipelineStats.tsx", "src/features/recruiter/ui/PipelineStats.tsx"],
    ["src/features/recruiter-pipeline/ui/CandidateQuickView.tsx", "src/features/recruiter/ui/CandidateQuickView.tsx"],
    ["src/features/recruiter-pipeline/ui/AdvancedRequisitionFilters.tsx", "src/features/recruiter/ui/filters/AdvancedRequisitionFilters.tsx"],
    ["src/features/recruiter-pipeline/ui/AnalyticsComponents.tsx", "src/features/recruiter/ui/AnalyticsComponents.tsx"],
    ["src/features/recruiter-pipeline/ui/PipelineSortMenu.tsx", "src/features/recruiter/ui/PipelineSortMenu.tsx"],
    ["src/features/recruiter-pipeline/ui/modals/DiversityExportModal.tsx", "src/features/recruiter/ui/modals/DiversityExportModal.tsx", "src/features/educator/ui/modals/DiversityExportModal.tsx"],
    
    # Marketing - keep in shared/ui
    ["src/shared/ui/marketing/HeroSection.jsx", "src/features/marketing/ui/skillpassport/HeroSection.jsx"],
    ["src/shared/ui/marketing/EarlyAccessSection.jsx", "src/features/marketing/ui/skillpassport/EarlyAccessSection.jsx"],
    ["src/shared/ui/marketing/NeedHelpSection.jsx", "src/features/marketing/ui/skillpassport/NeedHelpSection.jsx"],
    ["src/shared/ui/marketing/WhatYouGetSection.jsx", "src/features/marketing/ui/skillpassport/WhatYouGetSection.jsx"],
    ["src/shared/ui/marketing/WhatIsSection.jsx", "src/features/marketing/ui/skillpassport/WhatIsSection.jsx"],
    ["src/shared/ui/marketing/WhoIsThisForSection.jsx", "src/features/marketing/ui/skillpassport/WhoIsThisForSection.jsx"],
    ["src/shared/ui/marketing/AboutRaremindsSection.jsx", "src/features/marketing/ui/skillpassport/AboutRaremindsSection.jsx"],
    
    # Shared UI components
    ["src/shared/ui/ConfirmModal.tsx", "src/features/college-admin/ui/events/components/ConfirmModal.tsx"],
    ["src/shared/ui/FloatingEducatorAIButton.tsx", "src/features/educator/ui/FloatingEducatorAIButton.tsx"],
    ["src/shared/ui/FloatingRecruiterAIButton.tsx", "src/features/recruiter-pipeline/ui/FloatingRecruiterAIButton.tsx"],
    ["src/shared/ui/marketing/orbit-timeline/card.tsx", "src/shared/ui/marketing/warp-background/card.tsx"],
    
    # Type definitions - keep in shared/types
    ["src/shared/types/educator/course.ts", "src/features/courses/model/course-types.ts"],
    ["src/shared/types/project.ts", "src/features/placement/model/project-types.ts"],
    ["src/shared/types/college.ts", "src/features/college-admin/model/college-types.ts"],
    ["src/shared/types/classSwap.ts", "src/features/college-admin/model/class-swap-types.ts"],
    ["src/shared/types/adaptiveAptitude.ts", "src/features/assessment/model/adaptive-aptitude-types.ts"],
    ["src/shared/types/recruiter.ts", "src/entities/recruiter/model/types.ts"],
    
    # API services - keep in features
    ["src/features/student-profile/api/studentActivityService.js", "src/entities/student/api/studentActivityService.js"],
    ["src/features/exams/api/studentExamService.ts", "src/entities/student/api/studentExamService.ts"],
    ["src/features/student-profile/api/studentClassService.ts", "src/entities/student/api/studentClassService.ts", "src/features/myclass/api/studentClassService.ts"],
    ["src/features/student-profile/api/studentDocumentService.ts", "src/features/digital-portfolio/api/studentDocumentService.ts"],
    ["src/features/recruiter-pipeline/api/pipelineService.ts", "src/features/opportunities/api/pipelineService.ts"],
    
    # Functions library - keep in src/functions-lib
    ["src/functions-lib/response.ts", "functions/lib/response.ts"],
    ["src/functions-lib/types.ts", "functions/lib/types.ts"],
    ["src/functions-lib/supabase.ts", "functions/lib/supabase.ts"],
    
    # Subscription - keep in base directory
    ["src/features/subscription/ui/SubscriptionDetails.jsx", "src/features/subscription/ui/individual/SubscriptionDetails.jsx"],
    ["src/features/subscription/ui/AddOnCard.jsx", "src/features/subscription/ui/individual/AddOnCard.jsx"],
    ["src/features/subscription/ui/ReceiptCard.jsx", "src/features/subscription/ui/individual/ReceiptCard.jsx"],
    ["src/features/subscription/ui/TransactionList.jsx", "src/features/subscription/ui/individual/TransactionList.jsx"],
    ["src/features/subscription/ui/TransactionGrid.jsx", "src/features/subscription/ui/individual/TransactionGrid.jsx"],
    
    # Courses - keep TypeScript versions
    ["src/features/courses/api/embeddingBatch.ts", "src/features/courses/lib/recommendations/embeddingBatch.js"],
    ["src/features/courses/api/config.ts", "src/features/courses/lib/recommendations/config.js"],
    ["src/features/courses/api/embeddingService.ts", "src/features/courses/lib/recommendations/embeddingService.js"],
    ["src/features/courses/api/fieldDomainService.ts", "src/features/courses/lib/recommendations/fieldDomainService.js"],
    ["src/features/courses/ui/RestoreProgressModal.jsx", "src/entities/student/ui/courses/RestoreProgressModal.jsx"],
    ["src/features/courses/ui/CourseDetailModal.jsx", "src/entities/student/ui/courses/CourseDetailModal.jsx", "src/features/admin/ui/modals/CourseDetailModal.jsx"],
    ["src/features/courses/ui/AssignEducatorModal.tsx", "src/features/educator/ui/AssignEducatorModal.tsx"],
    
    # Widgets - keep in widgets
    ["src/widgets/student-dashboard/ui/AchievementsExpanded.jsx", "src/features/student-profile/ui/AchievementsExpanded.jsx"],
    ["src/widgets/student-dashboard/ui/SkillTrackerExpanded.jsx", "src/features/student-profile/ui/SkillTrackerExpanded.jsx"],
    ["src/widgets/student-dashboard/ui/Generateresumepdf.jsx", "src/features/student-profile/ui/Generateresumepdf.jsx"],
    
    # Shared lib - keep in shared/lib
    ["src/shared/lib/utils/cn.ts", "src/shared/lib/cn.ts"],
    ["src/shared/lib/employabilityCalculator.js", "src/features/assessment/lib/employabilityCalculator.js"],
    
    # Config - keep in shared
    ["src/shared/config/fileSizeLimits.ts", "functions/api/storage/config/fileSizeLimits.ts"],
    
    # Subscription lib - keep TypeScript versions
    ["src/features/subscription/api/pdfReceiptGenerator.ts", "src/features/subscription/lib/pdfReceiptGenerator.js"],
    ["src/features/subscription/lib/usePaymentVerification.ts", "src/features/subscription/model/usePaymentVerification.js"],
    
    # Educator copilot
    ["src/features/educator-copilot/api/dashboardApi.ts", "src/features/educator/api/dashboardApi.ts"],
    
    # School admin
    ["src/features/school-admin/ui/modals/DocumentViewerModal.tsx", "src/features/admin/ui/modals/DocumentViewerModal.tsx"],
]

def main():
    deleted_count = 0
    errors = []
    
    for duplicate_set in DUPLICATES:
        keep_file = duplicate_set[0]
        delete_files = duplicate_set[1:]
        
        # Check if the file to keep exists
        if not os.path.exists(keep_file):
            errors.append(f"WARNING: Keep file doesn't exist: {keep_file}")
            continue
        
        # Delete duplicate files
        for delete_file in delete_files:
            if os.path.exists(delete_file):
                try:
                    os.remove(delete_file)
                    print(f"✓ Deleted: {delete_file}")
                    deleted_count += 1
                except Exception as e:
                    errors.append(f"ERROR deleting {delete_file}: {e}")
            else:
                print(f"  Already gone: {delete_file}")
    
    print(f"\n{'='*60}")
    print(f"Summary: Deleted {deleted_count} duplicate files")
    
    if errors:
        print(f"\nErrors/Warnings ({len(errors)}):")
        for error in errors:
            print(f"  {error}")
    
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
