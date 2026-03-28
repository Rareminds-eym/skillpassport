import * as fs from 'fs';
import * as path from 'path';

interface HookClassification {
  hookFile: string;
  hookName: string;
  classification: 'feature' | 'entity' | 'shared';
  targetLocation: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  imports: string[];
  usageCount: number;
  usageLocations: string[];
}

interface ClassificationReport {
  totalHooks: number;
  featureHooks: HookClassification[];
  entityHooks: HookClassification[];
  sharedHooks: HookClassification[];
  summary: {
    featureCount: number;
    entityCount: number;
    sharedCount: number;
  };
}

const HOOKS_DIR = path.join(process.cwd(), 'src/hooks');
const SRC_DIR = path.join(process.cwd(), 'src');

// Feature domains based on existing features
const FEATURE_DOMAINS = [
  'auth',
  'messaging',
  'courses',
  'student-profile',
  'subscription',
  'opportunities',
  'college-admin',
  'school-admin',
  'digital-portfolio',
  'ai-tutor',
  'counselling',
  'placement',
  'exams',
  'assessment',
  'educator',
  'analytics',
  'notifications',
  'broadcast',
];

// Entity domains
const ENTITY_DOMAINS = [
  'student',
  'user',
  'course',
  'organization',
  'opportunity',
  'department',
  'faculty',
  'application',
  'institution',
];

// Generic/shared hook patterns
const SHARED_PATTERNS = [
  'toast',
  'responsive',
  'validation',
  'offline',
  'session',
  'feature-gate',
  'realtime',
];

function getAllHookFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip test directories
        if (entry.name === '__tests__' || entry.name === 'node_modules') {
          continue;
        }
        traverse(fullPath);
      } else if (entry.isFile()) {
        // Include .ts, .tsx, .js, .jsx files that start with 'use'
        const ext = path.extname(entry.name);
        const basename = path.basename(entry.name, ext);
        
        if (
          (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') &&
          basename.startsWith('use') &&
          entry.name !== 'index.js' &&
          entry.name !== 'index.ts'
        ) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

function extractImports(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  } catch (error) {
    return [];
  }
}

function findUsageLocations(hookName: string): { count: number; locations: string[] } {
  const locations: string[] = [];
  let count = 0;
  
  function searchInDir(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (
            entry.name === 'node_modules' ||
            entry.name === '.git' ||
            entry.name === 'dist' ||
            entry.name === 'build'
          ) {
            continue;
          }
          searchInDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              // Look for hook usage (not just import)
              const usageRegex = new RegExp(`\\b${hookName}\\s*\\(`, 'g');
              const matches = content.match(usageRegex);
              
              if (matches && matches.length > 0) {
                count += matches.length;
                const relativePath = path.relative(SRC_DIR, fullPath);
                if (!locations.includes(relativePath)) {
                  locations.push(relativePath);
                }
              }
            } catch (error) {
              // Skip files that can't be read
            }
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  searchInDir(SRC_DIR);
  return { count, locations };
}

function classifyHook(hookFile: string): HookClassification {
  const relativePath = path.relative(HOOKS_DIR, hookFile);
  const fileName = path.basename(hookFile, path.extname(hookFile));
  const hookName = fileName;
  const imports = extractImports(hookFile);
  const { count: usageCount, locations: usageLocations } = findUsageLocations(hookName);
  
  // Determine classification based on multiple factors
  let classification: 'feature' | 'entity' | 'shared' = 'shared';
  let targetLocation = '';
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  let reasoning = '';
  
  const lowerName = hookName.toLowerCase();
  
  // Check for shared patterns first
  for (const pattern of SHARED_PATTERNS) {
    if (lowerName.includes(pattern)) {
      classification = 'shared';
      targetLocation = `shared/lib/hooks/${fileName}.ts`;
      confidence = 'high';
      reasoning = `Generic/reusable hook (pattern: ${pattern})`;
      return {
        hookFile: relativePath,
        hookName,
        classification,
        targetLocation,
        confidence,
        reasoning,
        imports,
        usageCount,
        usageLocations,
      };
    }
  }
  
  // Check for entity-specific hooks
  for (const entity of ENTITY_DOMAINS) {
    if (lowerName.includes(entity)) {
      classification = 'entity';
      targetLocation = `entities/${entity}/model/${fileName}.ts`;
      confidence = 'high';
      reasoning = `Entity-specific hook for ${entity}`;
      return {
        hookFile: relativePath,
        hookName,
        classification,
        targetLocation,
        confidence,
        reasoning,
        imports,
        usageCount,
        usageLocations,
      };
    }
  }
  
  // Check for feature-specific hooks
  for (const feature of FEATURE_DOMAINS) {
    if (lowerName.includes(feature)) {
      classification = 'feature';
      targetLocation = `features/${feature}/model/${fileName}.ts`;
      confidence = 'high';
      reasoning = `Feature-specific hook for ${feature}`;
      return {
        hookFile: relativePath,
        hookName,
        classification,
        targetLocation,
        confidence,
        reasoning,
        imports,
        usageCount,
        usageLocations,
      };
    }
  }
  
  // Check imports for clues
  const importStr = imports.join(' ');
  
  // Check for feature imports
  for (const feature of FEATURE_DOMAINS) {
    if (importStr.includes(`features/${feature}`) || importStr.includes(`@/features/${feature}`)) {
      classification = 'feature';
      targetLocation = `features/${feature}/model/${fileName}.ts`;
      confidence = 'medium';
      reasoning = `Imports from features/${feature}`;
      return {
        hookFile: relativePath,
        hookName,
        classification,
        targetLocation,
        confidence,
        reasoning,
        imports,
        usageCount,
        usageLocations,
      };
    }
  }
  
  // Check for entity imports
  for (const entity of ENTITY_DOMAINS) {
    if (importStr.includes(`entities/${entity}`) || importStr.includes(`@/entities/${entity}`)) {
      classification = 'entity';
      targetLocation = `entities/${entity}/model/${fileName}.ts`;
      confidence = 'medium';
      reasoning = `Imports from entities/${entity}`;
      return {
        hookFile: relativePath,
        hookName,
        classification,
        targetLocation,
        confidence,
        reasoning,
        imports,
        usageCount,
        usageLocations,
      };
    }
  }
  
  // Check usage locations for clues
  if (usageLocations.length > 0) {
    const locationStr = usageLocations.join(' ');
    
    // Check if used primarily in one feature
    for (const feature of FEATURE_DOMAINS) {
      const featureUsage = usageLocations.filter(loc => 
        loc.includes(`features/${feature}`) || loc.includes(`pages/${feature}`)
      );
      
      if (featureUsage.length > 0 && featureUsage.length >= usageLocations.length * 0.7) {
        classification = 'feature';
        targetLocation = `features/${feature}/model/${fileName}.ts`;
        confidence = 'medium';
        reasoning = `Used primarily in ${feature} (${featureUsage.length}/${usageLocations.length} locations)`;
        return {
          hookFile: relativePath,
          hookName,
          classification,
          targetLocation,
          confidence,
          reasoning,
          imports,
          usageCount,
          usageLocations,
        };
      }
    }
    
    // Check if used primarily with one entity
    for (const entity of ENTITY_DOMAINS) {
      const entityUsage = usageLocations.filter(loc => 
        loc.includes(`entities/${entity}`)
      );
      
      if (entityUsage.length > 0 && entityUsage.length >= usageLocations.length * 0.7) {
        classification = 'entity';
        targetLocation = `entities/${entity}/model/${fileName}.ts`;
        confidence = 'medium';
        reasoning = `Used primarily with ${entity} entity (${entityUsage.length}/${usageLocations.length} locations)`;
        return {
          hookFile: relativePath,
          hookName,
          classification,
          targetLocation,
          confidence,
          reasoning,
          imports,
          usageCount,
          usageLocations,
        };
      }
    }
  }
  
  // Default to shared if used in multiple places or unclear
  classification = 'shared';
  targetLocation = `shared/lib/hooks/${fileName}.ts`;
  confidence = 'low';
  reasoning = `Generic/reusable hook (used in ${usageLocations.length} locations, unclear domain)`;
  
  return {
    hookFile: relativePath,
    hookName,
    classification,
    targetLocation,
    confidence,
    reasoning,
    imports,
    usageCount,
    usageLocations,
  };
}

function generateReport(): ClassificationReport {
  console.log('Scanning hooks directory...');
  const hookFiles = getAllHookFiles(HOOKS_DIR);
  console.log(`Found ${hookFiles.length} hook files`);
  
  console.log('\nClassifying hooks...');
  const classifications: HookClassification[] = [];
  
  for (let i = 0; i < hookFiles.length; i++) {
    const hookFile = hookFiles[i];
    const relativePath = path.relative(HOOKS_DIR, hookFile);
    console.log(`[${i + 1}/${hookFiles.length}] Classifying ${relativePath}...`);
    
    const classification = classifyHook(hookFile);
    classifications.push(classification);
  }
  
  const featureHooks = classifications.filter(c => c.classification === 'feature');
  const entityHooks = classifications.filter(c => c.classification === 'entity');
  const sharedHooks = classifications.filter(c => c.classification === 'shared');
  
  return {
    totalHooks: classifications.length,
    featureHooks,
    entityHooks,
    sharedHooks,
    summary: {
      featureCount: featureHooks.length,
      entityCount: entityHooks.length,
      sharedCount: sharedHooks.length,
    },
  };
}

function printReport(report: ClassificationReport) {
  console.log('\n' + '='.repeat(80));
  console.log('HOOK CLASSIFICATION REPORT');
  console.log('='.repeat(80));
  console.log(`\nTotal Hooks: ${report.totalHooks}`);
  console.log(`  - Feature-specific: ${report.summary.featureCount}`);
  console.log(`  - Entity-specific: ${report.summary.entityCount}`);
  console.log(`  - Shared/Generic: ${report.summary.sharedCount}`);
  
  console.log('\n' + '-'.repeat(80));
  console.log('FEATURE-SPECIFIC HOOKS');
  console.log('-'.repeat(80));
  
  const featureGroups = new Map<string, HookClassification[]>();
  for (const hook of report.featureHooks) {
    const feature = hook.targetLocation.split('/')[1];
    if (!featureGroups.has(feature)) {
      featureGroups.set(feature, []);
    }
    featureGroups.get(feature)!.push(hook);
  }
  
  for (const [feature, hooks] of Array.from(featureGroups.entries()).sort()) {
    console.log(`\n${feature.toUpperCase()} (${hooks.length} hooks):`);
    for (const hook of hooks.sort((a, b) => a.hookName.localeCompare(b.hookName))) {
      console.log(`  ✓ ${hook.hookName}`);
      console.log(`    Source: src/hooks/${hook.hookFile}`);
      console.log(`    Target: src/${hook.targetLocation}`);
      console.log(`    Confidence: ${hook.confidence}`);
      console.log(`    Reasoning: ${hook.reasoning}`);
      console.log(`    Usage: ${hook.usageCount} calls in ${hook.usageLocations.length} files`);
    }
  }
  
  console.log('\n' + '-'.repeat(80));
  console.log('ENTITY-SPECIFIC HOOKS');
  console.log('-'.repeat(80));
  
  const entityGroups = new Map<string, HookClassification[]>();
  for (const hook of report.entityHooks) {
    const entity = hook.targetLocation.split('/')[1];
    if (!entityGroups.has(entity)) {
      entityGroups.set(entity, []);
    }
    entityGroups.get(entity)!.push(hook);
  }
  
  for (const [entity, hooks] of Array.from(entityGroups.entries()).sort()) {
    console.log(`\n${entity.toUpperCase()} (${hooks.length} hooks):`);
    for (const hook of hooks.sort((a, b) => a.hookName.localeCompare(b.hookName))) {
      console.log(`  ✓ ${hook.hookName}`);
      console.log(`    Source: src/hooks/${hook.hookFile}`);
      console.log(`    Target: src/${hook.targetLocation}`);
      console.log(`    Confidence: ${hook.confidence}`);
      console.log(`    Reasoning: ${hook.reasoning}`);
      console.log(`    Usage: ${hook.usageCount} calls in ${hook.usageLocations.length} files`);
    }
  }
  
  console.log('\n' + '-'.repeat(80));
  console.log('SHARED/GENERIC HOOKS');
  console.log('-'.repeat(80));
  
  for (const hook of report.sharedHooks.sort((a, b) => a.hookName.localeCompare(b.hookName))) {
    console.log(`\n✓ ${hook.hookName}`);
    console.log(`  Source: src/hooks/${hook.hookFile}`);
    console.log(`  Target: src/${hook.targetLocation}`);
    console.log(`  Confidence: ${hook.confidence}`);
    console.log(`  Reasoning: ${hook.reasoning}`);
    console.log(`  Usage: ${hook.usageCount} calls in ${hook.usageLocations.length} files`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('MIGRATION PLAN SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal hooks to migrate: ${report.totalHooks}`);
  console.log(`\nMigration targets:`);
  console.log(`  - features/*/model/: ${report.summary.featureCount} hooks`);
  console.log(`  - entities/*/model/: ${report.summary.entityCount} hooks`);
  console.log(`  - shared/lib/hooks/: ${report.summary.sharedCount} hooks`);
  
  console.log(`\nConfidence breakdown:`);
  const highConfidence = [...report.featureHooks, ...report.entityHooks, ...report.sharedHooks]
    .filter(h => h.confidence === 'high').length;
  const mediumConfidence = [...report.featureHooks, ...report.entityHooks, ...report.sharedHooks]
    .filter(h => h.confidence === 'medium').length;
  const lowConfidence = [...report.featureHooks, ...report.entityHooks, ...report.sharedHooks]
    .filter(h => h.confidence === 'low').length;
  
  console.log(`  - High confidence: ${highConfidence} hooks`);
  console.log(`  - Medium confidence: ${mediumConfidence} hooks`);
  console.log(`  - Low confidence: ${lowConfidence} hooks (require manual review)`);
  
  console.log('\n' + '='.repeat(80));
}

function saveReportToFile(report: ClassificationReport) {
  const outputPath = path.join(process.cwd(), 'src/migration/analysis/hook-classification-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${outputPath}`);
}

// Main execution
const report = generateReport();
printReport(report);
saveReportToFile(report);
