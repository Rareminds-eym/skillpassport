import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ImportFix {
  oldImport: string;
  newImport: string;
  description: string;
}

const importFixes: ImportFix[] = [
  // Educator modals that moved to college-admin feature
  {
    oldImport: `from '@/features/college-admin'`,
    newImport: `from '@/features/college-admin'`,
    description: 'EditStudentModal moved to college-admin feature'
  },
  {
    oldImport: `from '@/features/college-admin'`,
    newImport: `from '@/features/college-admin'`,
    description: 'DeleteStudentModal moved to college-admin feature'
  },
  {
    oldImport: `from '@/features/college-admin'`,
    newImport: `from '@/features/college-admin'`,
    description: 'BulkDeleteStudentsModal moved to college-admin feature'
  },
  {
    oldImport: `from '@/features/college-admin'`,
    newImport: `from '@/features/college-admin'`,
    description: 'ManageStudentsModal moved to college-admin feature'
  },
  {
    oldImport: `from '@/features/college-admin'`,
    newImport: `from '@/features/college-admin'`,
    description: 'ManageProgramStudentsModal moved to college-admin feature'
  },
  {
    oldImport: `from '@/features/college-admin'`,
    newImport: `from '@/features/college-admin'`,
    description: 'MentorResponseModal moved to college-admin feature'
  },
  {
    oldImport: `from '@/features/college-admin'`,
    newImport: `from '@/features/college-admin'`,
    description: 'AssignmentFileUpload moved to college-admin feature'
  },
  {
    oldImport: `from '@/features/college-admin'`,
    newImport: `from '@/features/college-admin'`,
    description: 'StudentSelectionModal already in college-admin feature'
  }
];

async function fixImportsInFile(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixCount = 0;

  for (const fix of importFixes) {
    if (content.includes(fix.oldImport)) {
      content = content.replace(new RegExp(fix.oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.newImport);
      fixCount++;
      console.log(`  ✓ Fixed: ${fix.description} in ${filePath}`);
    }
  }

  if (fixCount > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return fixCount;
}

async function main() {
  console.log('🔧 Fixing educator component imports...\n');

  // Find all TypeScript/JavaScript files in src/
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
