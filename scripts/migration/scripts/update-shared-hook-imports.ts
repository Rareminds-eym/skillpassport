import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface HookImportMapping {
  hookName: string;
  oldPaths: string[];
  newPath: string;
}

const hookMappings: HookImportMapping[] = [
  { hookName: 'useToast', oldPaths: ['@/hooks/use-toast', '../hooks/use-toast', '../../hooks/use-toast', '../../../hooks/use-toast'], newPath: '@/shared/lib/hooks' },
  { hookName: 'toast', oldPaths: ['@/hooks/use-toast', '../hooks/use-toast', '../../hooks/use-toast', '../../../hooks/use-toast'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useAdaptiveAptitude', oldPaths: ['@/hooks/useAdaptiveAptitude', '../hooks/useAdaptiveAptitude', '../../hooks/useAdaptiveAptitude', '../../../hooks/useAdaptiveAptitude'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useAddOnCatalog', oldPaths: ['@/hooks/useAddOnCatalog', '../hooks/useAddOnCatalog', '../../hooks/useAddOnCatalog', '../../../hooks/useAddOnCatalog'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useAntiCheating', oldPaths: ['@/hooks/useAntiCheating', '../hooks/useAntiCheating', '../../hooks/useAntiCheating', '../../../hooks/useAntiCheating'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useCurrentPromotional', oldPaths: ['@/hooks/useCurrentPromotional', '../hooks/useCurrentPromotional', '../../hooks/useCurrentPromotional', '../../../hooks/useCurrentPromotional'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useFormValidation', oldPaths: ['@/hooks/useFormValidation', '../hooks/useFormValidation', '../../hooks/useFormValidation', '../../../hooks/useFormValidation'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useLessonPlans', oldPaths: ['@/hooks/useLessonPlans', '../hooks/useLessonPlans', '../../hooks/useLessonPlans', '../../../hooks/useLessonPlans'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useMentorAllocation', oldPaths: ['@/hooks/useMentorAllocation', '../hooks/useMentorAllocation', '../../hooks/useMentorAllocation', '../../../hooks/useMentorAllocation'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useMockApi', oldPaths: ['@/hooks/educator/useMockApi', '../hooks/educator/useMockApi', '../../hooks/educator/useMockApi', '../../../hooks/educator/useMockApi'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useOffers', oldPaths: ['@/hooks/useOffers', '../hooks/useOffers', '../../hooks/useOffers', '../../../hooks/useOffers'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useOfflineSync', oldPaths: ['@/hooks/useOfflineSync', '../hooks/useOfflineSync', '../../hooks/useOfflineSync', '../../../hooks/useOfflineSync'], newPath: '@/shared/lib/hooks' },
  { hookName: 'usePaymentVerification', oldPaths: ['@/hooks/Subscription/usePaymentVerification', '../hooks/Subscription/usePaymentVerification', '../../hooks/Subscription/usePaymentVerification', '../../../hooks/Subscription/usePaymentVerification'], newPath: '@/shared/lib/hooks' },
  { hookName: 'usePermissions', oldPaths: ['@/hooks/usePermissions', '../hooks/usePermissions', '../../hooks/usePermissions', '../../../hooks/usePermissions'], newPath: '@/shared/lib/hooks' },
  { hookName: 'usePermission', oldPaths: ['@/hooks/usePermissions', '../hooks/usePermissions', '../../hooks/usePermissions', '../../../hooks/usePermissions'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useProfileCompletionPrompt', oldPaths: ['@/hooks/useProfileCompletionPrompt', '../hooks/useProfileCompletionPrompt', '../../hooks/useProfileCompletionPrompt', '../../../hooks/useProfileCompletionPrompt'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useProgramSections', oldPaths: ['@/hooks/useProgramSections', '../hooks/useProgramSections', '../../hooks/useProgramSections', '../../../hooks/useProgramSections'], newPath: '@/shared/lib/hooks' },
  { hookName: 'usePromotionalEvent', oldPaths: ['@/hooks/usePromotionalEvent', '../hooks/usePromotionalEvent', '../../hooks/usePromotionalEvent', '../../../hooks/usePromotionalEvent'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useRealtimeActivities', oldPaths: ['@/hooks/useRealtimeActivities', '../hooks/useRealtimeActivities', '../../hooks/useRealtimeActivities', '../../../hooks/useRealtimeActivities'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useRealtimePresence', oldPaths: ['@/hooks/useRealtimePresence', '../hooks/useRealtimePresence', '../../hooks/useRealtimePresence', '../../../hooks/useRealtimePresence'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useRealtimeProgress', oldPaths: ['@/hooks/useRealtimeProgress', '../hooks/useRealtimeProgress', '../../hooks/useRealtimeProgress', '../../../hooks/useRealtimeProgress'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useResponsive', oldPaths: ['@/hooks/useresponsive', '../hooks/useresponsive', '../../hooks/useresponsive', '../../../hooks/useresponsive'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useSessionRestore', oldPaths: ['@/hooks/useSessionRestore', '../hooks/useSessionRestore', '../../hooks/useSessionRestore', '../../../hooks/useSessionRestore'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useStudentRealtimeActivities', oldPaths: ['@/hooks/useStudentRealtimeActivities', '../hooks/useStudentRealtimeActivities', '../../hooks/useStudentRealtimeActivities', '../../../hooks/useStudentRealtimeActivities'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useTutorChat', oldPaths: ['@/hooks/useTutorChat', '../hooks/useTutorChat', '../../hooks/useTutorChat', '../../../hooks/useTutorChat'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useTypingIndicator', oldPaths: ['@/hooks/useTypingIndicator', '../hooks/useTypingIndicator', '../../hooks/useTypingIndicator', '../../../hooks/useTypingIndicator'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useUnifiedRecentUpdates', oldPaths: ['@/hooks/useUnifiedRecentUpdates', '../hooks/useUnifiedRecentUpdates', '../../hooks/useUnifiedRecentUpdates', '../../../hooks/useUnifiedRecentUpdates'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useUsageStatistics', oldPaths: ['@/hooks/useUsageStatistics', '../hooks/useUsageStatistics', '../../hooks/useUsageStatistics', '../../../hooks/useUsageStatistics'], newPath: '@/shared/lib/hooks' },
  { hookName: 'useVideoSummarizer', oldPaths: ['@/hooks/useVideoSummarizer', '../hooks/useVideoSummarizer', '../../hooks/useVideoSummarizer', '../../../hooks/useVideoSummarizer'], newPath: '@/shared/lib/hooks' }
];

async function updateImports() {
  console.log('🔄 Updating shared hook imports...\n');
  
  // Find all TypeScript/JavaScript files
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.migration-backups/**', '**/src/hooks/**']
  });
  
  let updatedFiles = 0;
  let totalReplacements = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    let fileReplacements = 0;
    
    // Check each hook mapping
    for (const mapping of hookMappings) {
      for (const oldPath of mapping.oldPaths) {
        // Match various import patterns
        const patterns = [
          // import { hook } from 'path'
          new RegExp(`from\\s+['"]${oldPath.replace(/\//g, '\\/')}['"]`, 'g'),
          // import hook from 'path'
          new RegExp(`from\\s+['"]${oldPath.replace(/\//g, '\\/')}['"]`, 'g'),
        ];
        
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            content = content.replace(pattern, `from '${mapping.newPath}'`);
            modified = true;
            fileReplacements++;
          }
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`✓ Updated ${fileReplacements} import(s) in: ${file}`);
      updatedFiles++;
      totalReplacements += fileReplacements;
    }
  }
  
  console.log(`\n✅ Import update complete!`);
  console.log(`   Files updated: ${updatedFiles}`);
  console.log(`   Total replacements: ${totalReplacements}`);
}

updateImports().catch(console.error);
