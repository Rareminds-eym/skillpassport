#!/usr/bin/env tsx
/**
 * Migrate Config Imports
 * 
 * Migrates logging config to shared/config/ and updates imports.
 */

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

async function migrateConfigImports(): Promise<void> {
  console.log('🔧 Migrating config imports...\n');

  // 1. Ensure logging.ts is in shared/config/
  const sourceConfig = 'src/config/logging.ts';
  const targetConfig = 'src/shared/config/logging.ts';

  if (fs.existsSync(sourceConfig) && !fs.existsSync(targetConfig)) {
    const targetDir = path.dirname(targetConfig);
    fs.mkdirSync(targetDir, { recursive: true });
    
    const content = fs.readFileSync(sourceConfig, 'utf-8');
    fs.writeFileSync(targetConfig, content);
    console.log(`✅ Copied: ${sourceConfig} → ${targetConfig}`);
  }

  // 2. Update all imports from @/config/logging to @/shared/config/logging
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/migration/**']
  });

  let filesUpdated = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;

    // Replace @/config/logging with @/shared/config/logging
    content = content.replace(
      /from ['"]@\/config\/logging['"]/g,
      "from '@/shared/config/logging'"
    );

    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      filesUpdated++;
      console.log(`✅ Updated: ${file}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Config Migration Summary:`);
  console.log(`   📝 Files updated: ${filesUpdated}`);
  console.log('\n✨ Config migration complete!');
}

migrateConfigImports().catch(console.error);
