import * as fs from 'fs';
import { glob } from 'glob';

async function fixButtonImports() {
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.migration-backups/**']
  });
  
  let fixed = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    const original = content;
    
    // Fix button imports
    content = content.replace(
      /from ['"]@\/shared\/ui\/Students\/components\/ui\/button['"]/g,
      'from "@/shared/ui/button"'
    );
    
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`✓ ${file}`);
      fixed++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} files`);
}

fixButtonImports();
