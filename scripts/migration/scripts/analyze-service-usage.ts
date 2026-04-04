import * as fs from 'fs';
import * as path from 'path';

interface ServiceClassification {
  servicePath: string;
  serviceName: string;
  targetLayer: 'features' | 'entities' | 'shared';
  targetDomain: string;
  targetPath: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

async function analyzeServiceUsage() {
  // Read classification data
  const classificationPath = 'src/migration/reports/service-classification.json';
  const classifications: ServiceClassification[] = JSON.parse(
    fs.readFileSync(classificationPath, 'utf-8')
  );

  console.log('=== Service Classification Analysis ===\n');
  console.log(`Total Services: ${classifications.length}\n`);

  // Group by layer
  const byLayer = {
    features: classifications.filter(c => c.targetLayer === 'features'),
    entities: classifications.filter(c => c.targetLayer === 'entities'),
    shared: classifications.filter(c => c.targetLayer === 'shared')
  };

  console.log('By Layer:');
  console.log(`  Features: ${byLayer.features.length}`);
  console.log(`  Entities: ${byLayer.entities.length}`);
  console.log(`  Shared: ${byLayer.shared.length}\n`);

  // Group by domain
  const byDomain = new Map<string, ServiceClassification[]>();
  for (const c of classifications) {
    if (!byDomain.has(c.targetDomain)) {
      byDomain.set(c.targetDomain, []);
    }
    byDomain.get(c.targetDomain)!.push(c);
  }

  console.log('By Domain:');
  for (const [domain, services] of Array.from(byDomain.entries()).sort()) {
    console.log(`  ${domain}: ${services.length} services`);
  }

  // Shared services (infrastructure)
  console.log('\n=== Shared Infrastructure Services (23) ===');
  const sharedServices = byLayer.shared;
  for (const service of sharedServices) {
    console.log(`  - ${service.serviceName}`);
  }

  // Top feature domains
  console.log('\n=== Top Feature Domains ===');
  const featureDomains = Array.from(byDomain.entries())
    .filter(([domain]) => domain !== 'api')
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  
  for (const [domain, services] of featureDomains) {
    console.log(`  ${domain}: ${services.length} services`);
  }

  // Confidence breakdown
  console.log('\n=== Confidence Levels ===');
  const byConfidence = {
    high: classifications.filter(c => c.confidence === 'high'),
    medium: classifications.filter(c => c.confidence === 'medium'),
    low: classifications.filter(c => c.confidence === 'low')
  };
  console.log(`  High: ${byConfidence.high.length}`);
  console.log(`  Medium: ${byConfidence.medium.length}`);
  console.log(`  Low: ${byConfidence.low.length}`);

  if (byConfidence.low.length > 0) {
    console.log('\n=== Low Confidence Services (Need Review) ===');
    for (const service of byConfidence.low) {
      console.log(`  - ${service.serviceName}`);
      console.log(`    Suggested: ${service.targetPath}`);
    }
  }

  // Migration summary
  console.log('\n=== Migration Plan Summary ===');
  console.log(`\nFeature Services (${byLayer.features.length}):`);
  const featuresByDomain = new Map<string, number>();
  for (const service of byLayer.features) {
    featuresByDomain.set(
      service.targetDomain,
      (featuresByDomain.get(service.targetDomain) || 0) + 1
    );
  }
  for (const [domain, count] of Array.from(featuresByDomain.entries()).sort()) {
    console.log(`  → features/${domain}/api/: ${count} services`);
  }

  console.log(`\nEntity Services (${byLayer.entities.length}):`);
  const entitiesByDomain = new Map<string, number>();
  for (const service of byLayer.entities) {
    entitiesByDomain.set(
      service.targetDomain,
      (entitiesByDomain.get(service.targetDomain) || 0) + 1
    );
  }
  for (const [domain, count] of Array.from(entitiesByDomain.entries()).sort()) {
    console.log(`  → entities/${domain}/api/: ${count} services`);
  }

  console.log(`\nShared Services (${byLayer.shared.length}):`);
  console.log(`  → shared/api/: ${byLayer.shared.length} services`);
}

analyzeServiceUsage().catch(console.error);
