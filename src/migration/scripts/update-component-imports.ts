#!/usr/bin/env tsx
/**
 * Update Component Imports
 * 
 * Updates all imports from @/components/ to their new FSD locations.
 */

import { glob } from 'glob';
import * as fs from 'fs';

interface ImportMapping {
  oldPath: string;
  newPath: string;
}

const IMPORT_MAPPINGS: ImportMapping[] = [
  // Subscription
  { oldPath: '@/components/Subscription/AddOnCheckout', newPath: '@/features/subscription/ui/shared/AddOnCheckout' },
  { oldPath: '@/components/Subscription/AddOnMarketplace', newPath: '@/features/subscription/ui/shared/AddOnMarketplace' },
  { oldPath: '@/components/Subscription/SubscriptionDashboard', newPath: '@/features/subscription/ui/individual/SubscriptionDashboard' },
  { oldPath: '@/components/Subscription/SubscriptionSettingsSection', newPath: '@/features/subscription/ui/shared/SubscriptionSettingsSection' },
  { oldPath: '@/components/Subscription/FeatureGate', newPath: '@/features/subscription/ui/shared/FeatureGate' },
  { oldPath: '@/components/Subscription/Organization', newPath: '@/features/subscription/ui/organization' },
  { oldPath: '@/components/Subscription/shared/signupValidation', newPath: '@/features/subscription/lib/signupValidation' },
  
  // Admin
  { oldPath: '@/components/admin/Sidebar', newPath: '@/widgets/admin-navigation/ui/AdminSidebar' },
  { oldPath: '@/components/admin/Header', newPath: '@/widgets/admin-navigation/ui/AdminHeader' },
  { oldPath: '@/components/admin/KPICard', newPath: '@/widgets/kpi-dashboard/ui/KPICard' },
  { oldPath: '@/components/admin/Pagination', newPath: '@/shared/ui/Pagination' },
  { oldPath: '@/components/admin/components/CareerPathDrawer', newPath: '@/features/counselling/ui/CareerPathDrawer' },
  { oldPath: '@/components/admin/modals/AddAttendanceSessionModal', newPath: '@/features/college-admin/ui/modals/AddAttendanceSessionModal' },
  { oldPath: '@/components/admin/modals/AttendanceDetailsModal', newPath: '@/features/college-admin/ui/modals/AttendanceDetailsModal' },
  { oldPath: '@/components/admin/modals/StudentHistoryModal', newPath: '@/features/college-admin/ui/modals/StudentHistoryModal' },
  
  // Educator
  { oldPath: '@/components/educator/GradingModal', newPath: '@/features/college-admin/ui/modals/GradingModal' },
  { oldPath: '@/components/educator/modals/Addstudentmodal', newPath: '@/features/college-admin/ui/modals/AddStudentModal' },
  
  // Messaging
  { oldPath: '@/components/messaging/MessageModal', newPath: '@/features/messaging/ui/MessageModal' },
  
  // Exams
  { oldPath: '@/components/exams/ExamWorkflowManager', newPath: '@/features/exams/ui/ExamWorkflowManager' },
  
  // Shared
  { oldPath: '@/components/shared/AssessmentReportDrawer', newPath: '@/shared/ui/AssessmentReportDrawer' },
  { oldPath: '@/components/common/SearchBar', newPath: '@/shared/ui/SearchBar' },
  { oldPath: '@/components/Loader', newPath: '@/shared/ui/Loader' },
  { oldPath: '@/components/AboutRareMinds', newPath: '@/shared/ui/AboutRareMinds' },
  
  // UI components
  { oldPath: '@/components/Students/components/ui/card', newPath: '@/shared/ui/card' },
  { oldPath: '@/components/Students/components/ui/button', newPath: '@/shared/ui/button' },
  { oldPath: '@/components/Students/components/ui/badge', newPath: '@/shared/ui/badge' },
  { oldPath: '@/components/Students/components/ui/tabs', newPath: '@/shared/ui/tabs' },
  { oldPath: '@/components/Students/components/ui/textarea', newPath: '@/shared/ui/textarea' },
  { oldPath: '@/components/Students/components/ui/scroll-area', newPath: '@/shared/ui/scroll-area' },
  { oldPath: '@/components/ui/hero-dithering-card', newPath: '@/shared/ui/hero-dithering-card' },
  
  // Modals
  { oldPath: '@/components/modals/CompanyStatusModal', newPath: '@/features/placement/ui/modals/CompanyStatusModal' },
];

async function updateImports(): Promise<void> {
  console.log('🔄 Updating component imports...\n');

  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/migration/**']
  });

  let filesUpdated = 0;
  let importsUpdated = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let fileModified = false;

    for (const mapping of IMPORT_MAPPINGS) {
      // Match various import patterns
      const patterns = [
        // import X from '@/components/...'
        new RegExp(`from ['"]${mapping.oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
        // import { X } from '@/components/...'
        new RegExp(`from ['"]${mapping.oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
      ];

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, `from '${mapping.newPath}'`);
          fileModified = true;
          importsUpdated++;
        }
      }
    }

    if (fileModified) {
      fs.writeFileSync(file, content);
      filesUpdated++;
      console.log(`✅ Updated: ${file}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Update Summary:`);
  console.log(`   📝 Files updated: ${filesUpdated}`);
  console.log(`   🔗 Imports updated: ${importsUpdated}`);
  console.log('\n✨ Import update complete!');
}

updateImports().catch(console.error);
