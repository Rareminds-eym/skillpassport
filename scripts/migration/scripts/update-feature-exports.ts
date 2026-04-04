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

/**
 * Updates feature index.ts files to export migrated services
 */
async function updateFeatureExports() {
  console.log('Updating feature public API exports...\n');

  // Load classification data
  const classificationPath = path.join(process.cwd(), 'src/migration/reports/service-classification.json');
  const classifications: ServiceClassification[] = JSON.parse(
    fs.readFileSync(classificationPath, 'utf-8')
  );

  // Group feature services by domain
  const featureServices = classifications.filter(c => c.targetLayer === 'features');
  const byDomain = featureServices.reduce((acc, service) => {
    if (!acc[service.targetDomain]) {
      acc[service.targetDomain] = [];
    }
    acc[service.targetDomain].push(service);
    return acc;
  }, {} as Record<string, ServiceClassification[]>);

  console.log('Updating exports for features:');
  Object.keys(byDomain).forEach(domain => {
    console.log(`  - ${domain}: ${byDomain[domain].length} services`);
  });
  console.log('');

  // Update each feature's index.ts
  for (const [domain, services] of Object.entries(byDomain)) {
    await updateFeatureIndex(domain, services);
  }

  console.log('\n✓ All feature exports updated');
}

/**
 * Updates a single feature's index.ts to export its services
 */
async function updateFeatureIndex(domain: string, services: ServiceClassification[]) {
  const featurePath = path.join(process.cwd(), `src/features/${domain}`);
  const indexPath = path.join(featurePath, 'index.ts');
  const apiIndexPath = path.join(featurePath, 'api/index.ts');

  // Create api/index.ts if it doesn't exist
  if (!fs.existsSync(apiIndexPath)) {
    const apiDir = path.dirname(apiIndexPath);
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }

    // Generate api/index.ts exports
    const apiExports = services
      .map(s => {
        const fileName = path.basename(s.targetPath, path.extname(s.targetPath));
        return `export * from './${fileName}';`;
      })
      .join('\n');

    fs.writeFileSync(apiIndexPath, apiExports + '\n');
    console.log(`  ✓ Created ${domain}/api/index.ts`);
  } else {
    // Append to existing api/index.ts
    let content = fs.readFileSync(apiIndexPath, 'utf-8');
    
    for (const service of services) {
      const fileName = path.basename(service.targetPath, path.extname(service.targetPath));
      const exportLine = `export * from './${fileName}';`;
      
      if (!content.includes(exportLine)) {
        content += exportLine + '\n';
      }
    }
    
    fs.writeFileSync(apiIndexPath, content);
    console.log(`  ✓ Updated ${domain}/api/index.ts`);
  }

  // Update feature root index.ts
  if (!fs.existsSync(indexPath)) {
    const rootExports = [
      `// UI Components`,
      `export * from './ui';`,
      ``,
      `// Business Logic & State`,
      `export * from './model';`,
      ``,
      `// API & Data Access`,
      `export * from './api';`,
      ``
    ].join('\n');

    fs.writeFileSync(indexPath, rootExports);
    console.log(`  ✓ Created ${domain}/index.ts`);
  } else {
    // Ensure api exports are included
    let content = fs.readFileSync(indexPath, 'utf-8');
    
    if (!content.includes("export * from './api'")) {
      content += `\n// API & Data Access\nexport * from './api';\n`;
      fs.writeFileSync(indexPath, content);
      console.log(`  ✓ Updated ${domain}/index.ts`);
    }
  }
}

// Run update
updateFeatureExports().catch(console.error);
