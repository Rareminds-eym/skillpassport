import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

async function fixKPICardImports() {
  console.log('🔍 Fixing KPICard imports...\n');

  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
  });

  let totalFixed = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    const modified = content.replace(
      /from ['"]@\/shared\/ui\/admin\/KPICard['"]/g,
      "from '@/shared/ui/KPICard'"
    );

    if (modified !== content) {
      fs.writeFileSync(file, modified, 'utf-8');
      totalFixed++;
      console.log(`✅ Fixed: ${file}`);
    }
  }

  console.log(`\n✨ Fixed ${totalFixed} files`);
}

fixKPICardImports().catch(console.error);
