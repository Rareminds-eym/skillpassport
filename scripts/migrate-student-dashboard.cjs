const fs = require('fs');
const path = require('path');

const backupBase = '.migration-backups/legacy-final-backup-2026-03-23-173634/components/Students';

// Create target directories
const targetDirs = [
  'src/widgets/student-dashboard/ui',
  'src/widgets/student-dashboard/ui/settings',
  'src/widgets/student-dashboard/ui/modals',
  'src/widgets/student-dashboard/model',
  'src/shared/ui'
];

console.log('Creating target directories...');
targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  }
});

// Helper function to copy file
function copyFile(source, target) {
  const targetDir = path.dirname(target);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.copyFileSync(source, target);
  console.log(`Copied: ${source} -> ${target}`);
}

// Task 8.2: Migrate shadcn components to shared/ui
console.log('\n=== Task 8.2: Migrating shadcn components to shared/ui ===');
const shadcnDir = path.join(backupBase, 'components/ui');
if (fs.existsSync(shadcnDir)) {
  const shadcnFiles = fs.readdirSync(shadcnDir);
  shadcnFiles.forEach(file => {
    const source = path.join(shadcnDir, file);
    const target = path.join('src/shared/ui', file);
    if (fs.statSync(source).isFile()) {
      copyFile(source, target);
    }
  });
}

// Task 8.1: Migrate student dashboard components (excluding ui/)
console.log('\n=== Task 8.1: Migrating student dashboard components ===');
const componentsDir = path.join(backupBase, 'components');
if (fs.existsSync(componentsDir)) {
  const files = fs.readdirSync(componentsDir);
  files.forEach(file => {
    const source = path.join(componentsDir, file);
    // Skip ui/, SettingsTabs/, ProfileEditModals/, and __tests__ directories
    if (fs.statSync(source).isFile()) {
      const target = path.join('src/widgets/student-dashboard/ui', file);
      copyFile(source, target);
    }
  });
}

// Task 8.3: Migrate settings tabs
console.log('\n=== Task 8.3: Migrating settings tabs ===');
const settingsTabsDir = path.join(backupBase, 'components/SettingsTabs');
if (fs.existsSync(settingsTabsDir)) {
  const copyDirRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    entries.forEach(entry => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDirRecursive(srcPath, destPath);
      } else {
        copyFile(srcPath, destPath);
      }
    });
  };
  copyDirRecursive(settingsTabsDir, 'src/widgets/student-dashboard/ui/settings');
}

// Task 8.4: Migrate profile modals
console.log('\n=== Task 8.4: Migrating profile modals ===');
const profileModalsDir = path.join(backupBase, 'components/ProfileEditModals');
if (fs.existsSync(profileModalsDir)) {
  const files = fs.readdirSync(profileModalsDir);
  files.forEach(file => {
    const source = path.join(profileModalsDir, file);
    if (fs.statSync(source).isFile()) {
      const target = path.join('src/widgets/student-dashboard/ui/modals', file);
      copyFile(source, target);
    }
  });
}

// Task 8.5: Migrate mock data
console.log('\n=== Task 8.5: Migrating mock data ===');
const dataDir = path.join(backupBase, 'data');
if (fs.existsSync(dataDir)) {
  const files = fs.readdirSync(dataDir);
  files.forEach(file => {
    const source = path.join(dataDir, file);
    if (fs.statSync(source).isFile()) {
      const target = path.join('src/widgets/student-dashboard/model', file);
      copyFile(source, target);
    }
  });
}

console.log('\n=== Migration complete ===');
