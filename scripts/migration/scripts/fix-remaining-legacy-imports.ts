import * as fs from 'fs';
import { glob } from 'glob';

interface ImportMapping {
  from: RegExp;
  to: string;
}

const mappings: ImportMapping[] = [
  // useUserRole hook
  { from: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\/useUserRole['"]/g, to: 'from "@/entities/user"' },
  { from: /from ['"]\.\.\/\.\.\/\.\.\/hooks\/useUserRole['"]/g, to: 'from "@/entities/user"' },
  { from: /from ['"]\.\.\/\.\.\/hooks\/useUserRole['"]/g, to: 'from "@/entities/user"' },
  { from: /from ['"]\.\.\/hooks\/useUserRole['"]/g, to: 'from "@/entities/user"' },
  
  // Other common legacy imports
  { from: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/utils\/([^'"]+)['"]/g, to: 'from "@/shared/lib/$1"' },
  { from: /from ['"]\.\.\/\.\.\/\.\.\/utils\/([^'"]+)['"]/g, to: 'from "@/shared/lib/$1"' },
  { from: /from ['"]\.\.\/\.\.\/utils\/([^'"]+)['"]/g, to: 'from "@/shared/lib/$1"' },
  { from: /from ['"]\.\.\/utils\/([^'"]+)['"]/g, to: 'from "@/shared/lib/$1"' },
  
  { from: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/config\/([^'"]+)['"]/g, to: 'from "@/shared/config/$1"' },
  { from: /from ['"]\.\.\/\.\.\/\.\.\/config\/([^'"]+)['"]/g, to: 'from "@/shared/config/$1"' },
  { from: /from ['"]\.\.\/\.\.\/config\/([^'"]+)['"]/g, to: 'from "@/shared/config/$1"' },
  { from: /from ['"]\.\.\/config\/([^'"]+)['"]/g, to: 'from "@/shared/config/$1"' },
];

async function fixFile(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  let changes = 0;
  
  for (const { from, to } of mappings) {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      changes += matches.length;
    }
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return changes;
}

async function main() {
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.migration-backups/**']
  });
  
  let totalChanges = 0;
  let filesFixed = 0;
  
  for (const file of files) {
    const changes = await fixFile(file);
    if (changes > 0) {
      console.log(`✓ ${file} (${changes} changes)`);
      totalChanges += changes;
      filesFixed++;
    }
  }
  
  console.log(`\n✅ Fixed ${filesFixed} files with ${totalChanges} total changes`);
}

main();
