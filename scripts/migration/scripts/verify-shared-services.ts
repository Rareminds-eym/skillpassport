// Quick verification that shared services are accessible through public API
import * as sharedApi from '../../shared/api/index.js';

const EXPECTED_SERVICES = [
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

console.log('Verifying shared services are exported through public API...\n');

let allFound = true;
const missing: string[] = [];

for (const serviceName of EXPECTED_SERVICES) {
  if (serviceName in sharedApi) {
    console.log(`✅ ${serviceName}`);
  } else {
    console.log(`❌ ${serviceName} - NOT FOUND`);
    missing.push(serviceName);
    allFound = false;
  }
}

console.log('\n' + '='.repeat(60));
if (allFound) {
  console.log('✅ All 23 shared services are accessible through @/shared/api');
} else {
  console.log(`❌ ${missing.length} services missing: ${missing.join(', ')}`);
}
console.log('='.repeat(60));
