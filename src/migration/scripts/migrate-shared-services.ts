import * as fs from 'fs';
import * as path from 'path';

interface ServiceClassification {
  servicePath: string;
  serviceName: string;
  targetLayer: string;
  targetDomain: string;
  targetPath: string;
  confidence: string;
  reasoning: string;
}

const SHARED_SERVICES = [
  'addOnAnalyticsService',
  'addOnCatalogService',
  'addOnPaymentService',
  'adminNotificationService',
  'alertsService',
  'analyticsService',
  'authenticatedMediaService',
  'dashboardService',
  'fileService',
  'fileUploadService',
  'migrationNotificationService',
  'migrationService',
  'notificationService',
  'optimizedQueryService',
  'realtimeService',
  'recentUpdatesService',
  'settingsService',
  'skillsAnalyticsService',
  'storageApiService',
  'storageService',
  'streakApiService',
  'studentNotificationService',
  'usageStatisticsService'
];

async function migrateSharedServices() {
  console.log('Starting shared services migration...\n');

  // Read classification report
  const classificationPath = path.join(process.cwd(), 'src/migration/reports/service-classification.json');
  const classifications: ServiceClassification[] = JSON.parse(fs.readFileSync(classificationPath, 'utf-8'));

  // Filter shared services
  const sharedServices = classifications.filter(
    (service) => service.targetLayer === 'shared' && service.targetDomain === 'api'
  );

  console.log(`Found ${sharedServices.length} shared services to migrate\n`);

  const results = {
    migrated: [] as string[],
    skipped: [] as string[],
    errors: [] as { service: string; error: string }[]
  };

  // Ensure target directory exists
  const targetDir = path.join(process.cwd(), 'src/shared/api');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Created directory: ${targetDir}\n`);
  }

  for (const service of sharedServices) {
    const sourcePath = path.join(process.cwd(), service.servicePath.replace(/\\/g, '/'));
    const targetPath = path.join(process.cwd(), service.targetPath);

    console.log(`Migrating: ${service.serviceName}`);
    console.log(`  From: ${service.servicePath}`);
    console.log(`  To: ${service.targetPath}`);

    try {
      // Check if source exists
      if (!fs.existsSync(sourcePath)) {
        console.log(`  ⚠️  Source file not found, skipping\n`);
        results.skipped.push(service.serviceName);
        continue;
      }

      // Check if target already exists
      if (fs.existsSync(targetPath)) {
        console.log(`  ⚠️  Target already exists, skipping\n`);
        results.skipped.push(service.serviceName);
        continue;
      }

      // Read source content
      let content = fs.readFileSync(sourcePath, 'utf-8');

      // Convert .js to .ts if needed
      const isJsFile = sourcePath.endsWith('.js');
      if (isJsFile) {
        // Basic JS to TS conversion - add type annotations where obvious
        content = convertJsToTs(content);
      }

      // Update internal imports from @/services/ to @/shared/api/
      content = updateImports(content);

      // Write to target
      fs.writeFileSync(targetPath, content, 'utf-8');
      console.log(`  ✅ Migrated successfully\n`);
      results.migrated.push(service.serviceName);

    } catch (error) {
      console.log(`  ❌ Error: ${error}\n`);
      results.errors.push({
        service: service.serviceName,
        error: String(error)
      });
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Migrated: ${results.migrated.length}`);
  console.log(`⚠️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  console.log('='.repeat(60) + '\n');

  if (results.migrated.length > 0) {
    console.log('Migrated services:');
    results.migrated.forEach(s => console.log(`  - ${s}`));
    console.log();
  }

  if (results.skipped.length > 0) {
    console.log('Skipped services:');
    results.skipped.forEach(s => console.log(`  - ${s}`));
    console.log();
  }

  if (results.errors.length > 0) {
    console.log('Errors:');
    results.errors.forEach(e => console.log(`  - ${e.service}: ${e.error}`));
    console.log();
  }

  // Save results
  const resultsPath = path.join(process.cwd(), 'src/migration/reports/shared-services-migration.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Results saved to: ${resultsPath}\n`);

  return results;
}

function convertJsToTs(content: string): string {
  // Basic conversions - this is not comprehensive but handles common patterns
  let converted = content;

  // Add type to supabase imports if missing
  if (converted.includes('from \'@/shared/api/supabase\'') && !converted.includes('import type')) {
    converted = converted.replace(
      /import\s+{\s*supabase\s*}\s+from\s+'@\/shared\/api\/supabase'/g,
      'import { supabase } from \'@/shared/api/supabase\''
    );
  }

  return converted;
}

function updateImports(content: string): string {
  let updated = content;

  // Update imports from @/services/ to @/shared/api/ for other shared services
  SHARED_SERVICES.forEach(serviceName => {
    const patterns = [
      new RegExp(`from ['"]@/services/${serviceName}['"]`, 'g'),
      new RegExp(`from ['"]@/services/${serviceName}\\.js['"]`, 'g'),
      new RegExp(`from ['"]@/services/${serviceName}\\.ts['"]`, 'g'),
    ];

    patterns.forEach(pattern => {
      updated = updated.replace(pattern, `from '@/shared/api/${serviceName}'`);
    });
  });

  return updated;
}

// Run migration
migrateSharedServices().catch(console.error);
