import * as fs from 'fs';
import { glob } from 'glob';

interface ImportFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const importFixes: ImportFix[] = [
  // Pagination - moved to shared/ui root
  {
    pattern: /from ['"]@\/shared\/ui\/admin\/Pagination['"]/g,
    replacement: `from '@/shared/ui'`,
    description: 'Pagination moved to shared/ui root'
  },
  
  // ConfirmModal - already in shared/ui root
  {
    pattern: /from ['"]@\/shared\/ui\/shared\/ConfirmModal['"]/g,
    replacement: `from '@/shared/ui'`,
    description: 'ConfirmModal in shared/ui root'
  },
  
  // Marketing components
  {
    pattern: /import\s+AboutRareMinds\s+from\s+['"]@\/shared\/ui\/marketing\/AboutRareMinds['"]/g,
    replacement: `import { AboutRareMinds } from '@/shared/ui/marketing'`,
    description: 'AboutRareMinds from marketing module'
  },
  
  // Subscription components
  {
    pattern: /from ['"]@\/shared\/ui\/Subscription\/SubscriptionSettingsSection['"]/g,
    replacement: `from '@/features/subscription'`,
    description: 'SubscriptionSettingsSection moved to subscription feature'
  },
  
  // Messaging components - likely moved to features/messaging
  {
    pattern: /from ['"]@\/shared\/ui\/messaging\/DeleteConversationModal['"]/g,
    replacement: `from '@/features/messaging'`,
    description: 'DeleteConversationModal moved to messaging feature'
  },
  {
    pattern: /from ['"]@\/shared\/ui\/messaging\/NewStudentConversationModal['"]/g,
    replacement: `from '@/features/messaging'`,
    description: 'NewStudentConversationModal moved to messaging feature'
  },
  {
    pattern: /from ['"]@\/shared\/ui\/messaging\/NewStudentConversationModalEducator\.jsx['"]/g,
    replacement: `from '@/features/messaging'`,
    description: 'NewStudentConversationModalEducator moved to messaging feature'
  },
  {
    pattern: /from ['"]@\/shared\/ui\/messaging\/NewStudentConversationModalCollegeAdmin['"]/g,
    replacement: `from '@/features/messaging'`,
    description: 'NewStudentConversationModalCollegeAdmin moved to messaging feature'
  },
  {
    pattern: /from ['"]@\/shared\/ui\/messaging\/NewEducatorAdminConversationModal['"]/g,
    replacement: `from '@/features/messaging'`,
    description: 'NewEducatorAdminConversationModal moved to messaging feature'
  },
  {
    pattern: /from ['"]@\/shared\/ui\/messaging\/NewSchoolAdminEducatorConversationModal['"]/g,
    replacement: `from '@/features/messaging'`,
    description: 'NewSchoolAdminEducatorConversationModal moved to messaging feature'
  }
];

async function fixImportsInFile(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixCount = 0;

  for (const fix of importFixes) {
    const matches = content.match(fix.pattern);
    if (matches) {
      content = content.replace(fix.pattern, fix.replacement);
      fixCount += matches.length;
      console.log(`  ✓ ${fix.description} in ${filePath}`);
    }
  }

  if (fixCount > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return fixCount;
}

async function main() {
  console.log('🔧 Fixing broken shared/ui imports...\n');

  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*']
  });

  let totalFixes = 0;

  for (const file of files) {
    const fixes = await fixImportsInFile(file);
    totalFixes += fixes;
  }

  console.log(`\n✅ Fixed ${totalFixes} imports across ${files.length} files`);
}

main().catch(console.error);
