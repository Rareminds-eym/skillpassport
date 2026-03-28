import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface VerificationResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
}

async function verifyEntityMigration(): Promise<void> {
  const results: VerificationResult[] = [];

  // 1. Check entity directories exist
  const entities = ['organization', 'user', 'student'];
  for (const entity of entities) {
    const apiPath = `src/entities/${entity}/api`;
    if (fs.existsSync(apiPath)) {
      const files = fs.readdirSync(apiPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
      results.push({
        category: 'Entity Structure',
        status: 'pass',
        message: `${entity} entity has ${files.length} service files`,
        details: files
      });
    } else {
      results.push({
        category: 'Entity Structure',
        status: 'fail',
        message: `${entity} entity api directory missing`
      });
    }
  }

  // 2. Check for remaining @/services/ imports in entities
  const entityFiles = await glob('src/entities/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/__tests__/**']
  });

  const servicesImports: string[] = [];
  for (const file of entityFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('@/services/')) {
      servicesImports.push(file);
    }
  }

  if (servicesImports.length === 0) {
    results.push({
      category: 'Layer Violations',
      status: 'pass',
      message: 'No @/services/ imports found in entities layer'
    });
  } else {
    results.push({
      category: 'Layer Violations',
      status: 'fail',
      message: `Found ${servicesImports.length} files with @/services/ imports`,
      details: servicesImports
    });
  }

  // 3. Check for features/ imports in entities
  const featuresImports: string[] = [];
  for (const file of entityFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('@/features/')) {
      featuresImports.push(file);
    }
  }

  if (featuresImports.length === 0) {
    results.push({
      category: 'Layer Violations',
      status: 'pass',
      message: 'No @/features/ imports found in entities layer'
    });
  } else {
    results.push({
      category: 'Layer Violations',
      status: 'fail',
      message: `Found ${featuresImports.length} files with @/features/ imports`,
      details: featuresImports
    });
  }

  // 4. Check entity public APIs
  for (const entity of entities) {
    const indexPath = `src/entities/${entity}/index.ts`;
    const apiIndexPath = `src/entities/${entity}/api/index.ts`;
    
    if (fs.existsSync(indexPath) && fs.existsSync(apiIndexPath)) {
      results.push({
        category: 'Public APIs',
        status: 'pass',
        message: `${entity} entity has public API exports`
      });
    } else {
      results.push({
        category: 'Public APIs',
        status: 'warning',
        message: `${entity} entity missing index files`
      });
    }
  }

  // 5. Check for old service files
  const oldServicePaths = [
    'src/services/organizationService.ts',
    'src/services/permissionService.ts',
    'src/services/roleLookupService.ts',
    'src/services/userApiService.ts',
    'src/services/userManagementService.ts',
    'src/services/userSettingsService.js',
    'src/services/studentActivityService.js',
    'src/services/studentClassService.ts',
    'src/services/studentEnrollmentService.ts',
    'src/services/studentExamService.ts',
    'src/services/studentManagementService.ts',
    'src/services/studentService.ts',
    'src/services/studentSettingsService.js'
  ];

  const remainingOldFiles = oldServicePaths.filter(p => fs.existsSync(p));
  if (remainingOldFiles.length === 0) {
    results.push({
      category: 'Cleanup',
      status: 'pass',
      message: 'All old service files have been migrated'
    });
  } else {
    results.push({
      category: 'Cleanup',
      status: 'warning',
      message: `${remainingOldFiles.length} old service files still exist`,
      details: remainingOldFiles
    });
  }

  // Print results
  console.log('\n=== Entity Services Migration Verification ===\n');
  
  const grouped = results.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, VerificationResult[]>);

  for (const [category, categoryResults] of Object.entries(grouped)) {
    console.log(`\n${category}:`);
    for (const result of categoryResults) {
      const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠';
      console.log(`  ${icon} ${result.message}`);
      if (result.details && result.details.length > 0) {
        result.details.forEach(detail => console.log(`    - ${detail}`));
      }
    }
  }

  // Summary
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Warnings: ${warnings}`);
  console.log(`Total: ${results.length}`);

  if (failed === 0) {
    console.log('\n✓ Entity services migration verification complete!');
  } else {
    console.log('\n✗ Migration has issues that need to be addressed.');
  }
}

verifyEntityMigration().catch(console.error);
