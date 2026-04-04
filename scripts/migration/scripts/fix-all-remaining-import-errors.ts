import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ImportFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const importFixes: ImportFix[] = [
  // Legacy utils imports
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/utils\/fileValidation['"]/g,
    replacement: 'from "@/shared/lib/fileValidation"',
    description: 'Fix fileValidation imports'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/utils\/fileValidation['"]/g,
    replacement: 'from "@/shared/lib/fileValidation"',
    description: 'Fix fileValidation imports (2 levels)'
  },
  {
    pattern: /from ['"]\.\.\/utils\/fileValidation['"]/g,
    replacement: 'from "@/shared/lib/fileValidation"',
    description: 'Fix fileValidation imports (1 level)'
  },
  // Legacy config imports
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/config\/fileSizeLimits['"]/g,
    replacement: 'from "@/shared/config/fileSizeLimits"',
    description: 'Fix fileSizeLimits imports'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/config\/fileSizeLimits['"]/g,
    replacement: 'from "@/shared/config/fileSizeLimits"',
    description: 'Fix fileSizeLimits imports (2 levels)'
  },
  {
    pattern: /from ['"]\.\.\/config\/fileSizeLimits['"]/g,
    replacement: 'from "@/shared/config/fileSizeLimits"',
    description: 'Fix fileSizeLimits imports (1 level)'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/config\/logging['"]/g,
    replacement: 'from "@/shared/config/logging"',
    description: 'Fix logging imports'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/config\/logging['"]/g,
    replacement: 'from "@/shared/config/logging"',
    description: 'Fix logging imports (2 levels)'
  },
  {
    pattern: /from ['"]\.\.\/config\/logging['"]/g,
    replacement: 'from "@/shared/config/logging"',
    description: 'Fix logging imports (1 level)'
  },
  // Legacy services imports
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/services\/([^'"]+)['"]/g,
    replacement: 'from "@/services/$1"',
    description: 'Fix services imports (3 levels)'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/services\/([^'"]+)['"]/g,
    replacement: 'from "@/services/$1"',
    description: 'Fix services imports (2 levels)'
  },
  {
    pattern: /from ['"]\.\.\/services\/([^'"]+)['"]/g,
    replacement: 'from "@/services/$1"',
    description: 'Fix services imports (1 level)'
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
  console.log('🔧 Fixing All Remaining Import Errors\n');
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
    for (const { file, changes } of fixedFiles) {
      console.log(`\n   ${file}`);
      for (const change of changes) {
        console.log(`      - ${change}`);
      }
    }
  }
  
  if (fixedCount === 0) {
    console.log('\n✅ No import errors found!');
  } else {
    console.log('\n✅ All import errors fixed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run build');
    console.log('   2. Check for any remaining errors');
  }
}

main().catch(console.error);
