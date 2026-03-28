#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

const BACKUP = '.migration-backups/legacy-final-backup-2026-03-23-173634/components';

// Map of component names to their new FSD locations
const COMPONENT_MAP: Record<string, string> = {
  // Student components
  'AchievementsExpanded': '@/features/student-profile',
  'WhatIsSection': '@/shared/ui/marketing',
  'WhoIsThisForSection': '@/shared/ui/marketing',
  'OTPInput': '@/shared/ui',
  
  // Homepage components
  'Homepage': '@/pages/homepage',
};

// Components that need to be migrated first
const MISSING_COMPONENTS = [
  { src: `${BACKUP}/Students/components/AchievementsExpanded.tsx`, dst: 'src/features/student-profile/ui/AchievementsExpanded.tsx' },
  { src: `${BACKUP}/skillpassport/WhoIsThisForSection.tsx`, dst: 'src/shared/ui/marketing/WhoIsThisForSection.tsx' },
  { src: `${BACKUP}/OTPInput.jsx`, dst: 'src/shared/ui/OTPInput.jsx' },
];

async function migrateComponents() {
  console.log('🚀 Migrating missing components...\n');
  
  for (const { src, dst } of MISSING_COMPONENTS) {
    if (!fs.existsSync(src)) {
      console.log(`⏭️  ${path.basename(src)} (not found)`);
      continue;
    }
    
    if (fs.existsSync(dst)) {
      console.log(`⏭️  ${path.basename(dst)} (exists)`);
      continue;
    }
    
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    console.log(`✅ ${path.basename(src)}`);
  }
  
  console.log();
}

async function fixImports() {
  console.log('🔄 Fixing legacy imports...\n');
  
  const files = getAllFiles('src/pages', /\.(jsx?|tsx?)$/);
  let fixed = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    
    // Fix specific patterns
    const replacements: Array<[RegExp, string]> = [
      [/from ['"].*\/components\/Students\/components\/AchievementsExpanded['"]/, "from '@/features/student-profile'"],
      [/from ['"].*\/components\/skillpassport\/WhoIsThisForSection['"]/, "from '@/shared/ui/marketing'"],
      [/from ['"].*\/components\/OTPInput['"]/, "from '@/shared/ui'"],
      [/from ['"].*\/components\/Homepage['"]/, "from '@/pages/homepage'"],
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
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        walk(p);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(p);
      }
    }
  }
  
  walk(dir);
  return files;
}

migrateComponents().then(fixImports).catch(console.error);
