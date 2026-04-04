import * as path from 'path';

// Import the class properly
const { BusinessLogicDetector } = await import('../analysis/BusinessLogicDetector.js');

const pagesDir = path.join(process.cwd(), 'src/pages');

console.log('=== Detecting Business Logic in Pages ===\n');
console.log(`Scanning directory: ${pagesDir}\n`);

const detector = new BusinessLogicDetector();
const results = detector.detectInDirectory(pagesDir);

console.log(detector.generateReport(results));

// Exit with error code if violations found
if (results.length > 0) {
  console.log('\n⚠️  Business logic violations detected in page components!');
  process.exit(1);
} else {
  console.log('\n✓ No business logic violations found!');
  process.exit(0);
}
