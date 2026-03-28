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

function findUnmigratedFiles() {
  console.log('Scanning backup directory...');
  const backupFiles = getAllFiles(backupDir);
  console.log(`Found ${backupFiles.length} files in backup\n`);
  
  const unmigrated = [];
  const migrated = [];
  const migratedToFSD = [];
  
  for (const file of backupFiles) {
    // Skip metadata files
    if (file === 'metadata.json') continue;
    
    const srcPath = path.join(srcDir, file);
    
    if (!fs.existsSync(srcPath)) {
      unmigrated.push(file);
      
      // Check if file exists in FSD structure
      const fileName = path.basename(file);
      const possibleLocations = [
        path.join(srcDir, 'features'),
        path.join(srcDir, 'entities'),
        path.join(srcDir, 'shared'),
        path.join(srcDir, 'widgets'),
        path.join(srcDir, 'app')
      ];
      
      let foundInFSD = false;
      for (const location of possibleLocations) {
        if (fs.existsSync(location)) {
          const fsdFiles = getAllFiles(location);
          if (fsdFiles.some(f => path.basename(f) === fileName)) {
            foundInFSD = true;
            migratedToFSD.push({ original: file, fsdLocation: location });
            break;
          }
        }
      }
      
      if (!foundInFSD) {
        // File truly doesn't exist anywhere
      }
    } else {
      migrated.push(file);
    }
  }
  
  console.log('=== FILES NOT IN ORIGINAL LOCATION ===');
  console.log(`Total: ${unmigrated.length}\n`);
  
  console.log('=== FILES FOUND IN FSD STRUCTURE ===');
  console.log(`Total: ${migratedToFSD.length}\n`);
  for (const item of migratedToFSD.slice(0, 20)) {
    console.log(`  ${item.original} → ${path.basename(item.fsdLocation)}/`);
  }
  if (migratedToFSD.length > 20) {
    console.log(`  ... and ${migratedToFSD.length - 20} more`);
  }
  
  const trulyMissing = unmigrated.length - migratedToFSD.length;
  
  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Still in original location: ${migrated.length}`);
  console.log(`Migrated to FSD structure: ${migratedToFSD.length}`);
  console.log(`Truly missing (not found anywhere): ${trulyMissing}`);
  console.log(`Total backup files: ${backupFiles.length - 1}`); // -1 for metadata.json
  
  if (trulyMissing > 0) {
    console.log(`\n⚠️  WARNING: ${trulyMissing} files are missing from both original and FSD locations!`);
  } else if (migratedToFSD.length > 0) {
    console.log(`\n✅ All files have been migrated to FSD structure!`);
  }
}

findUnmigratedFiles();
