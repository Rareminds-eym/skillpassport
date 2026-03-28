import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Fix all legacy supabase imports to use FSD-compliant paths
 * 
 * Replaces:
 * - from '@/shared/api/supabaseClient' → from '@/shared/api/supabaseClient'
 * - from '@/shared/api/supabaseClient' → from '@/shared/api/supabaseClient'
 * - from '@/shared/api/supabaseClient' → from '@/shared/api/supabaseClient'
 * - etc.
 */

interface ImportReplacement {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const replacements: ImportReplacement[] = [
  {
    pattern: /from ['"]\.\.\/\.\.\/utils\/supabase['"]/g,
    replacement: "from '@/shared/api/supabaseClient'",
    description: 'utils/supabase → @/shared/api/supabaseClient'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/utils\/supabase['"]/g,
    replacement: "from '@/shared/api/supabaseClient'",
    description: '../../../utils/supabase → @/shared/api/supabaseClient'
  },
  {
    pattern: /from ['"]\.\.\/lib\/supabaseClient\.ts['"]/g,
    replacement: "from '@/shared/api/supabaseClient'",
    description: '../shared/api/supabaseClient.ts → @/shared/api/supabaseClient'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/lib\/supabaseClient['"]/g,
    replacement: "from '@/shared/api/supabaseClient'",
    description: '@/shared/api/supabaseClient → @/shared/api/supabaseClient'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/lib\/supabaseClient['"]/g,
    replacement: "from '@/shared/api/supabaseClient'",
    description: '@/shared/api/supabaseClient → @/shared/api/supabaseClient'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabaseClient['"]/g,
    replacement: "from '@/shared/api/supabaseClient'",
    description: '../@/shared/api/supabaseClient → @/shared/api/supabaseClient'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabaseClient['"]/g,
    replacement: "from '@/shared/api/supabaseClient'",
    description: '../../@/shared/api/supabaseClient → @/shared/api/supabaseClient'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabaseClient['"]/g,
    replacement: "from '@/shared/api/supabaseClient'",
    description: '../../../@/shared/api/supabaseClient → @/shared/api/supabaseClient'
  }
];

async function fixLegacySupabaseImports() {
  console.log('🔍 Finding files with legacy supabase imports...\n');

  // Find all TypeScript/JavaScript files in src (excluding node_modules, .migration-backups)
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/.migration-backups/**']
  });

  let totalFilesChanged = 0;
  let totalReplacements = 0;
  const changedFiles: string[] = [];

  for (const file of files) {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let fileChanged = false;
    let fileReplacements = 0;

    for (const { pattern, replacement, description } of replacements) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        fileChanged = true;
        fileReplacements += matches.length;
        console.log(`  ✓ ${file}: ${description} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
      }
    }

    if (fileChanged) {
      fs.writeFileSync(filePath, content, 'utf-8');
      totalFilesChanged++;
      totalReplacements += fileReplacements;
      changedFiles.push(file);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 Summary:');
  console.log('='.repeat(80));
  console.log(`Files scanned: ${files.length}`);
  console.log(`Files changed: ${totalFilesChanged}`);
  console.log(`Total replacements: ${totalReplacements}`);
  
  if (changedFiles.length > 0) {
    console.log('\n📝 Changed files:');
    changedFiles.forEach(file => console.log(`  - ${file}`));
  }

  console.log('\n✅ Legacy supabase import fix complete!');
}

fixLegacySupabaseImports().catch(console.error);
