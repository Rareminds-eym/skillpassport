import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { classifications } from './classify-utils';

const dryRun = process.argv.includes('--dry-run');

interface ImportMapping {
  oldPath: string;
  newPath: string;
  file: string;
}

// Generate import mappings
const importMappings: ImportMapping[] = classifications.map(c => {
  const fileName = c.file.replace(/\.(ts|js|jsx|tsx|d\.ts)$/, '');
  const fileNameClean = fileName.replace('__tests__/', '');
  
  return {
    oldPath: `@/utils/${fileName}`,
    newPath: c.targetPath.replace('src/', '@/').replace(/\.(ts|js|jsx|tsx|d\.ts)$/, ''),
    file: c.file
  };
});

console.log('=== Updating Import Paths ===\n');
console.log(dryRun ? '[DRY RUN MODE]\n' : '');

// Find all TypeScript/JavaScript files
function findSourceFiles(): string[] {
  try {
    const output = execSync(
      'git ls-files "src/**/*.{ts,tsx,js,jsx}" | grep -v node_modules | grep -v .test. | grep -v .spec.',
      { encoding: 'utf-8', cwd: process.cwd() }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding source files:', error);
    return [];
  }
}

// Update imports in a file
function updateImportsInFile(filePath: string): { updated: boolean; changes: number } {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { updated: false, changes: 0 };
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let changes = 0;
  const originalContent = content;
  
  // Update each import mapping
  for (const mapping of importMappings) {
    // Match various import patterns
    const patterns = [
      // import { x } from '@/utils/file'
      new RegExp(`from ['"]${mapping.oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
      // import('@/utils/file')
      new RegExp(`import\\(['"]${mapping.oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\)`, 'g'),
      // require('@/utils/file')
      new RegExp(`require\\(['"]${mapping.oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\)`, 'g'),
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        changes += matches.length;
        content = content.replace(pattern, (match) => {
          return match.replace(mapping.oldPath, mapping.newPath);
        });
      }
    });
  }
  
  if (content !== originalContent) {
    if (!dryRun) {
      fs.writeFileSync(fullPath, content, 'utf-8');
    }
    return { updated: true, changes };
  }
  
  return { updated: false, changes: 0 };
}

// Process all files
console.log('Finding source files...');
const sourceFiles = findSourceFiles();
console.log(`Found ${sourceFiles.length} source files\n`);

console.log('Updating imports...');
let filesUpdated = 0;
let totalChanges = 0;

sourceFiles.forEach((file, index) => {
  if (index % 100 === 0) {
    console.log(`  Progress: ${index}/${sourceFiles.length}`);
  }
  
  const result = updateImportsInFile(file);
  if (result.updated) {
    filesUpdated++;
    totalChanges += result.changes;
    console.log(`  ✓ Updated ${file} (${result.changes} imports)`);
  }
});

console.log('\n=== Import Update Summary ===');
console.log(`Files scanned: ${sourceFiles.length}`);
console.log(`Files updated: ${filesUpdated}`);
console.log(`Total import changes: ${totalChanges}`);

if (dryRun) {
  console.log('\n[DRY RUN] No files were actually modified');
} else {
  console.log('\n✓ Import paths updated!');
}

console.log('\nNext steps:');
console.log('1. Verify TypeScript compilation: npm run build');
console.log('2. Run tests: npm test');
console.log('3. Search for any remaining @/utils/ imports: git grep "@/utils/"');
