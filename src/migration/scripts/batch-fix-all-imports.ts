import * as fs from 'fs';
import { glob } from 'glob';

interface BatchFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const batchFixes: BatchFix[] = [
  // Career assistant imports
  {
    pattern: /from ['"]@\/shared\/api\/careerWorkerService['"]/g,
    replacement: 'from "@/features/career-assistant/services/careerWorkerService"',
    description: 'Fix careerWorkerService imports'
  },
  {
    pattern: /from ['"]@\/shared\/lib\/hooks\/useCareerConversations['"]/g,
    replacement: 'from "@/features/career-assistant/hooks/useCareerConversations"',
    description: 'Fix useCareerConversations imports'
  },
  {
    pattern: /from ['"]@\/shared\/lib\/hooks\/useAIFeedback['"]/g,
    replacement: 'from "@/features/career-assistant/hooks/useAIFeedback"',
    description: 'Fix useAIFeedback imports'
  },
  // Educator copilot imports
  {
    pattern: /from ['"]@\/shared\/api\/educatorIntelligenceEngine['"]/g,
    replacement: 'from "@/features/educator-copilot/services/educatorIntelligenceEngine"',
    description: 'Fix educatorIntelligenceEngine imports'
  },
  {
    pattern: /from ['"]@\/shared\/config\/educatorConfig['"]/g,
    replacement: 'from "@/features/educator-copilot/config/educatorConfig"',
    description: 'Fix educatorConfig imports'
  },
  // File upload service
  {
    pattern: /from ['"]\.\/fileUploadService['"]/g,
    replacement: 'from "@/shared/api/fileUploadService"',
    description: 'Fix relative fileUploadService imports'
  },
  // Legacy supabase imports
  {
    pattern: /from ['"]\.\.\/\.\.\/lib\/supabaseClient['"]/g,
    replacement: 'from "@/shared/api/supabaseClient"',
    description: 'Fix relative supabaseClient imports (2 levels)'
  },
  {
    pattern: /from ['"]\.\.\/lib\/supabaseClient['"]/g,
    replacement: 'from "@/shared/api/supabaseClient"',
    description: 'Fix relative supabaseClient imports (1 level)'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/lib\/supabaseClient['"]/g,
    replacement: 'from "@/shared/api/supabaseClient"',
    description: 'Fix relative supabaseClient imports (3 levels)'
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
    
    for (const fix of batchFixes) {
      const matches = content.match(fix.pattern);
      if (matches && matches.length > 0) {
        content = content.replace(fix.pattern, fix.replacement);
        changes.push(`${fix.description} (${matches.length}x)`);
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
  console.log('🔧 Batch Fixing All Import Patterns\n');
  console.log('='.repeat(60));
  
  const files = await findAllSourceFiles();
  console.log(`\n📁 Scanning ${files.length} files\n`);
  
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
  
  console.log('='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Files scanned: ${files.length}`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(`   Total changes: ${totalChanges}`);
  
  if (fixedFiles.length > 0) {
    console.log('\n📝 Fixed files:');
    for (const { file, changes } of fixedFiles.slice(0, 15)) {
      console.log(`\n   ${file}`);
      for (const change of changes) {
        console.log(`      - ${change}`);
      }
    }
    if (fixedFiles.length > 15) {
      console.log(`\n   ... and ${fixedFiles.length - 15} more`);
    }
  }
  
  console.log('\n✅ Batch fix complete!');
}

main().catch(console.error);
