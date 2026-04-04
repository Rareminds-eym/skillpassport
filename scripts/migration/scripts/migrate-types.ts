import * as fs from 'fs';
import * as path from 'path';

const dryRun = process.argv.includes('--dry-run');

interface TypeMigration {
  source: string;
  target: string;
  reason: string;
}

const migrations: TypeMigration[] = [
  {
    source: 'src/types/student.ts',
    target: 'src/entities/student/model/types.ts',
    reason: 'Student entity types'
  },
  {
    source: 'src/types/Attendance.ts',
    target: 'src/features/college-admin/model/attendance-types.ts',
    reason: 'Attendance management feature types'
  },
  {
    source: 'src/types/StudentManagement.ts',
    target: 'src/features/school-admin/model/types.ts',
    reason: 'School admin feature types'
  },
  {
    source: 'src/types/recruiter.ts',
    target: 'src/entities/recruiter/model/types.ts',
    reason: 'Recruiter entity types'
  },
  {
    source: 'src/types/college.ts',
    target: 'src/features/college-admin/model/college-types.ts',
    reason: 'College admin feature types'
  },
  {
    source: 'src/types/adaptiveAptitude.ts',
    target: 'src/features/assessment/model/adaptive-aptitude-types.ts',
    reason: 'Assessment feature types'
  },
  {
    source: 'src/types/classSwap.ts',
    target: 'src/features/college-admin/model/class-swap-types.ts',
    reason: 'Class swap feature types'
  },
  {
    source: 'src/types/Permissions.ts',
    target: 'src/shared/types/permissions.ts',
    reason: 'Shared permission types'
  },
  {
    source: 'src/types/programs.ts',
    target: 'src/entities/program/model/types.ts',
    reason: 'Program entity types'
  },
  {
    source: 'src/types/project.ts',
    target: 'src/features/placement/model/project-types.ts',
    reason: 'Placement/project feature types'
  },
  {
    source: 'src/types/educator/course.ts',
    target: 'src/features/courses/model/course-types.ts',
    reason: 'Course feature types'
  }
];

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  Created directory: ${dirPath}`);
  }
}

function migrateType(migration: TypeMigration): boolean {
  const sourcePath = path.join(process.cwd(), migration.source);
  const targetPath = path.join(process.cwd(), migration.target);

  try {
    if (!fs.existsSync(sourcePath)) {
      console.log(`  ⚠️  Source not found: ${migration.source}`);
      return false;
    }

    if (fs.existsSync(targetPath)) {
      console.log(`  ⚠️  Target exists: ${migration.target}`);
      return false;
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would move: ${migration.source} → ${migration.target}`);
      return true;
    }

    const targetDir = path.dirname(targetPath);
    ensureDir(targetDir);

    fs.copyFileSync(sourcePath, targetPath);
    fs.unlinkSync(sourcePath);

    console.log(`  ✓ Migrated: ${migration.source} → ${migration.target}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed: ${migration.source}`, error);
    return false;
  }
}

console.log('=== Type Definitions Migration ===\n');
console.log(dryRun ? '[DRY RUN MODE]\n' : '');

let successful = 0;
let skipped = 0;
let failed = 0;

migrations.forEach(migration => {
  console.log(`\nMigrating: ${migration.source}`);
  console.log(`  Reason: ${migration.reason}`);
  
  const result = migrateType(migration);
  if (result) successful++;
  else skipped++;
});

console.log('\n=== Migration Summary ===');
console.log(`Total: ${migrations.length}`);
console.log(`Successful: ${successful}`);
console.log(`Skipped: ${skipped}`);
console.log(`Failed: ${failed}`);

console.log('\n✓ Type migration complete!');
console.log('\nNext steps:');
console.log('1. Update import paths using update-type-imports.ts');
console.log('2. Delete src/types/ directory');
console.log('3. Verify TypeScript compilation');
