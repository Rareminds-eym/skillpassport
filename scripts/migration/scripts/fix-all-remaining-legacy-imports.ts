#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

function fixAllLegacyImports() {
  console.log('🔄 Fixing all remaining legacy imports...\n');
  
  const files = getAllFiles('src', /\.(jsx?|tsx?)$/);
  let fixed = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    
    // All legacy import patterns to fix
    const replacements: Array<[RegExp, string]> = [
      // Utils
      [/from ['"]\.\.\/\.\.\/\.\.\/utils\/helpers['"]/g, "from '@/shared/lib/utils/helpers'"],
      [/from ['"]\.\.\/\.\.\/utils\/helpers['"]/g, "from '@/shared/lib/utils/helpers'"],
      [/from ['"]\.\.\/utils\/helpers['"]/g, "from '@/shared/lib/utils/helpers'"],
      
      // Hooks
      [/from ['"]\.\.\/\.\.\/\.\.\/hooks\//g, "from '@/shared/lib/hooks/"],
      [/from ['"]\.\.\/\.\.\/hooks\//g, "from '@/shared/lib/hooks/"],
      [/from ['"]\.\.\/hooks\//g, "from '@/shared/lib/hooks/"],
      
      // Services
      [/from ['"]\.\.\/\.\.\/\.\.\/services\//g, "from '@/shared/api/"],
      [/from ['"]\.\.\/\.\.\/services\//g, "from '@/shared/api/"],
      [/from ['"]\.\.\/services\//g, "from '@/shared/api/"],
      
      // Types
      [/from ['"]\.\.\/\.\.\/\.\.\/types\//g, "from '@/shared/types/"],
      [/from ['"]\.\.\/\.\.\/types\//g, "from '@/shared/types/"],
      [/from ['"]\.\.\/types\//g, "from '@/shared/types/"],
      
      // Components - various depths
      [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/components\//g, "from '@/shared/ui/"],
      [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/components\//g, "from '@/shared/ui/"],
      [/from ['"]\.\.\/\.\.\/\.\.\/components\//g, "from '@/shared/ui/"],
      [/from ['"]\.\.\/\.\.\/components\//g, "from '@/shared/ui/"],
      [/from ['"]\.\.\/components\//g, "from '@/shared/ui/"],
      
      // Data
      [/from ['"]\.\.\/\.\.\/\.\.\/data\//g, "from '@/shared/lib/test/"],
      [/from ['"]\.\.\/\.\.\/data\//g, "from '@/shared/lib/test/"],
      [/from ['"]\.\.\/data\//g, "from '@/shared/lib/test/"],
    ];
    
    for (const [pattern, replacement] of replacements) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`✅ ${file}`);
      fixed++;
    }
  }
  
  console.log(`\n📊 Fixed ${fixed} files\n`);
}

function getAllFiles(dir: string, pattern: RegExp): string[] {
  const files: string[] = [];
  
  function walk(d: string) {
    if (!fs.existsSync(d)) return;
    
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
        walk(p);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(p);
      }
    }
  }
  
  walk(dir);
  return files;
}

fixAllLegacyImports();
