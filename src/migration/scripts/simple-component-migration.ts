#!/usr/bin/env tsx
import { execSync } from 'child_process';
import * as fs from 'fs';

console.log('🚀 Migrating components with smartRelocate...\n');

// Just update the imports directly - components are already in place or will be handled by smartRelocate
const importUpdates = [
  // Config
  { from: '@/config/logging', to: '@/shared/config/logging' },
  
  // Most common component imports that need updating
  { from: '@/components/Loader', to: '@/shared/ui/Loader' },
  { from: '@/components/AboutRareMinds', to: '@/shared/ui/AboutRareMinds' },
  { from: '@/components/common/SearchBar', to: '@/shared/ui/SearchBar' },
  { from: '@/components/admin/Pagination', to: '@/shared/ui/Pagination' },
  { from: '@/components/shared/AssessmentReportDrawer', to: '@/shared/ui/AssessmentReportDrawer' },
  { from: '@/components/Students/components/ui/card', to: '@/shared/ui/card' },
  { from: '@/components/Students/components/ui/button', to: '@/shared/ui/button' },
  { from: '@/components/Students/components/ui/badge', to: '@/shared/ui/badge' },
  { from: '@/components/Students/components/ui/tabs', to: '@/shared/ui/tabs' },
  { from: '@/components/Students/components/ui/textarea', to: '@/shared/ui/textarea' },
  { from: '@/components/Students/components/ui/scroll-area', to: '@/shared/ui/scroll-area' },
  { from: '@/components/ui/hero-dithering-card', to: '@/shared/ui/hero-dithering-card' },
];

console.log('📝 Updating imports in codebase...\n');

// Use simple find/replace across all files
for (const update of importUpdates) {
  try {
    const files = execSync(`git grep -l "${update.from}"`, { encoding: 'utf-8' })
      .split('\n')
      .filter(f => f && f.startsWith('src/') && !f.includes('migration/'));
    
    for (const file of files) {
      let content = fs.readFileSync(file, 'utf-8');
      const before = content;
      content = content.replace(new RegExp(update.from.replace(/\//g, '\\/'), 'g'), update.to);
      
      if (content !== before) {
        fs.writeFileSync(file, content);
        console.log(`✅ Updated ${file}: ${update.from} → ${update.to}`);
      }
    }
  } catch (e) {
    // No matches found, continue
  }
}

console.log('\n✨ Import updates complete!');
console.log('\n⚠️  Run verify-legacy-imports.ts to check remaining imports');
