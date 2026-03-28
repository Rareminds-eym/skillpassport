#!/usr/bin/env tsx
import * as fs from 'fs';

function fixAllSupabaseImports() {
  console.log('🔄 Fixing all supabase imports...\n');
  
  const files = getAllFiles('src', /\.(jsx?|tsx?|ts|js)$/);
  let fixed = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    
    // Fix all variations of supabase imports
    const patterns = [
      /from ['"]\.\.\/\.\.\/\.\.\/lib\/supabaseClient['"]/g,
      /from ['"]\.\.\/\.\.\/lib\/supabaseClient['"]/g,
      /from ['"]\.\.\/lib\/supabaseClient['"]/g,
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, "from '@/shared/api/supabaseClient'");
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
      const p = `${d}/${entry.name}`;
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(p);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(p);
      }
    }
  }
  
  walk(dir);
  return files;
}

fixAllSupabaseImports();
