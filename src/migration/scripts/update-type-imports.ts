import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const dryRun = process.argv.includes('--dry-run');

interface ImportMapping {
  old: string;
  new: string;
}

const importMappings: ImportMapping[] = [
  { old: '@/types/student', new: '@/entities/student/model/types' },
  { old: '@/types/Attendance', new: '@/features/college-admin/model/attendance-types' },
  { old: '@/types/StudentManagement', new: '@/features/school-admin/model/types' },
  { old: '@/types/recruiter', new: '@/entities/recruiter/model/types' },
  { old: '@/types/college', new: '@/features/college-admin/model/college-types' },
  { old: '@/types/adaptiveAptitude', new: '@/features/assessment/model/adaptive-aptitude-types' },
  { old: '@/types/classSwap', new: '@/features/college-admin/model/class-swap-types' },
  { old: '@/types/Permissions', new: '@/shared/types/permissions' },
  { old: '@/types/programs', new: '@/entities/program/model/types' },
  { old: '@/types/project', new: '@/features/placement/model/project-types' },
  { old: '@/types/educator/course', new: '@/features/courses/model/course-types' },
];

function findSourceFiles(): string[] {
  try {
    const output = execSync(
      'git ls-files "src/**/*.{ts,tsx,js,jsx}" | grep -v node_modules',
      { encoding: 'utf-8', cwd: process.cwd() }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding source files:', error);
    return [];
  }
}

function updateImportsInFile(filePath: string): { updated: boolean; changes: number } {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { updated: false, changes: 0 };
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let changes = 0;
  const originalContent = content;
  
  for (const mapping of importMappings) {
    const patterns = [
      new RegExp(`from ['"]${mapping.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
      new RegExp(`import\\(['"]${mapping.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\)`, 'g'),
      new RegExp(`require\\(['"]${mapping.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\)`, 'g'),
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        changes += matches.length;
        content = content.replace(pattern, (match) => {
          return match.replace(mapping.old, mapping.new);
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

console.log('=== Updating Type Import Paths ===\n');
console.log(dryRun ? '[DRY RUN MODE]\n' : '');

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
  console.log('\n[DRY RUN] No files were modified');
} else {
  console.log('\n✓ Import paths updated!');
}

console.log('\nNext steps:');
console.log('1. Delete src/types/ directory');
console.log('2. Verify TypeScript compilation: npm run build');
console.log('3. Search for remaining @/types/ imports: git grep "@/types/"');
