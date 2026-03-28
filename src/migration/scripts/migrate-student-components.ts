#!/usr/bin/env tsx
/**
 * Migrate Student Components
 * 
 * Migrates all remaining Student feature components from backup to FSD structure
 * and updates all import paths.
 */

import * as fs from 'fs';
import * as path from 'path';

const BACKUP_BASE = '.migration-backups/legacy-final-backup-2026-03-23-173634/components';

interface ComponentMapping {
  source: string;
  target: string;
  feature: string;
}

const STUDENT_COMPONENTS: ComponentMapping[] = [
  // Student Profile Feature
  { source: `${BACKUP_BASE}/Students/components/StudentPublicViewer.jsx`, target: 'src/features/student-profile/ui/StudentPublicViewer.jsx', feature: 'student-profile' },
  { source: `${BACKUP_BASE}/Students/components/ProfileEditSection.tsx`, target: 'src/features/student-profile/ui/ProfileEditSection.tsx', feature: 'student-profile' },
  { source: `${BACKUP_BASE}/Students/components/ProfileEditModals.tsx`, target: 'src/features/student-profile/ui/ProfileEditModals.tsx', feature: 'student-profile' },
  { source: `${BACKUP_BASE}/Students/components/AchievementsTimeline.tsx`, target: 'src/features/student-profile/ui/AchievementsTimeline.tsx', feature: 'student-profile' },
  { source: `${BACKUP_BASE}/Students/components/AnalyticsView.tsx`, target: 'src/features/student-profile/ui/AnalyticsView.tsx', feature: 'student-profile' },
  { source: `${BACKUP_BASE}/Students/components/TrainingRecommendations.tsx`, target: 'src/features/student-profile/ui/TrainingRecommendations.tsx', feature: 'student-profile' },
  { source: `${BACKUP_BASE}/Students/components/SuggestedNextSteps.tsx`, target: 'src/features/student-profile/ui/SuggestedNextSteps.tsx', feature: 'student-profile' },
  { source: `${BACKUP_BASE}/Students/components/RecentUpdatesCard.tsx`, target: 'src/features/student-profile/ui/RecentUpdatesCard.tsx', feature: 'student-profile' },
  { source: `${BACKUP_BASE}/Students/components/SkillsDashboard.tsx`, target: 'src/features/student-profile/ui/SkillsDashboard.tsx', feature: 'student-profile' },
  { source: `${BACKUP_BASE}/Students/components/SettingsTabs/MainSettings.tsx`, target: 'src/features/student-profile/ui/settings/MainSettings.tsx', feature: 'student-profile' },
  
  // Opportunities Feature
  { source: `${BACKUP_BASE}/Students/components/OpportunityCard.tsx`, target: 'src/features/opportunities/ui/OpportunityCard.tsx', feature: 'opportunities' },
  { source: `${BACKUP_BASE}/Students/components/OpportunityListItem.tsx`, target: 'src/features/opportunities/ui/OpportunityListItem.tsx', feature: 'opportunities' },
  { source: `${BACKUP_BASE}/Students/components/OpportunityPreview.tsx`, target: 'src/features/opportunities/ui/OpportunityPreview.tsx', feature: 'opportunities' },
  { source: `${BACKUP_BASE}/Students/components/RecommendedJobs.tsx`, target: 'src/features/opportunities/ui/RecommendedJobs.tsx', feature: 'opportunities' },
  { source: `${BACKUP_BASE}/Students/components/AdvancedFilters.tsx`, target: 'src/features/opportunities/ui/AdvancedFilters.tsx', feature: 'opportunities' },
  { source: `${BACKUP_BASE}/Students/components/IndustrialVisitPreview.tsx`, target: 'src/features/opportunities/ui/IndustrialVisitPreview.tsx', feature: 'opportunities' },
  
  // Courses Feature
  { source: `${BACKUP_BASE}/Students/components/CourseAdvancedFilters.tsx`, target: 'src/features/courses/ui/CourseAdvancedFilters.tsx', feature: 'courses' },
  { source: `${BACKUP_BASE}/Students/components/ModernLearningCard.tsx`, target: 'src/features/courses/ui/ModernLearningCard.tsx', feature: 'courses' },
  { source: `${BACKUP_BASE}/Students/components/LearningAnalyticsDashboard.tsx`, target: 'src/features/courses/ui/LearningAnalyticsDashboard.tsx', feature: 'courses' },
  { source: `${BACKUP_BASE}/Students/components/SelectCourseModal.tsx`, target: 'src/features/courses/ui/SelectCourseModal.tsx', feature: 'courses' },
  { source: `${BACKUP_BASE}/student/WeeklyLearningTracker.tsx`, target: 'src/features/courses/ui/WeeklyLearningTracker.tsx', feature: 'courses' },
];

interface ImportUpdate {
  file: string;
  oldImport: string;
  newImport: string;
}

