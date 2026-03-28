import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupDir = path.join(__dirname, '..', '.migration-backups', 'legacy-final-backup-2026-03-23-173634');
const srcDir = path.join(__dirname, '..', 'src');

function getAllFiles(dir, baseDir = dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath);
      files.push(relativePath);
    }
  }
  
  return files;
}

function searchInFSD(fileName) {
  const fsdDirs = ['features', 'entities', 'shared', 'widgets', 'app', 'pages'];
  
  for (const dir of fsdDirs) {
    const fullPath = path.join(srcDir, dir);
    if (fs.existsSync(fullPath)) {
      const files = getAllFiles(fullPath);
      const found = files.find(f => path.basename(f) === fileName);
      if (found) {
        return { found: true, location: path.join(dir, found) };
      }
    }
  }
  
  return { found: false };
}

function findMissingFiles() {
  console.log('Analyzing backup files...\n');
  const backupFiles = getAllFiles(backupDir).filter(f => f !== 'metadata.json');
  
  const missing = [];
  const migrated = [];
  
  for (const file of backupFiles) {
    const fileName = path.basename(file);
    const result = searchInFSD(fileName);
    
    if (result.found) {
      migrated.push({ original: file, new: result.location });
    } else {
      missing.push(file);
    }
  }
  
  console.log('=== MISSING FILES (Not found in FSD structure) ===');
  console.log(`Total: ${missing.length}\n`);
  
  // Group by directory
  const grouped = {};
  for (const file of missing) {
    const dir = path.dirname(file);
    if (!grouped[dir]) {
      grouped[dir] = [];
    }
    grouped[dir].push(path.basename(file));
  }
  
  const sortedDirs = Object.keys(grouped).sort();
  
  for (const dir of sortedDirs) {
    console.log(`\n${dir}/`);
    grouped[dir].sort().forEach(file => {
      console.log(`  - ${file}`);
    });
  }
  
  console.log(`\n\n=== SUMMARY ===`);
  console.log(`✅ Migrated to FSD: ${migrated.length}`);
  console.log(`❌ Missing: ${missing.length}`);
  console.log(`📊 Total: ${backupFiles.length}`);
  console.log(`📈 Migration rate: ${((migrated.length / backupFiles.length) * 100).toFixed(1)}%`);
}

findMissingFiles();
