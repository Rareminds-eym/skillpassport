#!/usr/bin/env tsx
import * as fs from 'fs';
import { glob } from 'glob';

async function fixPublicApiViolations() {
  console.log('🔧 Fixing public API violations...\n');
  
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/migration/**']
  });
  
  let fixed = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    
    // Fix widget imports
    content = content.replace(/@\/widgets\/([^\/]+)\/ui\/([^'"]+)/g, (match, widget, component) => {
      modified = true;
      return `@/widgets/${widget}`;
    });
    
    content = content.replace(/@\/widgets\/([^\/]+)\/model\/([^'"]+)/g, (match, widget, component) => {
      modified = true;
      return `@/widgets/${widget}`;
    });
    
    // Fix feature imports
    content = content.replace(/@\/features\/([^\/]+)\/ui\/([^'"]+)/g, (match, feature, component) => {
      modified = true;
      return `@/features/${feature}`;
    });
    
    content = content.replace(/@\/features\/([^\/]+)\/model\/([^'"]+)/g, (match, feature, component) => {
      modified = true;
      return `@/features/${feature}`;
    });
    
    content = content.replace(/@\/features\/([^\/]+)\/api\/([^'"]+)/g, (match, feature, component) => {
      modified = true;
      return `@/features/${feature}`;
    });
    
    content = content.replace(/@\/features\/([^\/]+)\/lib\/([^'"]+)/g, (match, feature, component) => {
      modified = true;
      return `@/features/${feature}`;
    });
    
    // Fix entity imports
    content = content.replace(/@\/entities\/([^\/]+)\/ui\/([^'"]+)/g, (match, entity, component) => {
      modified = true;
      return `@/entities/${entity}`;
    });
    
    content = content.replace(/@\/entities\/([^\/]+)\/model\/([^'"]+)/g, (match, entity, component) => {
      modified = true;
      return `@/entities/${entity}`;
    });
    
    content = content.replace(/@\/entities\/([^\/]+)\/api\/([^'"]+)/g, (match, entity, component) => {
      modified = true;
      return `@/entities/${entity}`;
    });
    
    if (modified) {
      fs.writeFileSync(file, content);
      fixed++;
      console.log(`✅ ${file}`);
    }
  }
  
  console.log(`\n✨ Fixed ${fixed} files with public API violations`);
}

fixPublicApiViolations().catch(console.error);
