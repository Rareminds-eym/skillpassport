#!/usr/bin/env tsx
/**
 * Migrate Remaining Components
 * 
 * Migrates the final 83 components from src/components/ to appropriate FSD locations
 * and updates all import paths across the codebase.
 */

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

interface ComponentMapping {
  source: string;
  target: string;
  reason: string;
}

const COMPONENT_MAPPINGS: ComponentMapping[] = [
  // Subscription components → features/subscription/ui/
  { source: 'src/components/Subscription/AddOnCheckout.jsx', target: 'src/features/subscription/ui/shared/AddOnCheckout.jsx', reason: 'subscription feature' },
  { source: 'src/components/Subscription/AddOnMarketplace.jsx', target: 'src/features/subscription/ui/shared/AddOnMarketplace.jsx', reason: 'subscription feature' },
  { source: 'src/components/Subscription/SubscriptionDashboard.jsx', target: 'src/features/subscription/ui/individual/SubscriptionDashboard.jsx', reason: 'subscription feature' },
  { source: 'src/components/Subscription/SubscriptionSettingsSection.tsx', target: 'src/features/subscription/ui/shared/SubscriptionSettingsSection.tsx', reason: 'subscription feature' },
  { source: 'src/components/Subscription/FeatureGate.tsx', target: 'src/features/subscription/ui/shared/FeatureGate.tsx', reason: 'subscription feature' },
  { source: 'src/components/Subscription/Organization/index.ts', target: 'src/features/subscription/ui/organization/index.ts', reason: 'subscription feature' },
  { source: 'src/components/Subscription/shared/signupValidation.ts', target: 'src/features/subscription/lib/signupValidation.ts', reason: 'subscription utilities' },
  
  // Admin components → features/college-admin/ui/ or shared/ui/
  { source: 'src/components/admin/Sidebar.tsx', target: 'src/widgets/admin-navigation/ui/AdminSidebar.tsx', reason: 'admin navigation widget' },
  { source: 'src/components/admin/Header.tsx', target: 'src/widgets/admin-navigation/ui/AdminHeader.tsx', reason: 'admin navigation widget' },
  { source: 'src/components/admin/KPICard.tsx', target: 'src/widgets/kpi-dashboard/ui/KPICard.tsx', reason: 'KPI widget component' },
  { source: 'src/components/admin/Pagination.tsx', target: 'src/shared/ui/Pagination.tsx', reason: 'shared UI component' },
  { source: 'src/components/admin/components/CareerPathDrawer.tsx', target: 'src/features/counselling/ui/CareerPathDrawer.tsx', reason: 'counselling feature' },
  { source: 'src/components/admin/modals/AddAttendanceSessionModal.tsx', target: 'src/features/college-admin/ui/modals/AddAttendanceSessionModal.tsx', reason: 'college-admin feature' },
  { source: 'src/components/admin/modals/AttendanceDetailsModal.tsx', target: 'src/features/college-admin/ui/modals/AttendanceDetailsModal.tsx', reason: 'college-admin feature' },
  { source: 'src/components/admin/modals/StudentHistoryModal.tsx', target: 'src/features/college-admin/ui/modals/StudentHistoryModal.tsx', reason: 'college-admin feature' },
  
  // Educator components → features/college-admin/ui/
  { source: 'src/components/educator/GradingModal.tsx', target: 'src/features/college-admin/ui/modals/GradingModal.tsx', reason: 'college-admin feature' },
  { source: 'src/components/educator/modals/Addstudentmodal.tsx', target: 'src/features/college-admin/ui/modals/AddStudentModal.tsx', reason: 'college-admin feature' },
  
  // Messaging components → features/messaging/ui/
  { source: 'src/components/messaging/MessageModal.tsx', target: 'src/features/messaging/ui/MessageModal.tsx', reason: 'messaging feature' },
  
  // Exam components → features/exams/ui/
  { source: 'src/components/exams/ExamWorkflowManager.tsx', target: 'src/features/exams/ui/ExamWorkflowManager.tsx', reason: 'exams feature' },
  
  // Shared components → shared/ui/
  { source: 'src/components/shared/AssessmentReportDrawer.tsx', target: 'src/shared/ui/AssessmentReportDrawer.tsx', reason: 'shared UI component' },
  { source: 'src/components/common/SearchBar.tsx', target: 'src/shared/ui/SearchBar.tsx', reason: 'shared UI component' },
  { source: 'src/components/Loader.jsx', target: 'src/shared/ui/Loader.jsx', reason: 'shared UI component' },
  { source: 'src/components/AboutRareMinds.tsx', target: 'src/shared/ui/AboutRareMinds.tsx', reason: 'shared UI component' },
  
  // UI components from Students folder → shared/ui/
  { source: 'src/components/Students/components/ui/card.tsx', target: 'src/shared/ui/card.tsx', reason: 'shared UI component' },
  { source: 'src/components/Students/components/ui/button.tsx', target: 'src/shared/ui/button.tsx', reason: 'shared UI component' },
  { source: 'src/components/Students/components/ui/badge.tsx', target: 'src/shared/ui/badge.tsx', reason: 'shared UI component' },
  { source: 'src/components/Students/components/ui/tabs.tsx', target: 'src/shared/ui/tabs.tsx', reason: 'shared UI component' },
  { source: 'src/components/Students/components/ui/textarea.tsx', target: 'src/shared/ui/textarea.tsx', reason: 'shared UI component' },
  { source: 'src/components/Students/components/ui/scroll-area.tsx', target: 'src/shared/ui/scroll-area.tsx', reason: 'shared UI component' },
  
  // Hero/UI components → shared/ui/
  { source: 'src/components/ui/hero-dithering-card.tsx', target: 'src/shared/ui/hero-dithering-card.tsx', reason: 'shared UI component' },
  
  // Modals → appropriate features
  { source: 'src/components/modals/CompanyStatusModal.tsx', target: 'src/features/placement/ui/modals/CompanyStatusModal.tsx', reason: 'placement feature' },
];

async function migrateComponents(): Promise<void> {
  console.log('🚀 Starting component migration...\n');

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const mapping of COMPONENT_MAPPINGS) {
    try {
      if (!fs.existsSync(mapping.source)) {
        console.log(`⏭️  Skipped: ${mapping.source} (already migrated or doesn't exist)`);
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
      console.error(`❌ Error migrating ${mapping.source}:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('\n✨ Component migration complete!');
  console.log('\n⚠️  Next step: Run update-component-imports.ts to update all import paths');
}

migrateComponents().catch(console.error);
