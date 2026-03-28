#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

const BACKUP = '.migration-backups/legacy-final-backup-2026-03-23-173634/components';

const MAPPINGS = [
  // Shared UI
  { src: `${BACKUP}/common/SearchBar.tsx`, dst: 'src/shared/ui/SearchBar.tsx' },
  { src: `${BACKUP}/Button.jsx`, dst: 'src/shared/ui/Button.jsx' },
  { src: `${BACKUP}/Footer.jsx`, dst: 'src/shared/ui/Footer.jsx' },
  { src: `${BACKUP}/ActivityFeed.tsx`, dst: 'src/shared/ui/ActivityFeed.tsx' },
  { src: `${BACKUP}/educator/Pagination.tsx`, dst: 'src/shared/ui/Pagination.tsx' },
  
  // Student UI components
  { src: `${BACKUP}/Students/components/ui/card.tsx`, dst: 'src/shared/ui/card.tsx' },
  { src: `${BACKUP}/Students/components/ui/label.tsx`, dst: 'src/shared/ui/label.tsx' },
  { src: `${BACKUP}/Students/components/ui/input.tsx`, dst: 'src/shared/ui/input.tsx' },
  { src: `${BACKUP}/Students/components/ui/radio-group.tsx`, dst: 'src/shared/ui/radio-group.tsx' },
  { src: `${BACKUP}/Students/components/ui/alert-dialog.tsx`, dst: 'src/shared/ui/alert-dialog.tsx' },
  { src: `${BACKUP}/Students/components/ui/pagination.tsx`, dst: 'src/shared/ui/pagination.tsx' },
  { src: `${BACKUP}/Students/components/ui/dropdown-menu.tsx`, dst: 'src/shared/ui/dropdown-menu.tsx' },
  { src: `${BACKUP}/Students/components/ui/lamp.tsx`, dst: 'src/shared/ui/lamp.tsx' },
  { src: `${BACKUP}/Students/data/mockData.ts`, dst: 'src/shared/lib/test/mockData.ts' },
  
  // MyClass feature
  { src: `${BACKUP}/Myclass/SchoolMyClass.tsx`, dst: 'src/features/myclass/ui/SchoolMyClass.tsx' },
  { src: `${BACKUP}/Myclass/CollegeMyClass.tsx`, dst: 'src/features/myclass/ui/CollegeMyClass.tsx' },
  
  // Assessment feature
  { src: `${BACKUP}/assessment/EmbeddedAssessment.tsx`, dst: 'src/features/assessment/ui/EmbeddedAssessment.tsx' },
  
  // College-admin feature
  { src: `${BACKUP}/teacher/SwapRequestCard.tsx`, dst: 'src/features/college-admin/ui/SwapRequestCard.tsx' },
  { src: `${BACKUP}/teacher/SwapRequestModal.tsx`, dst: 'src/features/college-admin/ui/modals/SwapRequestModal.tsx' },
  
  // Student profile feature
  { src: `${BACKUP}/Students/components/SettingsTabs/MainSettings.tsx`, dst: 'src/features/student-profile/ui/settings/MainSettings.tsx' },
  
  // Marketing/Homepage
  { src: `${BACKUP}/skillpassport/HeroSection.tsx`, dst: 'src/shared/ui/marketing/HeroSection.tsx' },
  { src: `${BACKUP}/skillpassport/WhatIsSection.tsx`, dst: 'src/shared/ui/marketing/WhatIsSection.tsx' },
  { src: `${BACKUP}/skillpassport/WhoIsThisForSection.tsx`, dst: 'src/shared/ui/marketing/WhoIsThisForSection.tsx' },
  
  // Recruiter components
  { src: `${BACKUP}/Recruiter/components/AdvancedShortlistFilters.tsx`, dst: 'src/features/recruiter/ui/filters/AdvancedShortlistFilters.tsx' },
  { src: `${BACKUP}/Recruiter/components/AdvancedRequisitionFilters.tsx`, dst: 'src/features/recruiter/ui/filters/AdvancedRequisitionFilters.tsx' },
  { src: `${BACKUP}/Recruiter/RequisitionImport.tsx`, dst: 'src/features/recruiter/ui/RequisitionImport.tsx' },
  { src: `${BACKUP}/Recruiter/Projects/ProjectList.tsx`, dst: 'src/features/recruiter/ui/projects/ProjectList.tsx' },
  { src: `${BACKUP}/Recruiter/Projects/navigation/Breadcrumb.tsx`, dst: 'src/features/recruiter/ui/projects/navigation/Breadcrumb.tsx' },
  { src: `${BACKUP}/Recruiter/Projects/navigation/QuickActionsMenu.tsx`, dst: 'src/features/recruiter/ui/projects/navigation/QuickActionsMenu.tsx' },
  { src: `${BACKUP}/Recruiter/Projects/navigation/TabNavigation.tsx`, dst: 'src/features/recruiter/ui/projects/navigation/TabNavigation.tsx' },
  { src: `${BACKUP}/Recruiter/components/CandidateQuickView.tsx`, dst: 'src/features/recruiter/ui/CandidateQuickView.tsx' },
  { src: `${BACKUP}/Recruiter/components/PipelineAdvancedFilters.tsx`, dst: 'src/features/recruiter/ui/filters/PipelineAdvancedFilters.tsx' },
  { src: `${BACKUP}/Recruiter/components/PipelineSortMenu.tsx`, dst: 'src/features/recruiter/ui/PipelineSortMenu.tsx' },
  { src: `${BACKUP}/Recruiter/components/PipelineStats.tsx`, dst: 'src/features/recruiter/ui/PipelineStats.tsx' },
  { src: `${BACKUP}/Recruiter/components/Toast.tsx`, dst: 'src/features/recruiter/ui/Toast.tsx' },
  { src: `${BACKUP}/Recruiter/components/pipeline/index.tsx`, dst: 'src/features/recruiter/ui/pipeline/index.tsx' },
  { src: `${BACKUP}/Recruiter/filters/OfferAdvancedFilters.tsx`, dst: 'src/features/recruiter/ui/filters/OfferAdvancedFilters.tsx' },
  { src: `${BACKUP}/Recruiter/filters/OfferSortButton.tsx`, dst: 'src/features/recruiter/ui/filters/OfferSortButton.tsx' },
];

