/**
 * Update All Hook Imports - Task 5.10
 * 
 * This script updates all remaining hook imports to use proper FSD paths:
 * - @/hooks/* -> feature/entity/shared paths
 * - ../../hooks/* -> feature/entity/shared paths
 * - Validates hook naming conventions (use* prefix)
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface HookMapping {
  hookName: string;
  oldPaths: string[];
  newPath: string;
  layer: 'entity' | 'feature' | 'shared';
}

// Comprehensive hook mappings based on migration
const hookMappings: HookMapping[] = [
  // Entity hooks - Student
  { hookName: 'useStudentDataByEmail', oldPaths: ['@/hooks/useStudentDataByEmail', '../hooks/useStudentDataByEmail', '../../hooks/useStudentDataByEmail', '../../../hooks/useStudentDataByEmail'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentCertificates', oldPaths: ['@/hooks/useStudentCertificates', '../hooks/useStudentCertificates', '../../hooks/useStudentCertificates', '../../../hooks/useStudentCertificates'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentLearning', oldPaths: ['@/hooks/useStudentLearning', '../hooks/useStudentLearning', '../../hooks/useStudentLearning', '../../../hooks/useStudentLearning'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentProjects', oldPaths: ['@/hooks/useStudentProjects', '../hooks/useStudentProjects', '../../hooks/useStudentProjects', '../../../hooks/useStudentProjects'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentExperience', oldPaths: ['@/hooks/useStudentExperience', '../hooks/useStudentExperience', '../../hooks/useStudentExperience', '../../../hooks/useStudentExperience'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentEducation', oldPaths: ['@/hooks/useStudentEducation', '../hooks/useStudentEducation', '../../hooks/useStudentEducation', '../../../hooks/useStudentEducation'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentTechnicalSkills', oldPaths: ['@/hooks/useStudentSkills', '../hooks/useStudentSkills', '../../hooks/useStudentSkills', '../../../hooks/useStudentSkills'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentSoftSkills', oldPaths: ['@/hooks/useStudentSkills', '../hooks/useStudentSkills', '../../hooks/useStudentSkills', '../../../hooks/useStudentSkills'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentAchievements', oldPaths: ['@/hooks/useStudentAchievements', '../hooks/useStudentAchievements', '../../hooks/useStudentAchievements', '../../../hooks/useStudentAchievements'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentTrainings', oldPaths: ['@/hooks/useStudentTrainings', '../hooks/useStudentTrainings', '../../hooks/useStudentTrainings', '../../../hooks/useStudentTrainings'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentConversations', oldPaths: ['@/hooks/useStudentMessages', '../hooks/useStudentMessages', '../../hooks/useStudentMessages', '../../../hooks/useStudentMessages'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentMessageNotifications', oldPaths: ['@/hooks/useStudentMessageNotifications', '../hooks/useStudentMessageNotifications', '../../hooks/useStudentMessageNotifications', '../../../hooks/useStudentMessageNotifications'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentUnreadCount', oldPaths: ['@/hooks/useStudentMessages', '../hooks/useStudentMessages', '../../hooks/useStudentMessages', '../../../hooks/useStudentMessages'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentEducatorConversations', oldPaths: ['@/hooks/useStudentEducatorMessages', '../hooks/useStudentEducatorMessages', '../../hooks/useStudentEducatorMessages', '../../../hooks/useStudentEducatorMessages'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentEducatorMessages', oldPaths: ['@/hooks/useStudentEducatorMessages', '../hooks/useStudentEducatorMessages', '../../hooks/useStudentEducatorMessages', '../../../hooks/useStudentEducatorMessages'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentAdminConversations', oldPaths: ['@/hooks/useStudentAdminMessages', '../hooks/useStudentAdminMessages', '../../hooks/useStudentAdminMessages', '../../../hooks/useStudentAdminMessages'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useCreateStudentAdminConversation', oldPaths: ['@/hooks/useStudentAdminMessages', '../hooks/useStudentAdminMessages', '../../hooks/useStudentAdminMessages', '../../../hooks/useStudentAdminMessages'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentAdminMessages', oldPaths: ['@/hooks/useStudentAdminMessages', '../hooks/useStudentAdminMessages', '../../hooks/useStudentAdminMessages', '../../../hooks/useStudentAdminMessages'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentCollegeAdminConversations', oldPaths: ['@/hooks/useStudentCollegeAdminMessages', '../hooks/useStudentCollegeAdminMessages', '../../hooks/useStudentCollegeAdminMessages', '../../../hooks/useStudentCollegeAdminMessages'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useCreateStudentCollegeAdminConversation', oldPaths: ['@/hooks/useStudentCollegeAdminMessages', '../hooks/useStudentCollegeAdminMessages', '../../hooks/useStudentCollegeAdminMessages', '../../../hooks/useStudentCollegeAdminMessages'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useStudentCollegeAdminMessages', oldPaths: ['@/hooks/useStudentCollegeAdminMessages', '../hooks/useStudentCollegeAdminMessages', '../../hooks/useStudentCollegeAdminMessages', '../../../hooks/useStudentCollegeAdminMessages'], newPath: '@/entities/student', layer: 'entity' },
  
  // Entity hooks - User
  { hookName: 'useUserRole', oldPaths: ['@/hooks/useUserRole', '../hooks/useUserRole', '../../hooks/useUserRole', '../../../hooks/useUserRole'], newPath: '@/entities/user', layer: 'entity' },
  { hookName: 'useUsers', oldPaths: ['@/hooks/college/useUsers', '../hooks/college/useUsers', '../../hooks/college/useUsers', '../../../hooks/college/useUsers'], newPath: '@/entities/user', layer: 'entity' },
  { hookName: 'useStudents', oldPaths: ['@/hooks/useAdminStudents', '../hooks/useAdminStudents', '../../hooks/useAdminStudents', '../../../hooks/useAdminStudents', '@/hooks/useStudents', '../hooks/useStudents', '../../hooks/useStudents', '../../../hooks/useStudents'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'UICandidate', oldPaths: ['@/hooks/useStudents', '../hooks/useStudents', '../../hooks/useStudents', '../../../hooks/useStudents'], newPath: '@/entities/student', layer: 'entity' },
  { hookName: 'useRecruitmentFunnel', oldPaths: ['@/hooks/useRecruitmentFunnel', '../hooks/useRecruitmentFunnel', '../../hooks/useRecruitmentFunnel', '../../../hooks/useRecruitmentFunnel'], newPath: '@/entities/user', layer: 'entity' },
  
  // Feature hooks - Subscription
  { hookName: 'useOrganizationSubscription', oldPaths: ['@/hooks/Subscription/useOrganizationSubscription', '../hooks/Subscription/useOrganizationSubscription', '../../hooks/Subscription/useOrganizationSubscription', '../../../hooks/Subscription/useOrganizationSubscription'], newPath: '@/features/subscription', layer: 'feature' },
  { hookName: 'useSubscriptionPlansData', oldPaths: ['@/hooks/Subscription/useSubscriptionPlansData', '../hooks/Subscription/useSubscriptionPlansData', '../../hooks/Subscription/useSubscriptionPlansData', '../../../hooks/Subscription/useSubscriptionPlansData'], newPath: '@/features/subscription', layer: 'feature' },
  { hookName: 'usePaymentVerificationFromURL', oldPaths: ['@/hooks/Subscription/usePaymentVerification', '../hooks/Subscription/usePaymentVerification', '../../hooks/Subscription/usePaymentVerification', '../../../hooks/Subscription/usePaymentVerification'], newPath: '@/features/subscription', layer: 'feature' },
  
  // Feature hooks - Assessment
  { hookName: 'useAssessment', oldPaths: ['@/hooks/useAssessment', '../hooks/useAssessment', '../../hooks/useAssessment', '../../../hooks/useAssessment'], newPath: '@/features/assessment', layer: 'feature' },
  { hookName: 'useAssessmentRecommendations', oldPaths: ['@/hooks/useAssessmentRecommendations', '../hooks/useAssessmentRecommendations', '../../hooks/useAssessmentRecommendations', '../../../hooks/useAssessmentRecommendations'], newPath: '@/features/assessment', layer: 'feature' },
  { hookName: 'useAssessmentPromotional', oldPaths: ['@/hooks/useAssessmentPromotional', '../hooks/useAssessmentPromotional', '../../hooks/useAssessmentPromotional', '../../../hooks/useAssessmentPromotional'], newPath: '@/features/assessment', layer: 'feature' },
  
  // Feature hooks - Opportunities
  { hookName: 'useOpportunities', oldPaths: ['@/hooks/useOpportunities', '../hooks/useOpportunities', '../../hooks/useOpportunities', '../../../hooks/useOpportunities'], newPath: '@/features/opportunities', layer: 'feature' },
  { hookName: 'useAIJobMatching', oldPaths: ['@/hooks/useAIJobMatching', '../hooks/useAIJobMatching', '../../hooks/useAIJobMatching', '../../../hooks/useAIJobMatching'], newPath: '@/features/opportunities', layer: 'feature' },
  { hookName: 'useAIRecommendations', oldPaths: ['@/hooks/useAIRecommendations', '../hooks/useAIRecommendations', '../../hooks/useAIRecommendations', '../../../hooks/useAIRecommendations'], newPath: '@/features/opportunities', layer: 'feature' },
  { hookName: 'useProfileCompletion', oldPaths: ['@/hooks/useProfileCompletion', '../hooks/useProfileCompletion', '../../hooks/useProfileCompletion', '../../../hooks/useProfileCompletion'], newPath: '@/features/opportunities', layer: 'feature' },
  
  // Feature hooks - Messaging
  { hookName: 'useMessageNotifications', oldPaths: ['@/hooks/useMessageNotifications', '../hooks/useMessageNotifications', '../../hooks/useMessageNotifications', '../../../hooks/useMessageNotifications'], newPath: '@/features/messaging', layer: 'feature' },
  { hookName: 'useNotificationBroadcast', oldPaths: ['@/hooks/useNotificationBroadcast', '../hooks/useNotificationBroadcast', '../../hooks/useNotificationBroadcast', '../../../hooks/useNotificationBroadcast'], newPath: '@/features/messaging', layer: 'feature' },
  { hookName: 'useEducatorMessages', oldPaths: ['@/hooks/useEducatorMessages', '../hooks/useEducatorMessages', '../../hooks/useEducatorMessages', '../../../hooks/useEducatorMessages'], newPath: '@/features/messaging', layer: 'feature' },
  { hookName: 'useEducatorAdminMessages', oldPaths: ['@/hooks/useEducatorAdminMessages', '../hooks/useEducatorAdminMessages', '../../hooks/useEducatorAdminMessages', '../../../hooks/useEducatorAdminMessages'], newPath: '@/features/messaging', layer: 'feature' },
  
  // Feature hooks - Exams
  { hookName: 'useExams', oldPaths: ['@/hooks/useExams', '../hooks/useExams', '../../hooks/useExams', '../../../hooks/useExams'], newPath: '@/features/exams', layer: 'feature' },
  
  // Feature hooks - Recruiter
  { hookName: 'useNotifications', oldPaths: ['@/hooks/useNotifications', '../hooks/useNotifications', '../../hooks/useNotifications', '../../../hooks/useNotifications'], newPath: '@/features/recruiter', layer: 'feature' },
  { hookName: 'usePipelineData', oldPaths: ['@/hooks/usePipelineData', '../hooks/usePipelineData', '../../hooks/usePipelineData', '../../../hooks/usePipelineData'], newPath: '@/features/recruiter', layer: 'feature' },
  
  // Shared hooks
  { hookName: 'useOfflineSync', oldPaths: ['@/hooks/useOfflineSync', '../hooks/useOfflineSync', '../../hooks/useOfflineSync', '../../../hooks/useOfflineSync'], newPath: '@/shared/lib/hooks', layer: 'shared' },
  { hookName: 'useRealtimeProgress', oldPaths: ['@/hooks/useRealtimeProgress', '../hooks/useRealtimeProgress', '../../hooks/useRealtimeProgress', '../../../hooks/useRealtimeProgress'], newPath: '@/shared/lib/hooks', layer: 'shared' },
  { hookName: 'useSessionRestore', oldPaths: ['@/hooks/useSessionRestore', '../hooks/useSessionRestore', '../../hooks/useSessionRestore', '../../../hooks/useSessionRestore'], newPath: '@/shared/lib/hooks', layer: 'shared' },
  { hookName: 'useVideoProgress', oldPaths: ['@/hooks/useVideoProgress', '../hooks/useVideoProgress', '../../hooks/useVideoProgress', '../../../hooks/useVideoProgress'], newPath: '@/shared/lib/hooks', layer: 'shared' },
  { hookName: 'useCurrentPromotional', oldPaths: ['@/hooks/useCurrentPromotional', '../hooks/useCurrentPromotional', '../../hooks/useCurrentPromotional', '../../../hooks/useCurrentPromotional'], newPath: '@/shared/lib/hooks', layer: 'shared' },
  { hookName: 'useStudentRealtimeActivities', oldPaths: ['@/hooks/useStudentRealtimeActivities', '../hooks/useStudentRealtimeActivities', '../../hooks/useStudentRealtimeActivities', '../../../hooks/useStudentRealtimeActivities'], newPath: '@/shared/lib/hooks', layer: 'shared' },
  
  // Additional hooks found in codebase
  { hookName: 'useAnalytics', oldPaths: ['@/hooks/useAnalytics', '../hooks/useAnalytics', '../../hooks/useAnalytics', '../../../hooks/useAnalytics'], newPath: '@/features/educator-copilot', layer: 'feature' },
  { hookName: 'useEducatorSchool', oldPaths: ['@/hooks/useEducatorSchool', '../hooks/useEducatorSchool', '../../hooks/useEducatorSchool', '../../../hooks/useEducatorSchool'], newPath: '@/features/educator-copilot', layer: 'feature' },
  { hookName: 'useClasses', oldPaths: ['@/hooks/useClasses', '../hooks/useClasses', '../../hooks/useClasses', '../../../hooks/useClasses'], newPath: '@/features/educator-copilot', layer: 'feature' },
  { hookName: 'useEducatorId', oldPaths: ['@/hooks/useEducatorId', '../hooks/useEducatorId', '../../hooks/useEducatorId', '../../../hooks/useEducatorId'], newPath: '@/features/educator-copilot', layer: 'feature' },
  { hookName: 'useCollegeLecturerMessages', oldPaths: ['@/hooks/useCollegeLecturerMessages', '../hooks/useCollegeLecturerMessages', '../../hooks/useCollegeLecturerMessages', '../../../hooks/useCollegeLecturerMessages'], newPath: '@/features/messaging', layer: 'feature' },
  { hookName: 'useCollegeEducatorAdminConversationsForEducator', oldPaths: ['@/hooks/useCollegeEducatorAdminConversations', '../hooks/useCollegeEducatorAdminConversations', '../../hooks/useCollegeEducatorAdminConversations', '../../../hooks/useCollegeEducatorAdminConversations'], newPath: '@/features/messaging', layer: 'feature' },
  { hookName: 'useCollegeEducatorAdminMessagesForEducator', oldPaths: ['@/hooks/useCollegeEducatorAdminMessages', '../hooks/useCollegeEducatorAdminMessages', '../../hooks/useCollegeEducatorAdminMessages', '../../../hooks/useCollegeEducatorAdminMessages'], newPath: '@/features/messaging', layer: 'feature' },
  { hookName: 'useCollegeAdminMessages', oldPaths: ['@/hooks/useCollegeAdminMessages', '../hooks/useCollegeAdminMessages', '../../hooks/useCollegeAdminMessages', '../../../hooks/useCollegeAdminMessages'], newPath: '@/features/messaging', layer: 'feature' },
  { hookName: 'useCollegeEducatorAdminConversationsForAdmin', oldPaths: ['@/hooks/useCollegeEducatorAdminConversations', '../hooks/useCollegeEducatorAdminConversations', '../../hooks/useCollegeEducatorAdminConversations', '../../../hooks/useCollegeEducatorAdminConversations'], newPath: '@/features/messaging', layer: 'feature' },
  { hookName: 'useCollegeEducatorAdminMessagesForAdmin', oldPaths: ['@/hooks/useCollegeEducatorAdminMessages', '../hooks/useCollegeEducatorAdminMessages', '../../hooks/useCollegeEducatorAdminMessages', '../../../hooks/useCollegeEducatorAdminMessages'], newPath: '@/features/messaging', layer: 'feature' },
  { hookName: 'useAnalyticsKPIs', oldPaths: ['@/hooks/useAnalyticsKPIs', '../hooks/useAnalyticsKPIs', '../../hooks/useAnalyticsKPIs', '../../../hooks/useAnalyticsKPIs'], newPath: '@/features/recruiter', layer: 'feature' },
  { hookName: 'useCoursePerformance', oldPaths: ['@/hooks/useCoursePerformance', '../hooks/useCoursePerformance', '../../hooks/useCoursePerformance', '../../../hooks/useCoursePerformance'], newPath: '@/features/recruiter', layer: 'feature' },
  { hookName: 'useDiversityData', oldPaths: ['@/hooks/useDiversityData', '../hooks/useDiversityData', '../../hooks/useDiversityData', '../../../hooks/useDiversityData'], newPath: '@/features/recruiter', layer: 'feature' },
  { hookName: 'useSpeedAnalytics', oldPaths: ['@/hooks/useSpeedAnalytics', '../hooks/useSpeedAnalytics', '../../hooks/useSpeedAnalytics', '../../../hooks/useSpeedAnalytics'], newPath: '@/features/recruiter', layer: 'feature' },
  { hookName: 'useQualityMetrics', oldPaths: ['@/hooks/useQualityMetrics', '../hooks/useQualityMetrics', '../../hooks/useQualityMetrics', '../../../hooks/useQualityMetrics'], newPath: '@/features/recruiter', layer: 'feature' },
  
  // Type imports (not hooks but imported from hook files)
  { hookName: 'UIExam', oldPaths: ['@/hooks/useExams', '../hooks/useExams', '../../hooks/useExams', '../../../hooks/useExams'], newPath: '@/features/exams', layer: 'feature' },
  { hookName: 'UIStudentMark', oldPaths: ['@/hooks/useExams', '../hooks/useExams', '../../hooks/useExams', '../../../hooks/useExams'], newPath: '@/features/exams', layer: 'feature' },
  { hookName: 'NotificationType', oldPaths: ['@/hooks/useNotifications', '../hooks/useNotifications', '../../hooks/useNotifications', '../../../hooks/useNotifications'], newPath: '@/features/recruiter', layer: 'feature' },
  { hookName: 'AdminNotificationType', oldPaths: ['@/hooks/useAdminNotifications', '../hooks/useAdminNotifications', '../../hooks/useAdminNotifications', '../../../hooks/useAdminNotifications'], newPath: '@/shared/lib/hooks', layer: 'shared' },
  { hookName: 'clearFeatureAccessCache', oldPaths: ['@/hooks/useFeatureGate', '../hooks/useFeatureGate', '../../hooks/useFeatureGate', '../../../hooks/useFeatureGate'], newPath: '@/features/subscription', layer: 'feature' },
];

class HookImportUpdater {
  private updatedFiles = 0;
  private totalReplacements = 0;
  private errors: string[] = [];

  async updateAllImports(): Promise<void> {
    console.log('🔄 Starting hook import updates...\n');

    // Find all source files (excluding migration scripts and backups)
    const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
      ignore: ['**/node_modules/**', '**/migration/**', '**/.migration-backups/**', '**/dist/**', '**/build/**']
    });

    console.log(`📁 Found ${files.length} files to process\n`);

    for (const file of files) {
      try {
        await this.updateFileImports(file);
      } catch (error) {
        this.errors.push(`Error processing ${file}: ${error}`);
      }
    }

    this.printSummary();
  }

  private async updateFileImports(filePath: string): Promise<void> {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    let fileReplacements = 0;

    for (const mapping of hookMappings) {
      for (const oldPath of mapping.oldPaths) {
        // Pattern 1: Named imports - import { hookName, ... } from 'oldPath'
        const namedImportRegex = new RegExp(
          `import\\s*{([^}]*)}\\s*from\\s*['"]${this.escapeRegex(oldPath)}['"]`,
          'g'
        );

        const namedMatches = content.match(namedImportRegex);
        if (namedMatches) {
          content = content.replace(namedImportRegex, (match, imports) => {
            // Check if this specific hook is in the imports
            if (imports.includes(mapping.hookName)) {
              modified = true;
              fileReplacements++;
              return `import {${imports}} from '${mapping.newPath}'`;
            }
            return match;
          });
        }

        // Pattern 2: Default import - import hookName from 'oldPath'
        const defaultImportRegex = new RegExp(
          `import\\s+${mapping.hookName}\\s+from\\s*['"]${this.escapeRegex(oldPath)}['"]`,
          'g'
        );

        if (defaultImportRegex.test(content)) {
          content = content.replace(defaultImportRegex, `import ${mapping.hookName} from '${mapping.newPath}'`);
          modified = true;
          fileReplacements++;
        }
        
        // Pattern 3: Type imports - import type { Type } from 'oldPath'
        const typeImportRegex = new RegExp(
          `import\\s+type\\s*{([^}]*)}\\s*from\\s*['"]${this.escapeRegex(oldPath)}['"]`,
          'g'
        );

        const typeMatches = content.match(typeImportRegex);
        if (typeMatches) {
          content = content.replace(typeImportRegex, (match, imports) => {
            if (imports.includes(mapping.hookName)) {
              modified = true;
              fileReplacements++;
              return `import type {${imports}} from '${mapping.newPath}'`;
            }
            return match;
          });
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      this.updatedFiles++;
      this.totalReplacements += fileReplacements;
      console.log(`✅ Updated ${filePath} (${fileReplacements} replacements)`);
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Hook Import Update Summary');
    console.log('='.repeat(60));
    console.log(`✅ Files updated: ${this.updatedFiles}`);
    console.log(`🔄 Total replacements: ${this.totalReplacements}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors encountered: ${this.errors.length}`);
      this.errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('\n✨ No errors encountered!');
    }
    console.log('='.repeat(60));
  }
}

// Run the updater
const updater = new HookImportUpdater();
updater.updateAllImports().catch(console.error);
