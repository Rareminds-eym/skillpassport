import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

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

async function updateSharedServiceImports() {
  console.log('Updating imports for shared services...\n');

  // Find all TypeScript/JavaScript files
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.migration-backups/**',
      '**/migration/scripts/**'
    ]
  });

  console.log(`Found ${files.length} files to scan\n`);

  const results = {
    filesUpdated: [] as string[],
    totalReplacements: 0,
    replacementsByService: {} as Record<string, number>
  };

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let updated = false;
    let fileReplacements = 0;

    for (const serviceName of SHARED_SERVICES) {
      // Patterns to match
      const patterns = [
        {
          regex: new RegExp(`from ['"]@/services/${serviceName}['"]`, 'g'),
          replacement: `from '@/shared/api/${serviceName}'`
        },
        {
          regex: new RegExp(`from ['"]@/services/${serviceName}\\.js['"]`, 'g'),
          replacement: `from '@/shared/api/${serviceName}'`
        },
        {
          regex: new RegExp(`from ['"]@/services/${serviceName}\\.ts['"]`, 'g'),
          replacement: `from '@/shared/api/${serviceName}'`
        },
        {
          regex: new RegExp(`from ['"]\\.\\.?/services/${serviceName}['"]`, 'g'),
          replacement: `from '@/shared/api/${serviceName}'`
        },
        {
          regex: new RegExp(`from ['"]\\.\\.?/services/${serviceName}\\.js['"]`, 'g'),
          replacement: `from '@/shared/api/${serviceName}'`
        },
        {
          regex: new RegExp(`from ['"]\\.\\.?/services/${serviceName}\\.ts['"]`, 'g'),
          replacement: `from '@/shared/api/${serviceName}'`
        }
      ];

      for (const { regex, replacement } of patterns) {
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, replacement);
          updated = true;
          fileReplacements += matches.length;
          
          if (!results.replacementsByService[serviceName]) {
            results.replacementsByService[serviceName] = 0;
          }
          results.replacementsByService[serviceName] += matches.length;
        }
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf-8');
      results.filesUpdated.push(file);
      results.totalReplacements += fileReplacements;
      console.log(`✅ Updated: ${file} (${fileReplacements} replacements)`);
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files updated: ${results.filesUpdated.length}`);
  console.log(`Total replacements: ${results.totalReplacements}`);
  console.log('='.repeat(60) + '\n');

  if (Object.keys(results.replacementsByService).length > 0) {
    console.log('Replacements by service:');
    Object.entries(results.replacementsByService)
      .sort(([, a], [, b]) => b - a)
      .forEach(([service, count]) => {
        console.log(`  ${service}: ${count}`);
      });
    console.log();
  }

  // Save results
  const resultsPath = path.join(process.cwd(), 'src/migration/reports/shared-services-import-updates.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Results saved to: ${resultsPath}\n`);

  return results;
}

// Run update
updateSharedServiceImports().catch(console.error);
