/**
 * Feature Migration Validation Script
 * 
 * Validates that all features follow FSD structure:
 * - Have proper subdirectories (ui/, model/, api/, lib/)
 * - Have public API (index.ts)
 * - No legacy component imports remain
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface FeatureValidation {
  name: string;
  hasPublicApi: boolean;
  hasProperStructure: boolean;
  structureIssues: string[];
  legacyImports: LegacyImport[];
  status: 'compliant' | 'non-compliant' | 'partial';
}

interface LegacyImport {
  file: string;
  line: number;
  import: string;
}

const FEATURES_DIR = path.join(process.cwd(), 'src/features');
const VALID_FSD_DIRS = ['ui', 'model', 'api', 'lib', 'config', 'data', '__tests__'];
const LEGACY_IMPORT_PATTERNS = [
  /@\/components\//,
  /@\/services\//,
  /@\/hooks\//,
  /@\/utils\//,
  /@\/types\//,
  /@\/config\//,
  /@\/lib\//
];

async function validateFeature(featureName: string): Promise<FeatureValidation> {
  const featurePath = path.join(FEATURES_DIR, featureName);
  const validation: FeatureValidation = {
    name: featureName,
    hasPublicApi: false,
    hasProperStructure: false,
    structureIssues: [],
    legacyImports: [],
    status: 'compliant'
  };

  // Check for public API (index.ts)
  const indexPath = path.join(featurePath, 'index.ts');
  validation.hasPublicApi = fs.existsSync(indexPath);
  
  if (!validation.hasPublicApi) {
    validation.structureIssues.push('Missing index.ts public API');
    validation.status = 'non-compliant';
  }

  // Check directory structure
  const entries = fs.readdirSync(featurePath, { withFileTypes: true });
  const directories = entries.filter(e => e.isDirectory()).map(e => e.name);
  
  // Check for non-FSD directories
  const nonFsdDirs = directories.filter(dir => !VALID_FSD_DIRS.includes(dir));
  
  if (nonFsdDirs.length > 0) {
    validation.structureIssues.push(
      `Non-FSD directories found: ${nonFsdDirs.join(', ')}`
    );
    validation.hasProperStructure = false;
    validation.status = 'partial';
  } else {
    validation.hasProperStructure = true;
  }

  // Check for legacy imports
  const tsFiles = await glob(`${featurePath}/**/*.{ts,tsx,js,jsx}`, {
    ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*']
  });

  for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      for (const pattern of LEGACY_IMPORT_PATTERNS) {
        if (pattern.test(line) && line.includes('from')) {
          validation.legacyImports.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            import: line.trim()
          });
          
          if (validation.status === 'compliant') {
            validation.status = 'partial';
          }
        }
      }
    });
  }

  return validation;
}

async function validateAllFeatures(): Promise<void> {
  console.log('🔍 Validating Feature Migration...\n');
  
  const features = fs.readdirSync(FEATURES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  const validations: FeatureValidation[] = [];
  
  for (const feature of features) {
    const validation = await validateFeature(feature);
    validations.push(validation);
  }

  // Generate report
  const compliant = validations.filter(v => v.status === 'compliant');
  const partial = validations.filter(v => v.status === 'partial');
  const nonCompliant = validations.filter(v => v.status === 'non-compliant');

  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Features: ${validations.length}`);
  console.log(`✅ Fully Compliant: ${compliant.length}`);
  console.log(`⚠️  Partially Compliant: ${partial.length}`);
  console.log(`❌ Non-Compliant: ${nonCompliant.length}`);
  console.log('='.repeat(80));
  console.log();

  // Detailed report for non-compliant and partial features
  if (nonCompliant.length > 0) {
    console.log('❌ NON-COMPLIANT FEATURES:');
    console.log('-'.repeat(80));
    nonCompliant.forEach(v => {
      console.log(`\n${v.name}:`);
      v.structureIssues.forEach(issue => console.log(`  - ${issue}`));
    });
    console.log();
  }

  if (partial.length > 0) {
    console.log('⚠️  PARTIALLY COMPLIANT FEATURES:');
    console.log('-'.repeat(80));
    partial.forEach(v => {
      console.log(`\n${v.name}:`);
      
      if (v.structureIssues.length > 0) {
        console.log('  Structure Issues:');
        v.structureIssues.forEach(issue => console.log(`    - ${issue}`));
      }
      
      if (v.legacyImports.length > 0) {
        console.log(`  Legacy Imports (${v.legacyImports.length}):`);
        v.legacyImports.slice(0, 5).forEach(imp => {
          console.log(`    - ${imp.file}:${imp.line}`);
          console.log(`      ${imp.import}`);
        });
        if (v.legacyImports.length > 5) {
          console.log(`    ... and ${v.legacyImports.length - 5} more`);
        }
      }
    });
    console.log();
  }

  // Legacy imports summary
  const totalLegacyImports = validations.reduce((sum, v) => sum + v.legacyImports.length, 0);
  if (totalLegacyImports > 0) {
    console.log('📋 LEGACY IMPORTS BY PATTERN:');
    console.log('-'.repeat(80));
    
    const importsByPattern: Record<string, number> = {};
    validations.forEach(v => {
      v.legacyImports.forEach(imp => {
        const match = imp.import.match(/@\/(components|services|hooks|utils|types|config|lib)\//);
        if (match) {
          const pattern = `@/${match[1]}/`;
          importsByPattern[pattern] = (importsByPattern[pattern] || 0) + 1;
        }
      });
    });
    
    Object.entries(importsByPattern)
      .sort((a, b) => b[1] - a[1])
      .forEach(([pattern, count]) => {
        console.log(`  ${pattern}: ${count} imports`);
      });
    console.log();
  }

  // Exit with appropriate code
  if (nonCompliant.length > 0 || partial.length > 0) {
    console.log('⚠️  Feature migration validation found issues that need attention.');
    process.exit(1);
  } else {
    console.log('✅ All features are fully FSD compliant!');
    process.exit(0);
  }
}

// Run validation
validateAllFeatures().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
