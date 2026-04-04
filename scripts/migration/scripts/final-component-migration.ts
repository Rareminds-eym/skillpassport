#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

const BACKUP = '.migration-backups/legacy-final-backup-2026-03-23-173634/components';

const COMPONENTS = [
  { src: `${BACKUP}/skillpassport/RegistrationForm.tsx`, dst: 'src/shared/ui/marketing/RegistrationForm.tsx' },
  { src: `${BACKUP}/TimelineSection.jsx`, dst: 'src/shared/ui/marketing/TimelineSection.jsx' },
  { src: `${BACKUP}/skillpassport/WhatYouGetSection.tsx`, dst: 'src/shared/ui/marketing/WhatYouGetSection.tsx' },
  { src: `${BACKUP}/skillpassport/AboutRaremindsSection.tsx`, dst: 'src/shared/ui/marketing/AboutRaremindsSection.tsx' },
  { src: `${BACKUP}/skillpassport/NeedHelpSection.tsx`, dst: 'src/shared/ui/marketing/NeedHelpSection.tsx' },
  { src: `${BACKUP}/shared/AssessmentReportDrawer.tsx`, dst: 'src/shared/ui/AssessmentReportDrawer.tsx' },
  { src: `${BACKUP}/admin/KPIDashboard.tsx`, dst: 'src/shared/ui/KPIDashboard.tsx' },
];

async function migrate() {
  console.log('🚀 Final component migration...\n');
  
  let migrated = 0, skipped = 0;
  
  for (const { src, dst } of COMPONENTS) {
    if (!fs.existsSync(src)) {
      console.log(`⏭️  ${path.basename(src)} (not found)`);
      skipped++;
      continue;
    }
    
    if (fs.existsSync(dst)) {
      console.log(`⏭️  ${path.basename(dst)} (exists)`);
      skipped++;
      continue;
    }
    
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    console.log(`✅ ${path.basename(src)}`);
    migrated++;
  }
  
  console.log(`\n📊 ${migrated} migrated, ${skipped} skipped\n`);
}

async function fixImports() {
  console.log('🔄 Fixing imports...\n');
  
  const files = getAllFiles('src/pages', /\.(jsx?|tsx?)$/);
  let fixed = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    
    const replacements: Array<[RegExp, string]> = [
      [/from ['"].*\/components\/skillpassport\/RegistrationForm['"]/, "from '@/shared/ui/marketing'"],
      [/from ['"].*\/components\/TimelineSection['"]/, "from '@/shared/ui/marketing'"],
      [/from ['"].*\/components\/skillpassport\/WhatYouGetSection['"]/, "from '@/shared/ui/marketing'"],
      [/from ['"].*\/components\/skillpassport\/AboutRaremindsSection['"]/, "from '@/shared/ui/marketing'"],
      [/from ['"].*\/components\/skillpassport\/NeedHelpSection['"]/, "from '@/shared/ui/marketing'"],
      [/from ['"].*\/components\/shared\/AssessmentReportDrawer['"]/, "from '@/shared/ui'"],
      [/from ['"].*\/components\/admin\/KPIDashboard['"]/, "from '@/shared/ui'"],
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
  
  console.log(`\n📊 ${fixed} files updated\n`);
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

migrate().then(fixImports).catch(console.error);
