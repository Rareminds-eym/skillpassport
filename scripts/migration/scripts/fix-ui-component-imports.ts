import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ImportFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const importFixes: ImportFix[] = [
  // Shadcn UI components - fix incorrect paths
  {
    pattern: /from ['"]@\/shared\/ui\/Students\/components\/ui\/dialog['"]/g,
    replacement: 'from "@/shared/ui/dialog"',
    description: 'Fix dialog component import'
  },
  {
    pattern: /from ['"]@\/shared\/ui\/Students\/components\/ui\/([^'"]+)['"]/g,
    replacement: 'from "@/shared/ui/$1"',
    description: 'Fix shadcn UI component imports'
  },
  {
    pattern: /from ['"]@\/shared\/ui\/shared\/([^'"]+)['"]/g,
    replacement: 'from "@/shared/ui/$1"',
    description: 'Fix redundant /shared/ in UI imports'
  },
  // Recruiter components
  {
    pattern: /from ['"]@\/shared\/ui\/Recruiter\/components\/Toast['"]/g,
    replacement: 'from "@/features/recruiter"',
    description: 'Fix Toast component import'
  },
  {
    pattern: /from ['"]@\/shared\/ui\/Recruiter\/components\/([^'"]+)['"]/g,
    replacement: 'from "@/features/recruiter"',
    description: 'Fix recruiter component imports'
  },
  // Hook imports
  {
    pattern: /from ['"]@\/shared\/lib\/hooks\/useStudentCollegeLecturerMessages\.js['"]/g,
    replacement: 'from "@/features/messaging"',
    description: 'Fix messaging hook import'
  },
  {
    pattern: /from ['"]@\/shared\/lib\/hooks\/useCollegeLecturerMessages['"]/g,
    replacement: 'from "@/features/messaging"',
    description: 'Fix college lecturer messages hook'
  },
  // Test/mock data imports
  {
    pattern: /from ['"]@\/shared\/lib\/test\/mockData['"]/g,
    replacement: 'from "@/shared/lib/test/mockData"',
    description: 'Normalize mock data imports'
  },
  {
    pattern: /from ['"]@\/shared\/lib\/test\/mock\/([^'"]+)['"]/g,
    replacement: 'from "@/shared/lib/test/mock/$1"',
    description: 'Normalize test mock imports'
  },
  {
    pattern: /from ['"]@\/shared\/lib\/test\/sampleData['"]/g,
    replacement: 'from "@/shared/lib/test/sampleData"',
    description: 'Normalize sample data imports'
  },
  {
    pattern: /from ['"]@\/shared\/lib\/test\/educator\/([^'"]+)['"]/g,
    replacement: 'from "@/shared/lib/test/educator/$1"',
    description: 'Normalize educator test data imports'
  }
];

async function findAllSourceFiles(): Promise<string[]> {
  const patterns = [
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.js',
    'src/**/*.jsx'
  ];
  
  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.migration-backups/**',
        '**/build/**'
      ]
    });
    files.push(...matches);
  }
  
  return files;
}

function fixImportsInFile(filePath: string): { fixed: boolean; changes: string[] } {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    const changes: string[] = [];
    
    for (const fix of importFixes) {
      const matches = content.match(fix.pattern);
      if (matches && matches.length > 0) {
        content = content.replace(fix.pattern, fix.replacement);
        changes.push(`${fix.description} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
      }
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { fixed: true, changes };
    }
    
    return { fixed: false, changes: [] };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { fixed: false, changes: [] };
  }
}

async function main(): Promise<void> {
  console.log('🔧 Fixing All UI Component Import Errors\n');
  console.log('=' .repeat(60));
  
  const files = await findAllSourceFiles();
  console.log(`\n📁 Found ${files.length} source files to scan\n`);
  
  let fixedCount = 0;
  let totalChanges = 0;
  const fixedFiles: Array<{ file: string; changes: string[] }> = [];
  
  for (const file of files) {
    const result = fixImportsInFile(file);
    if (result.fixed) {
      fixedCount++;
      totalChanges += result.changes.length;
      fixedFiles.push({ file, changes: result.changes });
    }
  }
  
  console.log('=' .repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   ✓ Files scanned: ${files.length}`);
  console.log(`   ✓ Files fixed: ${fixedCount}`);
  console.log(`   ✓ Total changes: ${totalChanges}`);
  
  if (fixedFiles.length > 0) {
    console.log('\n📝 Fixed files:');
    for (const { file, changes } of fixedFiles.slice(0, 20)) {
      console.log(`\n   ${file}`);
      for (const change of changes) {
        console.log(`      - ${change}`);
      }
    }
    if (fixedFiles.length > 20) {
      console.log(`\n   ... and ${fixedFiles.length - 20} more files`);
    }
  }
  
  if (fixedCount === 0) {
    console.log('\n✅ No import errors found!');
  } else {
    console.log('\n✅ All import errors fixed!');
  }
}

main().catch(console.error);
