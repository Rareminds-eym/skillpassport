import * as fs from 'fs';
import * as path from 'path';

/**
 * Restore missing exam workflow components from backup
 */

const backupDir = '.migration-backups/backup-2026-03-21T08-40-21-393Z/components/exams/workflow';
const targetDir = 'src/shared/ui/exams/workflow';

const workflowComponents = [
  'ExamCreationStep.tsx',
  'TimetableStep.tsx',
  'InvigilationStep.tsx',
  'MarksEntryStep.tsx',
  'ModerationStep.tsx',
  'PublishingStep.tsx',
  'ResultsStep.tsx'
];

function restoreComponents() {
  // Create target directory if it doesn't exist
  const targetPath = path.resolve(process.cwd(), targetDir);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
    console.log(`✓ Created directory: ${targetDir}`);
  }
  
  let restored = 0;
  for (const component of workflowComponents) {
    const backupPath = path.resolve(process.cwd(), backupDir, component);
    const targetFilePath = path.join(targetPath, component);
    
    if (!fs.existsSync(backupPath)) {
      console.log(`⚠️  Backup not found: ${component}`);
      continue;
    }
    
    if (fs.existsSync(targetFilePath)) {
      console.log(`⏭️  Already exists: ${component}`);
      continue;
    }
    
    const content = fs.readFileSync(backupPath, 'utf-8');
    fs.writeFileSync(targetFilePath, content, 'utf-8');
    restored++;
    console.log(`✓ Restored: ${component}`);
  }
  
  console.log(`\n✅ Restored ${restored} workflow components`);
}

restoreComponents();
