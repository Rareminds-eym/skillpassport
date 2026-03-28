const fs = require('fs');
const path = require('path');

// Read classification report
const report = JSON.parse(fs.readFileSync('scripts/classification-report.json', 'utf8'));

// Extract unique target directories
const targetDirs = new Set();

report.classifications.forEach(classification => {
  const targetPath = classification.targetFile;
  const dir = path.dirname(targetPath);
  
  // Add the directory and all parent directories
  let currentDir = dir;
  while (currentDir && currentDir !== '.' && currentDir !== 'src') {
    targetDirs.add(currentDir);
    currentDir = path.dirname(currentDir);
  }
});

// Convert to sorted array
const sortedDirs = Array.from(targetDirs).sort();

// Group by layer
const byLayer = {
  features: [],
  widgets: [],
  shared: [],
  entities: [],
  app: []
};

sortedDirs.forEach(dir => {
  if (dir.startsWith('src/features/')) {
    byLayer.features.push(dir);
  } else if (dir.startsWith('src/widgets/')) {
    byLayer.widgets.push(dir);
  } else if (dir.startsWith('src/shared/')) {
    byLayer.shared.push(dir);
  } else if (dir.startsWith('src/entities/')) {
    byLayer.entities.push(dir);
  } else if (dir.startsWith('src/app/')) {
    byLayer.app.push(dir);
  }
});

console.log('=== Target Directories to Create ===\n');
console.log(`Total unique directories: ${sortedDirs.length}\n`);

console.log('Features Layer:');
byLayer.features.forEach(dir => console.log(`  ${dir}`));

console.log('\nWidgets Layer:');
byLayer.widgets.forEach(dir => console.log(`  ${dir}`));

console.log('\nShared Layer:');
byLayer.shared.forEach(dir => console.log(`  ${dir}`));

console.log('\nEntities Layer:');
byLayer.entities.forEach(dir => console.log(`  ${dir}`));

console.log('\nApp Layer:');
byLayer.app.forEach(dir => console.log(`  ${dir}`));

// Write to file for next step
fs.writeFileSync('scripts/target-directories.json', JSON.stringify({
  total: sortedDirs.length,
  byLayer,
  allDirectories: sortedDirs
}, null, 2));

console.log('\n✓ Directory list saved to scripts/target-directories.json');
