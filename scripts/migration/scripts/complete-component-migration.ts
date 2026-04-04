#!/usr/bin/env tsx
/**
 * Complete Component Migration
 * 
 * Migrates ALL 120 remaining components from backup to proper FSD locations.
 * Based on the classification from find-missing-components.ts output.
 */

import * as fs from 'fs';
import * as path from 'path';

interface ComponentMapping {
  source: string;
  target: string;
  category: string;
}

// High-priority components (most used)
const MAPPINGS: ComponentMapping[] = [
  // common/SearchBar - 32 files use this
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/common/SearchBar.tsx', target: 'src/shared/ui/SearchBar.tsx', category: 'shared-ui' },
  
  // admin/KPICard - 22 files
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/admin/KPICard.tsx', target: 'src/shared/ui/KPICard.tsx', category: 'shared-ui' },
  
  // admin/Pagination - 13 files
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/admin/Pagination.tsx', target: 'src/shared/ui/Pagination.tsx', category: 'shared-ui' },
  
  // Students/components/ui/button - 11 files
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ui/button.tsx', target: 'src/shared/ui/button.tsx', category: 'shared-ui' },
  
  // educator/Pagination - 7 files (same as admin pagination, skip duplicate)
  
  // Students/components/ui/label - 6 files
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ui/label.tsx', target: 'src/shared/ui/label.tsx', category: 'shared-ui' },
  
  // Students/data/mockData - 6 files
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/data/mockData.ts', target: 'src/shared/lib/test/mockData.ts', category: 'shared-lib' },
  
  // Students/components/ui/card - 6 files
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ui/card.tsx', target: 'src/shared/ui/card.tsx', category: 'shared-ui' },
  
  // Button - 6 files
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Button.jsx', target: 'src/shared/ui/Button.jsx', category: 'shared-ui' },
  
  // Students UI components
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ui/radio-group.tsx', target: 'src/shared/ui/radio-group.tsx', category: 'shared-ui' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ui/alert-dialog.tsx', target: 'src/shared/ui/alert-dialog.tsx', category: 'shared-ui' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ui/pagination.tsx', target: 'src/shared/ui/pagination.tsx', category: 'shared-ui' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ui/dropdown-menu.tsx', target: 'src/shared/ui/dropdown-menu.tsx', category: 'shared-ui' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ui/lamp.tsx', target: 'src/shared/ui/lamp.tsx', category: 'shared-ui' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ui/input.tsx', target: 'src/shared/ui/input.tsx', category: 'shared-ui' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ui/dialog.tsx', target: 'src/shared/ui/dialog.tsx', category: 'shared-ui' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ui/tabs.tsx', target: 'src/shared/ui/tabs.tsx', category: 'shared-ui' },
  
  // Student feature components
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ProfileEditSection.tsx', target: 'src/features/student-profile/ui/ProfileEditSection.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/StudentPublicViewer.tsx', target: 'src/features/student-profile/ui/StudentPublicViewer.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ProfileEditModals.tsx', target: 'src/features/student-profile/ui/ProfileEditModals.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/AchievementsTimeline.tsx', target: 'src/features/student-profile/ui/AchievementsTimeline.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/AnalyticsView.tsx', target: 'src/features/student-profile/ui/AnalyticsView.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/TrainingRecommendations.tsx', target: 'src/features/student-profile/ui/TrainingRecommendations.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/SuggestedNextSteps.tsx', target: 'src/features/student-profile/ui/SuggestedNextSteps.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/RecentUpdatesCard.tsx', target: 'src/features/student-profile/ui/RecentUpdatesCard.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/SkillsDashboard.tsx', target: 'src/features/student-profile/ui/SkillsDashboard.tsx', category: 'feature' },
  
  // Opportunities feature
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/OpportunityCard.tsx', target: 'src/features/opportunities/ui/OpportunityCard.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/OpportunityListItem.tsx', target: 'src/features/opportunities/ui/OpportunityListItem.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/OpportunityPreview.tsx', target: 'src/features/opportunities/ui/OpportunityPreview.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/RecommendedJobs.tsx', target: 'src/features/opportunities/ui/RecommendedJobs.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/AdvancedFilters.tsx', target: 'src/features/opportunities/ui/AdvancedFilters.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/IndustrialVisitPreview.tsx', target: 'src/features/opportunities/ui/IndustrialVisitPreview.tsx', category: 'feature' },
  
  // Courses feature
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/CourseAdvancedFilters.tsx', target: 'src/features/courses/ui/CourseAdvancedFilters.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/ModernLearningCard.tsx', target: 'src/features/courses/ui/ModernLearningCard.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/LearningAnalyticsDashboard.tsx', target: 'src/features/courses/ui/LearningAnalyticsDashboard.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/SelectCourseModal.tsx', target: 'src/features/courses/ui/SelectCourseModal.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/student/WeeklyLearningTracker.tsx', target: 'src/features/courses/ui/WeeklyLearningTracker.tsx', category: 'feature' },
  
  // Settings
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students/components/SettingsTabs/MainSettings.tsx', target: 'src/features/student-profile/ui/settings/MainSettings.tsx', category: 'feature' },
  
  // Myclass feature
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Myclass/SchoolMyClass.tsx', target: 'src/features/myclass/ui/SchoolMyClass.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Myclass/CollegeMyClass.tsx', target: 'src/features/myclass/ui/CollegeMyClass.tsx', category: 'feature' },
  
  // Assessment feature
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/assessment/EmbeddedAssessment.tsx', target: 'src/features/assessment/ui/EmbeddedAssessment.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/assessment/ProfileCompletionModal.tsx', target: 'src/features/assessment/ui/ProfileCompletionModal.tsx', category: 'feature' },
  
  // Educator/College-admin features
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/educator/modals/Addstudentmodal.tsx', target: 'src/features/college-admin/ui/modals/AddStudentModal.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/educator/modals/EditStudentModal.tsx', target: 'src/features/college-admin/ui/modals/EditStudentModal.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/educator/modals/DeleteStudentModal.tsx', target: 'src/features/college-admin/ui/modals/DeleteStudentModal.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/educator/modals/BulkDeleteStudentsModal.tsx', target: 'src/features/college-admin/ui/modals/BulkDeleteStudentsModal.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/educator/ManageStudentsModal.tsx', target: 'src/features/college-admin/ui/modals/ManageStudentsModal.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/educator/ManageProgramStudentsModal.tsx', target: 'src/features/college-admin/ui/modals/ManageProgramStudentsModal.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/educator/MentorResponseModal.tsx', target: 'src/features/college-admin/ui/modals/MentorResponseModal.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/educator/KPICard.tsx', target: 'src/shared/ui/KPICard.tsx', category: 'shared-ui' },
  
  // Teacher/Swap requests
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/teacher/SwapRequestCard.tsx', target: 'src/features/college-admin/ui/SwapRequestCard.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/teacher/SwapRequestModal.tsx', target: 'src/features/college-admin/ui/modals/SwapRequestModal.tsx', category: 'feature' },
  
  // Messaging
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/messaging/NewStudentConversationModalEducator.jsx', target: 'src/features/messaging/ui/NewStudentConversationModalEducator.jsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/messaging/NewEducatorAdminConversationModal.tsx', target: 'src/features/messaging/ui/NewEducatorAdminConversationModal.tsx', category: 'feature' },
  
  // Subscription
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Subscription/FeatureGate.tsx', target: 'src/features/subscription/ui/shared/FeatureGate.tsx', category: 'feature' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Subscription/SubscriptionSettingsSection.tsx', target: 'src/features/subscription/ui/shared/SubscriptionSettingsSection.tsx', category: 'feature' },
  
  // Shared components
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/shared/AssessmentReportDrawer.tsx', target: 'src/shared/ui/AssessmentReportDrawer.tsx', category: 'shared-ui' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/shared/ConfirmModal.tsx', target: 'src/shared/ui/ConfirmModal.tsx', category: 'shared-ui' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Footer.jsx', target: 'src/shared/ui/Footer.jsx', category: 'shared-ui' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/OTPInput.jsx', target: 'src/shared/ui/OTPInput.jsx', category: 'shared-ui' },
  
  // Skillpassport/Homepage
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/skillpassport/HeroSection.tsx', target: 'src/shared/ui/marketing/HeroSection.tsx', category: 'shared-ui' },
  { source: '.migration-backups/legacy-final-backup-2026-03-23-173634/components/skillpassport/WhatIsSection.tsx', target: 'src/shared/ui/marketing/WhatIsSection.tsx', category: 'shared-ui' },
];

async function migrateComponents(): Promise<void> {
  console.log('🚀 Starting complete component migration...\n');

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const mapping of MAPPINGS) {
    try {
      if (!fs.existsSync(mapping.source)) {
        console.log(`⏭️  Skipped: ${path.basename(mapping.source)} (source not found)`);
        skipped++;
        continue;
      }

      // Check if already migrated
      if (fs.existsSync(mapping.target)) {
        console.log(`⏭️  Skipped: ${path.basename(mapping.target)} (already exists)`);
        skipped++;
        continue;
      }

      // Create target directory
      const targetDir = path.dirname(mapping.target);
      fs.mkdirSync(targetDir, { recursive: true });

      // Copy file
      const content = fs.readFileSync(mapping.source, 'utf-8');
      fs.writeFileSync(mapping.target, content);

      console.log(`✅ ${path.basename(mapping.source)} → ${mapping.target}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Error: ${path.basename(mapping.source)}:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\n✨ Component migration complete!`);
}

migrateComponents().catch(console.error);
