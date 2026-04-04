import fs from 'fs';
import path from 'path';

interface ServiceClassification {
  servicePath: string;
  serviceName: string;
  targetLayer: string;
  targetDomain: string;
  targetPath: string;
  confidence: string;
  reasoning: string;
}

interface MigrationResult {
  success: boolean;
  servicePath: string;
  targetPath: string;
  error?: string;
}

/**
 * Migrates feature-specific services from src/services/ to features/{feature}/api/
 */
async function migrateFeatureServices() {
  console.log('Starting feature service migration...\n');

  // Load classification data
  const classificationPath = path.join(process.cwd(), 'src/migration/reports/service-classification.json');
  const classifications: ServiceClassification[] = JSON.parse(
    fs.readFileSync(classificationPath, 'utf-8')
  );

  // Filter for feature-specific services only
  const featureServices = classifications.filter(c => c.targetLayer === 'features');
  
  console.log(`Found ${featureServices.length} feature-specific services to migrate\n`);

  // Group by feature domain
  const byDomain = featureServices.reduce((acc, service) => {
    if (!acc[service.targetDomain]) {
      acc[service.targetDomain] = [];
    }
    acc[service.targetDomain].push(service);
    return acc;
  }, {} as Record<string, ServiceClassification[]>);

  console.log('Services by domain:');
  Object.entries(byDomain).forEach(([domain, services]) => {
    console.log(`  ${domain}: ${services.length} services`);
  });
  console.log('');

  const results: MigrationResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Migrate each service
  for (const service of featureServices) {
    try {
      const result = await migrateService(service);
      results.push(result);
      
      if (result.success) {
        successCount++;
        console.log(`✓ ${service.serviceName} → ${service.targetDomain}/api/`);
      } else {
        errorCount++;
        console.error(`✗ ${service.serviceName}: ${result.error}`);
      }
    } catch (error) {
      errorCount++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push({
        success: false,
        servicePath: service.servicePath,
        targetPath: service.targetPath,
        error: errorMsg
      });
      console.error(`✗ ${service.serviceName}: ${errorMsg}`);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('Migration Summary:');
  console.log(`  Total services: ${featureServices.length}`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${errorCount}`);
  console.log(`${'='.repeat(60)}\n`);

  // Save results
  const resultsPath = path.join(process.cwd(), 'src/migration/reports/service-migration-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${resultsPath}`);

  return results;
}

/**
 * Migrates a single service file
 */
async function migrateService(service: ServiceClassification): Promise<MigrationResult> {
  const sourcePath = path.join(process.cwd(), service.servicePath.replace(/\\/g, '/'));
  const targetPath = path.join(process.cwd(), service.targetPath);

  // Check if source exists
  if (!fs.existsSync(sourcePath)) {
    return {
      success: false,
      servicePath: service.servicePath,
      targetPath: service.targetPath,
      error: 'Source file not found'
    };
  }

  // Check if target already exists
  if (fs.existsSync(targetPath)) {
    return {
      success: false,
      servicePath: service.servicePath,
      targetPath: service.targetPath,
      error: 'Target file already exists'
    };
  }

  // Create target directory
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Read source content
  const content = fs.readFileSync(sourcePath, 'utf-8');

  // Update imports in the content
  const updatedContent = updateImportsInContent(content, service);

  // Write to target
  fs.writeFileSync(targetPath, updatedContent);

  // Delete source file
  fs.unlinkSync(sourcePath);

  return {
    success: true,
    servicePath: service.servicePath,
    targetPath: service.targetPath
  };
}

/**
 * Updates import paths within service file content
 */
function updateImportsInContent(content: string, service: ServiceClassification): string {
  let updated = content;

  // Update relative imports from services/ to stay within api/
  // e.g., from '@/shared/api/otherService' to './otherService'
  updated = updated.replace(
    /from ['"]\.\.\/services\/([^'"]+)['"]/g,
    "from './$1'"
  );

  // Update imports from services/ subdirectories
  updated = updated.replace(
    /from ['"]\.\.\/\.\.\/services\/([^'"]+)['"]/g,
    "from './$1'"
  );

  // Update absolute imports from @/services/ to relative
  updated = updated.replace(
    /from ['"]@\/services\/([^'"]+)['"]/g,
    "from './$1'"
  );

  // Update shared API imports
  updated = updated.replace(
    /from ['"]@\/services\/([^'"]+)['"]/g,
    "from '@/shared/api/$1'"
  );

  return updated;
}

// Run migration
migrateFeatureServices().catch(console.error);
