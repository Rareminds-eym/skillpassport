const fs = require('fs');
const path = require('path');

// Read target directories
const targetDirs = JSON.parse(fs.readFileSync('scripts/target-directories.json', 'utf8'));

// Check which directories already exist
const existingDirs = [];
const missingDirs = [];

targetDirs.allDirectories.forEach(dir => {
  if (fs.existsSync(dir)) {
    existingDirs.push(dir);
  } else {
    missingDirs.push(dir);
  }
});

console.log('=== Directory Structure Analysis ===\n');
console.log(`Total directories needed: ${targetDirs.total}`);
console.log(`Already exist: ${existingDirs.length}`);
console.log(`Need to create: ${missingDirs.length}\n`);

if (missingDirs.length > 0) {
  console.log('Creating missing directories...\n');
  
  missingDirs.forEach(dir => {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created: ${dir}`);
    } catch (error) {
      console.error(`✗ Failed to create ${dir}: ${error.message}`);
    }
  });
  
  console.log(`\n✓ Created ${missingDirs.length} directories`);
} else {
  console.log('✓ All directories already exist');
}

// Verify all directories now exist
const verification = [];
targetDirs.allDirectories.forEach(dir => {
  verification.push({
    path: dir,
    exists: fs.existsSync(dir)
  });
});

const allExist = verification.every(v => v.exists);
console.log(`\n=== Verification ===`);
console.log(`All directories exist: ${allExist ? '✓ YES' : '✗ NO'}`);

if (!allExist) {
  console.log('\nMissing directories:');
  verification.filter(v => !v.exists).forEach(v => {
    console.log(`  ✗ ${v.path}`);
  });
}
