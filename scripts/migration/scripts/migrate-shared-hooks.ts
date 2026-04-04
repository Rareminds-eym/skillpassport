import * as fs from 'fs';
import * as path from 'path';

interface SharedHook {
  hookFile: string;
  hookName: string;
  targetLocation: string;
  usageLocations: string[];
}

const sharedHooks: SharedHook[] = [
  { hookFile: "use-toast.js", hookName: "use-toast", targetLocation: "shared/lib/hooks/use-toast.ts", usageLocations: [] },
  { hookFile: "useAdaptiveAptitude.ts", hookName: "useAdaptiveAptitude", targetLocation: "shared/lib/hooks/useAdaptiveAptitude.ts", usageLocations: ["features\\assessment\\model\\AssessmentContext.tsx", "features\\assessment\\ui\\AssessmentTestPage.tsx", "hooks\\useAdaptiveAptitude.ts", "pages\\student\\AdaptiveAptitudeTest.tsx", "pages\\student\\AssessmentTest.jsx"] },
  { hookFile: "useAddOnCatalog.js", hookName: "useAddOnCatalog", targetLocation: "shared/lib/hooks/useAddOnCatalog.ts", usageLocations: ["components\\Subscription\\AddOnMarketplace.jsx", "features\\subscription\\ui\\individual\\AddOnMarketplace.jsx", "hooks\\useAddOnCatalog.js"] },
  { hookFile: "useAntiCheating.ts", hookName: "useAntiCheating", targetLocation: "shared/lib/hooks/useAntiCheating.ts", usageLocations: ["features\\assessment\\ui\\AssessmentTestPage.tsx", "pages\\student\\AdaptiveAptitudeTest.tsx"] },
  { hookFile: "useCurrentPromotional.js", hookName: "useCurrentPromotional", targetLocation: "shared/lib/hooks/useCurrentPromotional.ts", usageLocations: ["app\\layouts\\PortfolioLayout.jsx", "app\\layouts\\PublicLayout.jsx", "layouts\\PortfolioLayout.jsx", "layouts\\PublicLayout.jsx"] },
  { hookFile: "useFormValidation.js", hookName: "useFormValidation", targetLocation: "shared/lib/hooks/useFormValidation.ts", usageLocations: ["components\\Students\\components\\SettingsTabs\\ProfileSubTabs\\AcademicDetailsTab.jsx", "components\\Students\\components\\SettingsTabs\\ProfileSubTabs\\AdditionalInfoTab.jsx", "components\\Students\\components\\SettingsTabs\\ProfileSubTabs\\GuardianInfoTab.jsx", "components\\Students\\components\\SettingsTabs\\ProfileSubTabs\\SocialLinksTab.jsx"] },
  { hookFile: "useLessonPlans.ts", hookName: "useLessonPlans", targetLocation: "shared/lib/hooks/useLessonPlans.ts", usageLocations: ["hooks\\useLessonPlans.ts", "pages\\admin\\schoolAdmin\\LessonPlanWrapper.tsx"] },
  { hookFile: "useMentorAllocation.ts", hookName: "useMentorAllocation", targetLocation: "shared/lib/hooks/useMentorAllocation.ts", usageLocations: ["pages\\admin\\collegeAdmin\\MentorAllocation.tsx", "pages\\educator\\MyMentees.tsx"] },
  { hookFile: "educator\\useMockApi.ts", hookName: "useMockApi", targetLocation: "shared/lib/hooks/useMockApi.ts", usageLocations: [] },
  { hookFile: "useOffers.ts", hookName: "useOffers", targetLocation: "shared/lib/hooks/useOffers.ts", usageLocations: ["pages\\recruiter\\OffersDecisions.tsx"] },
  { hookFile: "useOfflineSync.js", hookName: "useOfflineSync", targetLocation: "shared/lib/hooks/useOfflineSync.ts", usageLocations: ["components\\student\\courses\\SyncStatusIndicator.jsx", "features\\courses\\ui\\SyncStatusIndicator.jsx"] },
  { hookFile: "Subscription\\usePaymentVerification.js", hookName: "usePaymentVerification", targetLocation: "shared/lib/hooks/usePaymentVerification.ts", usageLocations: ["features\\subscription\\model\\usePaymentVerification.js", "hooks\\Subscription\\usePaymentVerification.js"] },
  { hookFile: "usePermissions.ts", hookName: "usePermissions", targetLocation: "shared/lib/hooks/usePermissions.ts", usageLocations: ["hooks\\usePermissions.ts"] },
  { hookFile: "useProfileCompletionPrompt.ts", hookName: "useProfileCompletionPrompt", targetLocation: "shared/lib/hooks/useProfileCompletionPrompt.ts", usageLocations: ["hooks\\useProfileCompletionPrompt.ts", "pages\\digital-pp\\PassportPage.tsx"] },
  { hookFile: "useProgramSections.ts", hookName: "useProgramSections", targetLocation: "shared/lib/hooks/useProgramSections.ts", usageLocations: ["pages\\educator\\ProgramSectionsPage.tsx"] },
  { hookFile: "usePromotionalEvent.js", hookName: "usePromotionalEvent", targetLocation: "shared/lib/hooks/usePromotionalEvent.ts", usageLocations: [] },
  { hookFile: "useRealtimeActivities.ts", hookName: "useRealtimeActivities", targetLocation: "shared/lib/hooks/useRealtimeActivities.ts", usageLocations: ["pages\\recruiter\\Activities.tsx", "pages\\recruiter\\Overview.tsx"] },
  { hookFile: "useRealtimePresence.ts", hookName: "useRealtimePresence", targetLocation: "shared/lib/hooks/useRealtimePresence.ts", usageLocations: ["hooks\\useRealtimePresence.ts", "pages\\admin\\collegeAdmin\\StudentCollegeAdminCommunication.tsx", "pages\\admin\\schoolAdmin\\EducatorCommunication.tsx", "pages\\admin\\schoolAdmin\\StudentCommunication.tsx", "pages\\educator\\AdminCommunication.tsx", "pages\\educator\\Communication.tsx", "pages\\educator\\Messages.tsx", "pages\\recruiter\\Messages.tsx", "pages\\student\\EducatorMessages.jsx", "pages\\student\\Messages.jsx"] },
  { hookFile: "useRealtimeProgress.js", hookName: "useRealtimeProgress", targetLocation: "shared/lib/hooks/useRealtimeProgress.ts", usageLocations: [] },
  { hookFile: "useresponsive.tsx", hookName: "useresponsive", targetLocation: "shared/lib/hooks/useresponsive.ts", usageLocations: [] },
  { hookFile: "useSessionRestore.js", hookName: "useSessionRestore", targetLocation: "shared/lib/hooks/useSessionRestore.ts", usageLocations: ["features\\courses\\ui\\CoursePlayer.jsx", "pages\\student\\CoursePlayer.jsx"] },
  { hookFile: "useStudentRealtimeActivities.js", hookName: "useStudentRealtimeActivities", targetLocation: "shared/lib/hooks/useStudentRealtimeActivities.ts", usageLocations: ["components\\Students\\components\\Dashboard.jsx", "components\\Students\\components\\SettingsTabs\\MainSettings.jsx", "pages\\student\\Dashboard.jsx", "pages\\student\\MySkills.jsx", "widgets\\student-dashboard\\ui\\ActivitySection.tsx"] },
  { hookFile: "useTutorChat.ts", hookName: "useTutorChat", targetLocation: "shared/lib/hooks/useTutorChat.ts", usageLocations: ["features\\ai-tutor\\ui\\AITutorChat.tsx", "features\\ai-tutor\\ui\\AITutorPanel.tsx", "features\\ai-tutor\\ui\\VideoSummarizer.tsx", "hooks\\useTutorChat.ts"] },
  { hookFile: "useTypingIndicator.ts", hookName: "useTypingIndicator", targetLocation: "shared/lib/hooks/useTypingIndicator.ts", usageLocations: ["features\\messaging\\model\\useTypingIndicator.ts", "hooks\\useTypingIndicator.ts", "pages\\admin\\collegeAdmin\\StudentCollegeAdminCommunication.tsx", "pages\\admin\\schoolAdmin\\EducatorCommunication.tsx", "pages\\admin\\schoolAdmin\\StudentCommunication.tsx", "pages\\educator\\AdminCommunication.tsx", "pages\\educator\\Communication.tsx", "pages\\educator\\Messages.tsx", "pages\\recruiter\\Messages.optimized.tsx", "pages\\recruiter\\Messages.tsx", "pages\\student\\EducatorMessages.jsx", "pages\\student\\Messages.jsx", "pages\\student\\Messages.optimized.jsx"] },
  { hookFile: "useUnifiedRecentUpdates.js", hookName: "useUnifiedRecentUpdates", targetLocation: "shared/lib/hooks/useUnifiedRecentUpdates.ts", usageLocations: [] },
  { hookFile: "useUsageStatistics.js", hookName: "useUsageStatistics", targetLocation: "shared/lib/hooks/useUsageStatistics.ts", usageLocations: ["features\\subscription\\ui\\individual\\MySubscription.jsx", "pages\\subscription\\MySubscription.jsx"] },
  { hookFile: "useVideoSummarizer.ts", hookName: "useVideoSummarizer", targetLocation: "shared/lib/hooks/useVideoSummarizer.ts", usageLocations: ["hooks\\useVideoSummarizer.ts"] }
];

function migrateSharedHooks() {
  console.log('🚀 Starting shared hooks migration...\n');
  
  let movedCount = 0;
  let skippedCount = 0;
  
  for (const hook of sharedHooks) {
    const sourcePath = path.join('src', 'hooks', hook.hookFile);
    const targetPath = path.join('src', hook.targetLocation);
    
    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      console.log(`⚠️  Source not found: ${sourcePath}`);
      skippedCount++;
      continue;
    }
    
    // Check if target already exists
    if (fs.existsSync(targetPath)) {
      console.log(`✓ Already exists: ${targetPath}`);
      skippedCount++;
      continue;
    }
    
    // Read source file
    const content = fs.readFileSync(sourcePath, 'utf-8');
    
    // Write to target
    fs.writeFileSync(targetPath, content, 'utf-8');
    console.log(`✓ Moved: ${hook.hookFile} -> ${targetPath}`);
    movedCount++;
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Moved: ${movedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total: ${sharedHooks.length}`);
}

migrateSharedHooks();
