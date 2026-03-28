#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

function fixSupabaseImports() {
  console.log('🔄 Fixing supabase imports...\n');
  
  const files = getAllFiles('src/pages', /\.(jsx?|tsx?)$/);
  let fixed = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Replace relative supabase imports with absolute
    const pattern = /from ['"]\.\.\/\.\.\/lib\/supabaseClient['"]/g;
    
    if (pattern.test(content)) {
      content = content.replace(pattern, "from '@/shared/api/supabaseClient'");
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
      if (entry.isDirectory()) {
        walk(p);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(p);
      }
    }
  }
  
  walk(dir);
  return files;
}

fixSupabaseImports();
