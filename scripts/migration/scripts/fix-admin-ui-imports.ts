import * as fs from 'fs';
import * as path from 'path';

interface ComponentMapping {
  backupPath: string;
  targetPath: string;
  description: string;
}

const BACKUP_BASE = '.migration-backups/legacy-final-backup-2026-03-23-173634/components/admin';

// Map of components to restore
const componentsToRestore: ComponentMapping[] = [
  // University Admin Components
  {
    backupPath: `${BACKUP_BASE}/universityAdmin/FeeStructureModal.tsx`,
    targetPath: 'src/shared/ui/admin/universityAdmin/FeeStructureModal.tsx',
    description: 'Fee Structure Modal for Finance page'
  },
  {
    backupPath: `${BACKUP_BASE}/universityAdmin/ResultsComponents.tsx`,
    targetPath: 'src/shared/ui/admin/universityAdmin/ResultsComponents.tsx',
    description: 'Results Components for Centralized Results page'
  },
  {
    backupPath: `${BACKUP_BASE}/universityAdmin/ResultsAnalytics.tsx`,
    targetPath: 'src/shared/ui/admin/universityAdmin/ResultsAnalytics.tsx',
    description: 'Results Analytics for Centralized Results page'
  },
  // Admin Modals
  {
    backupPath: `${BACKUP_BASE}/modals/FacultyDocumentViewerModal.tsx`,
    targetPath: 'src/shared/ui/admin/modals/FacultyDocumentViewerModal.tsx',
    description: 'Faculty Document Viewer Modal'
  },
  {
    backupPath: `${BACKUP_BASE}/modals/ClassManagementModals.tsx`,
    targetPath: 'src/shared/ui/admin/modals/ClassManagementModals.tsx',
    description: 'Class Management Modals'
  },
  {
    backupPath: `${BACKUP_BASE}/modals/DocumentViewerModal.tsx`,
    targetPath: 'src/shared/ui/admin/modals/DocumentViewerModal.tsx',
    description: 'Document Viewer Modal'
  }
];

function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
}

function copyFile(source: string, destination: string): boolean {
  try {
    if (!fs.existsSync(source)) {
      console.error(`✗ Source file not found: ${source}`);
      return false;
    }

    ensureDirectoryExists(destination);
    
    const content = fs.readFileSync(source, 'utf-8');
    fs.writeFileSync(destination, content, 'utf-8');
    
    console.log(`✓ Copied: ${path.basename(source)} -> ${destination}`);
    return true;
  } catch (error) {
    console.error(`✗ Error copying ${source}:`, error.message);
    return false;
  }
}

function main(): void {
  console.log('🔧 Restoring Admin UI Components from Backup\n');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let failCount = 0;

  for (const mapping of componentsToRestore) {
    console.log(`\n📦 ${mapping.description}`);
    console.log(`   Source: ${mapping.backupPath}`);
    console.log(`   Target: ${mapping.targetPath}`);
    
    if (copyFile(mapping.backupPath, mapping.targetPath)) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   ✓ Successfully restored: ${successCount} components`);
  console.log(`   ✗ Failed: ${failCount} components`);
  
  if (failCount === 0) {
    console.log('\n✅ All admin UI components restored successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run build');
    console.log('   2. Check for any remaining import errors');
  } else {
    console.log('\n⚠️  Some components failed to restore. Check the errors above.');
  }
}

main();
