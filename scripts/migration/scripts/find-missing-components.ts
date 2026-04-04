import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface MissingComponent {
  importPath: string;
  usedIn: string[];
  category: string;
}

async function findMissingComponents() {
  const srcFiles = await glob('src/**/*.{js,jsx,ts,tsx}', {
    ignore: ['**/node_modules/**', '**/.migration-backups/**']
  });

  const missingComponents = new Map<string, MissingComponent>();

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Match imports from old components directory
    const importRegex = /from\s+['"](\.\.\/)+components\/([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[2];
      const category = importPath.split('/')[0];
      
      if (!missingComponents.has(importPath)) {
        missingComponents.set(importPath, {
          importPath,
          usedIn: [],
          category
        });
      }
      
      missingComponents.get(importPath)!.usedIn.push(file);
    }
  }

  // Group by category
  const byCategory = new Map<string, MissingComponent[]>();
  
  for (const component of missingComponents.values()) {
    if (!byCategory.has(component.category)) {
      byCategory.set(component.category, []);
    }
    byCategory.get(component.category)!.push(component);
  }

  console.log('\n=== Missing Components by Category ===\n');
  
  for (const [category, components] of Array.from(byCategory.entries()).sort()) {
    console.log(`\n${category}/ (${components.length} components):`);
    for (const comp of components.sort((a, b) => a.importPath.localeCompare(b.importPath))) {
      console.log(`  - ${comp.importPath} (used in ${comp.usedIn.length} files)`);
    }
  }

  console.log(`\n\nTotal: ${missingComponents.size} missing component imports`);
  console.log(`Categories: ${byCategory.size}`);
}

findMissingComponents().catch(console.error);
