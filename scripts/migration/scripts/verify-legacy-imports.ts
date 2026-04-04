#!/usr/bin/env tsx
/**
 * Verify Legacy Imports
 * 
 * Scans the codebase for any remaining imports from legacy directories.
 * Must show zero imports before legacy directories can be safely deleted.
 */

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

interface LegacyImport {
  file: string;
  line: number;
  importStatement: string;
  legacyPath: string;
}

const LEGACY_PATHS = [
  '@/components/',
  '@/services/',
  '@/hooks/',
  '@/utils/',
  '@/types/',
  '@/config/',
  '@/lib/',
  '@/layouts/',
  '@/routes/',
  '@/providers/'
];

async function verifyLegacyImports(): Promise<void> {
  console.log('🔍 Scanning for legacy imports...\n');

  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*']
  });

  const legacyImports: LegacyImport[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Skip comment lines
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        return;
      }
      
      for (const legacyPath of LEGACY_PATHS) {
        if (line.includes(`from '${legacyPath}`) || line.includes(`from "${legacyPath}`)) {
          legacyImports.push({
            file,
            line: index + 1,
            importStatement: line.trim(),
            legacyPath
          });
        }
      }
    });
  }

  // Group by legacy path
  const grouped = LEGACY_PATHS.reduce((acc, path) => {
    acc[path] = legacyImports.filter(imp => imp.legacyPath === path);
    return acc;
  }, {} as Record<string, LegacyImport[]>);

  // Report results
  console.log('📊 Legacy Import Report\n');
  console.log('='.repeat(80));

  let totalImports = 0;
  for (const [legacyPath, imports] of Object.entries(grouped)) {
    if (imports.length > 0) {
      console.log(`\n${legacyPath}: ${imports.length} imports`);
      totalImports += imports.length;
      
      // Show first 5 examples
      imports.slice(0, 5).forEach(imp => {
        console.log(`  ${imp.file}:${imp.line}`);
        console.log(`    ${imp.importStatement}`);
      });
      
      if (imports.length > 5) {
        console.log(`  ... and ${imports.length - 5} more`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 Total legacy imports: ${totalImports}`);

  if (totalImports === 0) {
    console.log('\n✅ SUCCESS: Zero legacy imports found. Safe to delete legacy directories.');
  } else {
    console.log('\n❌ BLOCKED: Cannot delete legacy directories until all imports are migrated.');
    console.log('\nNext steps:');
    console.log('1. Run import update scripts for each legacy path');
    console.log('2. Re-run this verification');
    console.log('3. Only delete directories when this shows zero imports');
  }

  process.exit(totalImports === 0 ? 0 : 1);
}

verifyLegacyImports().catch(console.error);
