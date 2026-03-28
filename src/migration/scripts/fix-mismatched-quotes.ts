import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

async function fixMismatchedQuotes() {
  console.log('🔍 Finding files with mismatched quotes in imports...\n');

  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
  });

  let totalFixed = 0;
  const fixedFiles: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let modified = content;
    let fileFixed = false;

    // Fix: from '@... ending with '
    modified = modified.replace(/from '@([^'"]*?)"/g, (match, p1) => {
      fileFixed = true;
      return `from '@${p1}'`;
    });

    // Fix: from "@... ending with "
    modified = modified.replace(/from "@([^""]*?)'/g, (match, p1) => {
      fileFixed = true;
      return `from "@${p1}"`;
    });

    if (fileFixed) {
      fs.writeFileSync(file, modified, 'utf-8');
      fixedFiles.push(file);
      totalFixed++;
      console.log(`✅ Fixed: ${file}`);
    }
  }

  console.log(`\n✨ Fixed ${totalFixed} files with mismatched quotes`);
  
  if (fixedFiles.length > 0) {
    console.log('\nFixed files:');
    fixedFiles.forEach(f => console.log(`  - ${f}`));
  }
}

fixMismatchedQuotes().catch(console.error);
