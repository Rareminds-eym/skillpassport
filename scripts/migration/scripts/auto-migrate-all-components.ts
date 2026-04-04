#!/usr/bin/env tsx
/**
 * Auto-Migrate All Components
 * 
 * Automatically migrates ALL remaining components from src/components/
 * to appropriate FSD locations based on intelligent classification.
 */

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationRule {
  pattern: RegExp;
  targetBase: string;
  reason: string;
}

const MIGRATION_RULES: MigrationRule[] = [
  // Subscription → features/subscription
  { pattern: /^src\/components\/Subscription\//, targetBase: 'src/features/subscription/ui/', reason: 'subscription feature' },
  
  // Admin → features/college-admin or widgets
  { pattern: /^src\/components\/admin\/collegeAdmin\//, targetBase: 'src/features/college-admin/ui/', reason: 'college-admin feature' },
  { pattern: /^src\/components\/admin\/universityAdmin\//, targetBase: 'src/features/college-admin/ui/', reason: 'college-admin feature' },
  { pattern: /^src\/components\/admin\/modals\//, targetBase: 'src/features/college-admin/ui/modals/', reason: 'college-admin modals' },
  { pattern: /^src\/components\/admin\/components\//, targetBase: 'src/features/college-admin/ui/components/', reason: 'college-admin components' },
  { pattern: /^src\/components\/admin\/(Sidebar|Header)\.tsx$/, targetBase: 'src/widgets/admin-navigation/ui/', reason: 'admin navigation widget' },
  { pattern: /^src\/components\/admin\/KPI/, targetBase: 'src/widgets/kpi-dashboard/ui/', reason: 'KPI widget' },
  { pattern: /^src\/components\/admin\//, targetBase: 'src/features/college-admin/ui/', reason: 'college-admin feature' },
  
  // Educator → features/college-admin
  { pattern: /^src\/components\/educator\//, targetBase: 'src/features/college-admin/ui/', reason: 'college-admin feature' },
  
  // Teacher → features/college-admin
  { pattern: /^src\/components\/teacher\//, targetBase: 'src/features/college-admin/ui/', reason: 'college-admin feature' },
  
  // Messaging → features/messaging
  { pattern: /^src\/components\/messaging\//, targetBase: 'src/features/messaging/ui/', reason: 'messaging feature' },
  
  // Exams → features/exams
  { pattern: /^src\/components\/exams\//, targetBase: 'src/features/exams/ui/', reason: 'exams feature' },
  
  // Assessment → features/assessment
  { pattern: /^src\/components\/assessment\//, targetBase: 'src/features/assessment/ui/', reason: 'assessment feature' },
  
  // Digital Portfolio/Passport → features/digital-portfolio
  { pattern: /^src\/components\/digital-pp\//, targetBase: 'src/features/digital-portfolio/ui/', reason: 'digital-portfolio feature' },
  { pattern: /^src\/components\/skillpassport\//, targetBase: 'src/features/digital-portfolio/ui/', reason: 'digital-portfolio feature' },
  
  // Student components → features/student-profile or widgets
  { pattern: /^src\/components\/student\//, targetBase: 'src/features/student-profile/ui/', reason: 'student-profile feature' },
  { pattern: /^src\/components\/Students\//, targetBase: 'src/features/student-profile/ui/', reason: 'student-profile feature' },
  { pattern: /^src\/components\/StudentMessaging\//, targetBase: 'src/features/messaging/ui/', reason: 'messaging feature' },
  
  // Recruiter → features/recruiter-copilot
  { pattern: /^src\/components\/Recruiter\//, targetBase: 'src/features/recruiter-copilot/ui/', reason: 'recruiter-copilot feature' },
  
  // MyClass → features/courses or features/college-admin
  { pattern: /^src\/components\/Myclass\//, targetBase: 'src/features/courses/ui/', reason: 'courses feature' },
  
  // Organization → features/subscription
  { pattern: /^src\/components\/organization\//, targetBase: 'src/features/subscription/ui/organization/', reason: 'subscription feature' },
  
  // Tours → shared/ui/tours
  { pattern: /^src\/components\/Tours\//, targetBase: 'src/shared/ui/tours/', reason: 'shared tours' },
  
  // Homepage → shared/ui/homepage or marketing
  { pattern: /^src\/components\/Homepage\//, targetBase: 'src/shared/ui/homepage/', reason: 'shared homepage components' },
  
  // SEO → shared/ui
  { pattern: /^src\/components\/SEO\//, targetBase: 'src/shared/ui/', reason: 'shared SEO components' },
  
  // Modals → appropriate features
  { pattern: /^src\/components\/modals\/CompanyStatusModal/, targetBase: 'src/features/placement/ui/modals/', reason: 'placement feature' },
  { pattern: /^src\/components\/modals\//, targetBase: 'src/shared/ui/modals/', reason: 'shared modals' },
  
  // Common/Shared → shared/ui
  { pattern: /^src\/components\/common\//, targetBase: 'src/shared/ui/', reason: 'shared UI components' },
  { pattern: /^src\/components\/shared\//, targetBase: 'src/shared/ui/', reason: 'shared UI components' },
  { pattern: /^src\/components\/ui\//, targetBase: 'src/shared/ui/', reason: 'shared UI components' },
  { pattern: /^src\/components\/debug\//, targetBase: 'src/shared/ui/debug/', reason: 'shared debug components' },
  
  // Root level components → shared/ui
  { pattern: /^src\/components\/[^\/]+\.(tsx|jsx|ts|js)$/, targetBase: 'src/shared/ui/', reason: 'shared UI components' },
];

async function autoMigrateComponents(): Promise<void> {
  console.log('🤖 Auto-migrating all components...\n');

  const files = await glob('src/components/**/*.{ts,tsx,js,jsx,css,svg,txt,md}', {
    ignore: ['**/node_modules/**', '**/__tests__/**', '**/*.test.*', '**/*.spec.*']
  });

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  const migrations: Array<{source: string, target: string}> = [];

  for (const file of files) {
    try {
      // Find matching rule
      let targetPath: string | null = null;
      let reason = '';

      for (const rule of MIGRATION_RULES) {
        if (rule.pattern.test(file)) {
          // Extract the part after the matched pattern
          const relativePath = file.replace(rule.pattern, '');
          const fileName = path.basename(file);
          
          // For specific file patterns, use just the filename
          if (rule.pattern.source.includes('\\.(tsx|jsx|ts|js)$')) {
            targetPath = path.join(rule.targetBase, fileName);
          } else {
            targetPath = path.join(rule.targetBase, relativePath);
          }
          
          reason = rule.reason;
          break;
        }
      }

      if (!targetPath) {
        console.log(`⚠️  No rule matched: ${file}`);
        skipped++;
        continue;
      }

      // Create target directory
      const targetDir = path.dirname(targetPath);
      fs.mkdirSync(targetDir, { recursive: true });

      // Copy file
      const content = fs.readFileSync(file, 'utf-8');
      fs.writeFileSync(targetPath, content);

      migrations.push({ source: file, target: targetPath });
      console.log(`✅ ${path.basename(file)} → ${targetPath}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Error migrating ${file}:`, error);
      errors++;
    }
  }

  // Save migration map for import updates
  fs.writeFileSync(
    'src/migration/data/component-migrations.json',
    JSON.stringify(migrations, null, 2)
  );

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('\n💾 Migration map saved to: src/migration/data/component-migrations.json');
  console.log('\n✨ Component migration complete!');
  console.log('\n⚠️  Next step: Run update-all-component-imports.ts');
}

autoMigrateComponents().catch(console.error);