async function migrateComponents(): Promise<void> {
  console.log('🚀 Migrating Student components to FSD structure...\n');

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const mapping of STUDENT_COMPONENTS) {
    try {
      if (!fs.existsSync(mapping.source)) {
        console.log(`⏭️  Skipped: ${path.basename(mapping.source)} (source not found)`);
        skipped++;
        continue;
      }

      if (fs.existsSync(mapping.target)) {
        console.log(`⏭️  Skipped: ${path.basename(mapping.target)} (already exists)`);
        skipped++;
        continue;
      }

      // Create target directory
      const targetDir = path.dirname(mapping.target);
      fs.mkdirSync(targetDir, { recursive: true });

      // Copy file
      const content = fs.readFileSync(mapping.source, 'utf-8');
      fs.writeFileSync(mapping.target, content);

      console.log(`✅ Migrated: ${path.basename(mapping.source)} → ${mapping.target}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Error migrating ${path.basename(mapping.source)}:`, error);
      errors++;
    }
  }

  console.log(`\n📊 Migration: ${migrated} migrated, ${skipped} skipped, ${errors} errors\n`);
}

async function updateImports(): Promise<void> {
  console.log('🔄 Updating import paths...\n');

  const importMappings: Record<string, string> = {
    // Student Profile
    'StudentPublicViewer': '@/features/student-profile',
    'ProfileEditSection': '@/features/student-profile',
    'ProfileEditModals': '@/features/student-profile',
    'AchievementsTimeline': '@/features/student-profile',
    'AnalyticsView': '@/features/student-profile',
    'TrainingRecommendations': '@/features/student-profile',
    'SuggestedNextSteps': '@/features/student-profile',
    'RecentUpdatesCard': '@/features/student-profile',
    'SkillsDashboard': '@/features/student-profile',
    'MainSettings': '@/features/student-profile',
    
    // Opportunities
    'OpportunityCard': '@/features/opportunities',
    'OpportunityListItem': '@/features/opportunities',
    'OpportunityPreview': '@/features/opportunities',
    'RecommendedJobs': '@/features/opportunities',
    'AdvancedFilters': '@/features/opportunities',
    'IndustrialVisitPreview': '@/features/opportunities',
    
    // Courses
    'CourseAdvancedFilters': '@/features/courses',
    'ModernLearningCard': '@/features/courses',
    'LearningAnalyticsDashboard': '@/features/courses',
    'SelectCourseModal': '@/features/courses',
    'WeeklyLearningTracker': '@/features/courses',
  };

  let updated = 0;

  // Find all files that might import these components
  const filesToCheck = getAllSourceFiles('src');

  for (const file of filesToCheck) {
    try {
      let content = fs.readFileSync(file, 'utf-8');
      let modified = false;

      for (const [componentName, newPath] of Object.entries(importMappings)) {
        // Match old import patterns
        const patterns = [
          new RegExp(`from ['"].*components/Students/components/${componentName}['"]`, 'g'),
          new RegExp(`from ['"].*components/student/${componentName}['"]`, 'g'),
          new RegExp(`from ['"]\\.\\.?/.*components/Students/components/${componentName}['"]`, 'g'),
          new RegExp(`from ['"]\\.\\.?/.*components/student/${componentName}['"]`, 'g'),
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            content = content.replace(pattern, `from '${newPath}'`);
            modified = true;
          }
        }
      }

      if (modified) {
        fs.writeFileSync(file, content);
        console.log(`✅ Updated imports in: ${file}`);
        updated++;
      }
    } catch (error) {
      console.error(`❌ Error updating ${file}:`, error);
    }
  }

  console.log(`\n📊 Updated imports in ${updated} files\n`);
}

function getAllSourceFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
          traverse(fullPath);
        }
      } else if (entry.isFile() && /\.(jsx?|tsx?)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

async function updateFeatureExports(): Promise<void> {
  console.log('📦 Updating feature public APIs...\n');

  const features = {
    'student-profile': [
      'StudentPublicViewer',
      'ProfileEditSection',
      'ProfileEditModals',
      'AchievementsTimeline',
      'AnalyticsView',
      'TrainingRecommendations',
      'SuggestedNextSteps',
      'RecentUpdatesCard',
      'SkillsDashboard',
      'MainSettings',
    ],
    'opportunities': [
      'OpportunityCard',
      'OpportunityListItem',
      'OpportunityPreview',
      'RecommendedJobs',
      'AdvancedFilters',
      'IndustrialVisitPreview',
    ],
    'courses': [
      'CourseAdvancedFilters',
      'ModernLearningCard',
      'LearningAnalyticsDashboard',
      'SelectCourseModal',
      'WeeklyLearningTracker',
    ],
  };

  for (const [feature, components] of Object.entries(features)) {
    const indexPath = `src/features/${feature}/index.ts`;
    
    if (!fs.existsSync(indexPath)) {
      console.log(`⚠️  Creating ${indexPath}`);
      fs.writeFileSync(indexPath, '');
    }

    let content = fs.readFileSync(indexPath, 'utf-8');
    
    // Add UI exports if not present
    const uiExportLine = `export { ${components.join(', ')} } from './ui';`;
    
    if (!content.includes('export {') || !content.includes('from \'./ui\'')) {
      content += `\n// UI Components\n${uiExportLine}\n`;
      fs.writeFileSync(indexPath, content);
      console.log(`✅ Updated ${indexPath}`);
    }
  }
}

async function main() {
  console.log('=' .repeat(80));
  console.log('Student Components Migration to FSD');
  console.log('='.repeat(80) + '\n');

  await migrateComponents();
  await updateImports();
  await updateFeatureExports();

  console.log('✨ Migration complete!\n');
}

main().catch(console.error);
