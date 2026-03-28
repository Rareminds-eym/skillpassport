import * as fs from 'fs';

interface ServiceClassification {
  servicePath: string;
  serviceName: string;
  targetLayer: 'features' | 'entities' | 'shared';
  targetDomain: string;
  targetPath: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface MigrationCatalog {
  summary: {
    totalServices: number;
    byLayer: {
      features: number;
      entities: number;
      shared: number;
    };
    byConfidence: {
      high: number;
      medium: number;
      low: number;
    };
  };
  featureServices: Record<string, ServiceClassification[]>;
  entityServices: Record<string, ServiceClassification[]>;
  sharedServices: ServiceClassification[];
  migrationPlan: {
    phase: string;
    targetDirectory: string;
    serviceCount: number;
    services: string[];
  }[];
}

function generateMigrationCatalog(): MigrationCatalog {
  const classificationPath = 'src/migration/reports/service-classification.json';
  const classifications: ServiceClassification[] = JSON.parse(
    fs.readFileSync(classificationPath, 'utf-8')
  );

  // Group by layer
  const features = classifications.filter(c => c.targetLayer === 'features');
  const entities = classifications.filter(c => c.targetLayer === 'entities');
  const shared = classifications.filter(c => c.targetLayer === 'shared');

  // Group features by domain
  const featuresByDomain: Record<string, ServiceClassification[]> = {};
  for (const service of features) {
    if (!featuresByDomain[service.targetDomain]) {
      featuresByDomain[service.targetDomain] = [];
    }
    featuresByDomain[service.targetDomain].push(service);
  }

  // Group entities by domain
  const entitiesByDomain: Record<string, ServiceClassification[]> = {};
  for (const service of entities) {
    if (!entitiesByDomain[service.targetDomain]) {
      entitiesByDomain[service.targetDomain] = [];
    }
    entitiesByDomain[service.targetDomain].push(service);
  }

  // Create migration plan (ordered by priority)
  const migrationPlan = [];

  // Phase 1: Shared infrastructure (used by all features)
  migrationPlan.push({
    phase: 'Phase 1: Shared Infrastructure',
    targetDirectory: 'shared/api/',
    serviceCount: shared.length,
    services: shared.map(s => s.serviceName).sort()
  });

  // Phase 2: Entity services (foundation for features)
  for (const [domain, services] of Object.entries(entitiesByDomain).sort()) {
    migrationPlan.push({
      phase: `Phase 2: Entity - ${domain}`,
      targetDirectory: `entities/${domain}/api/`,
      serviceCount: services.length,
      services: services.map(s => s.serviceName).sort()
    });
  }

  // Phase 3: Feature services (by size, largest first)
  const sortedFeatures = Object.entries(featuresByDomain)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [domain, services] of sortedFeatures) {
    migrationPlan.push({
      phase: `Phase 3: Feature - ${domain}`,
      targetDirectory: `features/${domain}/api/`,
      serviceCount: services.length,
      services: services.map(s => s.serviceName).sort()
    });
  }

  return {
    summary: {
      totalServices: classifications.length,
      byLayer: {
        features: features.length,
        entities: entities.length,
        shared: shared.length
      },
      byConfidence: {
        high: classifications.filter(c => c.confidence === 'high').length,
        medium: classifications.filter(c => c.confidence === 'medium').length,
        low: classifications.filter(c => c.confidence === 'low').length
      }
    },
    featureServices: featuresByDomain,
    entityServices: entitiesByDomain,
    sharedServices: shared,
    migrationPlan
  };
}

function main() {
  console.log('Generating migration catalog...');
  const catalog = generateMigrationCatalog();

  // Save catalog
  const outputPath = 'src/migration/reports/service-migration-catalog.json';
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));
  console.log(`Migration catalog saved to: ${outputPath}`);

  // Print summary
  console.log('\n=== Migration Catalog Summary ===');
  console.log(`Total Services: ${catalog.summary.totalServices}`);
  console.log(`\nBy Layer:`);
  console.log(`  Features: ${catalog.summary.byLayer.features}`);
  console.log(`  Entities: ${catalog.summary.byLayer.entities}`);
  console.log(`  Shared: ${catalog.summary.byLayer.shared}`);
  console.log(`\nBy Confidence:`);
  console.log(`  High: ${catalog.summary.byConfidence.high}`);
  console.log(`  Medium: ${catalog.summary.byConfidence.medium}`);
  console.log(`  Low: ${catalog.summary.byConfidence.low}`);

  console.log('\n=== Migration Plan (Phased Approach) ===');
  for (const phase of catalog.migrationPlan) {
    console.log(`\n${phase.phase}`);
    console.log(`  Target: ${phase.targetDirectory}`);
    console.log(`  Services: ${phase.serviceCount}`);
  }

  console.log('\n✓ Catalog generation complete');
}

main();
