import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Script to extract supabase.auth() calls from pages
 * Replaces direct supabase.auth calls with authSessionService imports
 */

interface Replacement {
  file: string;
  oldPattern: RegExp;
  newImport: string;
  newCode: string;
}

const replacements: Replacement[] = [
  {
    file: '',
    oldPattern: /await supabase\.auth\.getUser\(\)/g,
    newImport: "import { authSessionService } from '@/features/auth';",
    newCode: 'await authSessionService.getUser()',
  },
  {
    file: '',
    oldPattern: /await supabase\.auth\.getSession\(\)/g,
    newImport: "import { authSessionService } from '@/features/auth';",
    newCode: 'await authSessionService.getSession()',
  },
  {
    file: '',
    oldPattern: /supabase\.auth\.onAuthStateChange/g,
    newImport: "import { authSessionService } from '@/features/auth';",
    newCode: 'authSessionService.onAuthStateChange',
  },
  {
    file: '',
    oldPattern: /await supabase\.auth\.signInWithPassword\(/g,
    newImport: "import { authSessionService } from '@/features/auth';",
    newCode: 'await authSessionService.signInWithPassword(',
  },
  {
    file: '',
    oldPattern: /await supabase\.auth\.admin\.listUsers\(\)/g,
    newImport: "import { authSessionService } from '@/features/auth';",
    newCode: 'await authSessionService.listUsers()',
  },
];

async function extractAuthCalls() {
  console.log('🔍 Finding page files with supabase.auth calls...\n');

  const pageFiles = await glob('src/pages/**/*.{jsx,tsx}', {
    ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'],
  });

  let totalFiles = 0;
  let totalReplacements = 0;

  for (const file of pageFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    let fileReplacements = 0;

    // Check if file has any supabase.auth calls
    if (!content.includes('supabase.auth')) {
      continue;
    }

    // Track which imports we need
    const neededImports = new Set<string>();

    // Apply replacements
    for (const replacement of replacements) {
      if (replacement.oldPattern.test(content)) {
        const matches = content.match(replacement.oldPattern);
        if (matches) {
          content = content.replace(replacement.oldPattern, replacement.newCode);
          neededImports.add(replacement.newImport);
          fileReplacements += matches.length;
          modified = true;
        }
      }
    }

    if (modified) {
      // Add import if not already present
      for (const importStatement of neededImports) {
        if (!content.includes("from '@/features/auth'")) {
          // Find the last import statement
          const importRegex = /import\s+.*?from\s+['"].*?['"];?\n/g;
          const imports = content.match(importRegex);
          
          if (imports && imports.length > 0) {
            const lastImport = imports[imports.length - 1];
            const lastImportIndex = content.lastIndexOf(lastImport);
            const insertPosition = lastImportIndex + lastImport.length;
            
            content = 
              content.slice(0, insertPosition) +
              importStatement + '\n' +
              content.slice(insertPosition);
          } else {
            // No imports found, add at the beginning
            content = importStatement + '\n\n' + content;
          }
        }
      }

      // Write the updated content
      fs.writeFileSync(file, content, 'utf-8');
      
      console.log(`✅ ${file}`);
      console.log(`   Replaced ${fileReplacements} auth call(s)\n`);
      
      totalFiles++;
      totalReplacements += fileReplacements;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Files updated: ${totalFiles}`);
  console.log(`   Total replacements: ${totalReplacements}`);
}

// Run the script
extractAuthCalls().catch(console.error);