const IMPORT_REPLACEMENTS: Array<[RegExp, string]> = [
  // Shared UI
  [/from ['"].*\/components\/common\/SearchBar['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/Button['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/Footer['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/ActivityFeed['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/educator\/Pagination['"]/, "from '@/shared/ui'"],
  
  // Student UI
  [/from ['"].*\/components\/Students\/components\/ui\/card['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/Students\/components\/ui\/label['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/Students\/components\/ui\/input['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/Students\/components\/ui\/radio-group['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/Students\/components\/ui\/alert-dialog['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/Students\/components\/ui\/pagination['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/Students\/components\/ui\/dropdown-menu['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/Students\/components\/ui\/lamp['"]/, "from '@/shared/ui'"],
  [/from ['"].*\/components\/Students\/data\/mockData['"]/, "from "@/shared/lib/test/mockData""],
  
  // Features
  [/from ['"].*\/components\/Myclass\/SchoolMyClass['"]/, "from '@/features/myclass'"],
  [/from ['"].*\/components\/Myclass\/CollegeMyClass['"]/, "from '@/features/myclass'"],
  [/from ['"].*\/components\/assessment\/EmbeddedAssessment['"]/, "from '@/features/assessment'"],
  [/from ['"].*\/components\/teacher\/SwapRequestCard['"]/, "from '@/features/college-admin'"],
  [/from ['"].*\/components\/teacher\/SwapRequestModal['"]/, "from '@/features/college-admin'"],
  [/from ['"].*\/components\/Students\/components\/SettingsTabs\/MainSettings['"]/, "from '@/features/student-profile'"],
  [/from ['"].*\/components\/skillpassport\/(HeroSection|WhatIsSection|WhoIsThisForSection)['"]/, "from '@/shared/ui/marketing'"],
  
  // Recruiter
  [/from ['"].*\/components\/Recruiter\/components\/AdvancedShortlistFilters['"]/, "from '@/features/recruiter'"],
  [/from ['"].*\/components\/Recruiter\/components\/AdvancedRequisitionFilters['"]/, "from '@/features/recruiter'"],
  [/from ['"].*\/components\/Recruiter\/RequisitionImport['"]/, "from '@/features/recruiter'"],
  [/from ['"].*\/components\/Recruiter\/Projects\/ProjectList['"]/, "from '@/features/recruiter'"],
  [/from ['"].*\/components\/Recruiter\/Projects\/navigation\/(Breadcrumb|QuickActionsMenu|TabNavigation)['"]/, "from '@/features/recruiter'"],
  [/from ['"].*\/components\/Recruiter\/components\/(CandidateQuickView|PipelineAdvancedFilters|PipelineSortMenu|PipelineStats|Toast)['"]/, "from '@/features/recruiter'"],
  [/from ['"].*\/components\/Recruiter\/components\/pipeline['"]/, "from '@/features/recruiter'"],
  [/from ['"].*\/components\/Recruiter\/filters\/(OfferAdvancedFilters|OfferSortButton)['"]/, "from '@/features/recruiter'"],
];

async function migrate() {
  console.log('🚀 Migrating remaining components...\n');
  
  let migrated = 0, skipped = 0;
  
  for (const { src, dst } of MAPPINGS) {
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

async function updateImports() {
  console.log('🔄 Updating imports...\n');
  
  const files = getAllFiles('src', /\.(jsx?|tsx?)$/);
  let updated = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    
    for (const [pattern, replacement] of IMPORT_REPLACEMENTS) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`✅ ${file}`);
      updated++;
    }
  }
  
  console.log(`\n📊 ${updated} files updated\n`);
}

function getAllFiles(dir: string, pattern: RegExp): string[] {
  const files: string[] = [];
  
  function walk(d: string) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
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

migrate().then(updateImports).catch(console.error);
