import { ServiceClassifier } from '../analysis/ServiceClassifier';

async function main() {
  try {
    const classifier = new ServiceClassifier();
    console.log('Starting service classification...');
    const classifications = await classifier.classifyServices();
    console.log(`Classified ${classifications.length} services`);
    
    // Output summary to console
    const byLayer = {
      features: classifications.filter(c => c.targetLayer === 'features'),
      entities: classifications.filter(c => c.targetLayer === 'entities'),
      shared: classifications.filter(c => c.targetLayer === 'shared')
    };
    
    console.log('\n=== Classification Summary ===');
    console.log(`Total Services: ${classifications.length}`);
    console.log(`Features: ${byLayer.features.length}`);
    console.log(`Entities: ${byLayer.entities.length}`);
    console.log(`Shared: ${byLayer.shared.length}`);
    
    // Group by domain
    const byDomain = new Map<string, number>();
    for (const c of classifications) {
      byDomain.set(c.targetDomain, (byDomain.get(c.targetDomain) || 0) + 1);
    }
    
    console.log('\n=== By Domain ===');
    for (const [domain, count] of Array.from(byDomain.entries()).sort()) {
      console.log(`${domain}: ${count}`);
    }
    
    // Save JSON output
    const fs = await import('fs');
    const path = await import('path');
    
    const outputDir = 'src/migration/reports';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const jsonPath = path.join(outputDir, 'service-classification.json');
    fs.writeFileSync(jsonPath, JSON.stringify(classifications, null, 2));
    console.log(`\nClassification data saved to: ${jsonPath}`);
    
  } catch (error) {
    console.error('Error during classification:', error);
    process.exit(1);
  }
}

main();
