import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ServiceClassification {
  servicePath: string;
  serviceName: string;
  targetLayer: string;
  targetDomain: string;
  targetPath: string;
  confidence: string;
  reasoning: string;
}

interface ImportUpdate {
  file: string;
  oldImport: string;
  newImport: string;
  line: number;
}

/**
 * Updates all imports across the codebase to reference migrated services
 */
async function updateServiceImports() {
  console.log('Updating service imports across codebase...\n');

  // Load classification data
  const classificationPath = path.join(process.cwd(), 'src/migration/reports/service-classification.json');
  const classifications: ServiceClassification[] = JSON.parse(
    fs.readFileSync(classificationPath, 'utf-8')
  );

  // Filter for feature services only
  const featureServices = classifications.filter(c => c.targetLayer === 'features');

  // Build import mapping
  const importMap = buildImportMap(featureServices);
  console.log(`Built import map for ${Object.keys(importMap).length} services\n`);

  // Find all TypeScript/JavaScript files
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*']
  });

  console.log(`Scanning ${files.length} files for import updates...\n`);

  let totalUpdates = 0;
  const updates: ImportUpdate[] = [];

  for (const file of files) {
    const fileUpdates = await updateImportsInFile(file, importMap);
    updates.push(...fileUpdates);
    totalUpdates += fileUpdates.length;
    
    if (fileUpdates.length > 0) {
      console.log(`✓ ${file}: ${fileUpdates.length} imports updated`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Import Update Summary:');
  console.log(`  Files scanned: ${files.length}`);
  console.log(`  Total imports updated: ${totalUpdates}`);
  console.log(`${'='.repeat(60)}\n`);

  // Save update log
  const logPath = path.join(process.cwd(), 'src/migration/reports/import-updates.json');
  fs.writeFileSync(logPath, JSON.stringify(updates, null, 2));
  console.log(`Update log saved to: ${logPath}`);

  return updates;
}

/**
 * Builds a map of old import paths to new feature paths
 */
function buildImportMap(services: ServiceClassification[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const service of services) {
    const serviceName = service.serviceName;
    const domain = service.targetDomain;
    
    // Map various import patterns
    map[`@/services/${serviceName}`] = `@/features/${domain}`;
    map[`../services/${serviceName}`] = `@/features/${domain}`;
    map[`../../services/${serviceName}`] = `@/features/${domain}`;
    map[`../../../services/${serviceName}`] = `@/features/${domain}`;
    
    // Handle subdirectory services (e.g., services/college/*)
    if (service.servicePath.includes('\\college\\')) {
      const fileName = path.basename(service.servicePath, path.extname(service.servicePath));
      map[`@/services/college/${fileName}`] = `@/features/${domain}`;
      map[`../services/college/${fileName}`] = `@/features/${domain}`;
    }
    
    if (service.servicePath.includes('\\educator\\')) {
      const fileName = path.basename(service.servicePath, path.extname(service.servicePath));
      map[`@/services/educator/${fileName}`] = `@/features/${domain}`;
      map[`../services/educator/${fileName}`] = `@/features/${domain}`;
    }
    
    if (service.servicePath.includes('\\courseRecommendation\\')) {
      const fileName = path.basename(service.servicePath, path.extname(service.servicePath));
      map[`@/services/courseRecommendation/${fileName}`] = `@/features/${domain}`;
      map[`../services/courseRecommendation/${fileName}`] = `@/features/${domain}`;
    }
  }

  return map;
}

/**
 * Updates imports in a single file
 */
async function updateImportsInFile(
  filePath: string,
  importMap: Record<string, string>
): Promise<ImportUpdate[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const updates: ImportUpdate[] = [];
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match import statements
    const importMatch = line.match(/from\s+['"]([^'"]+)['"]/);
    if (!importMatch) continue;

    const importPath = importMatch[1];
    
    // Check if this import needs updating
    for (const [oldPath, newPath] of Object.entries(importMap)) {
      if (importPath === oldPath || importPath.startsWith(oldPath + '/')) {
        const newImportPath = importPath.replace(oldPath, newPath);
        const newLine = line.replace(importPath, newImportPath);
        
        updates.push({
          file: filePath,
          oldImport: importPath,
          newImport: newImportPath,
          line: i + 1
        });
        
        lines[i] = newLine;
        modified = true;
        break;
      }
    }
  }

  // Write back if modified
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
  }

  return updates;
}

// Run update
updateServiceImports().catch(console.error);
