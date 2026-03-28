#!/usr/bin/env tsx
import * as fs from 'fs';
import { glob } from 'glob';

const replacements: Record<string, string> = {
  // Subscription components - already exist in features/subscription
  "@/components/Subscription/AddOnCheckout": "@/features/subscription/ui/shared/AddOnCheckout",
  "@/components/Subscription/AddOnMarketplace": "@/features/subscription/ui/shared/AddOnMarketplace",
  "@/components/Subscription/SubscriptionDashboard": "@/features/subscription/ui/individual/SubscriptionDashboard",
  "@/components/Subscription/SubscriptionSettingsSection": "@/features/subscription/ui/shared/SubscriptionSettingsSection",
  "@/components/Subscription/FeatureGate": "@/features/subscription/ui/shared/FeatureGate",
  "@/components/Subscription/Organization": "@/features/subscription/ui/organization",
  "@/components/Subscription/shared/signupValidation": "@/features/subscription/lib/signupValidation",
  
  // Admin/Educator components - move to college-admin
  "@/components/educator/GradingModal": "@/features/college-admin/ui/modals/GradingModal",
  "@/components/educator/modals/Addstudentmodal": "@/features/college-admin/ui/modals/AddStudentModal",
  "@/components/admin/modals/AddAttendanceSessionModal": "@/features/college-admin/ui/modals/AddAttendanceSessionModal",
  "@/components/admin/modals/AttendanceDetailsModal": "@/features/college-admin/ui/modals/AttendanceDetailsModal",
  "@/components/admin/modals/StudentHistoryModal": "@/features/college-admin/ui/modals/StudentHistoryModal",
  "@/components/admin/components/CareerPathDrawer": "@/features/counselling/ui/CareerPathDrawer",
  "@/components/admin/KPICard": "@/widgets/kpi-dashboard/ui/KPICard",
  "@/components/admin/Header": "@/widgets/admin-navigation/ui/AdminHeader",
  "@/components/admin/Sidebar": "@/widgets/admin-navigation/ui/AdminSidebar",
  "@/components/admin/AICounsellingFAB": "@/features/counselling/ui/AICounsellingFAB",
  
  // Messaging
  "@/components/messaging/MessageModal": "@/features/messaging/ui/MessageModal",
  
  // Exams
  "@/components/exams/ExamWorkflowManager": "@/features/exams/ui/ExamWorkflowManager",
  
  // Modals
  "@/components/modals/CompanyStatusModal": "@/features/placement/ui/modals/CompanyStatusModal",
  "@/components/shared/ConfirmModal": "@/shared/ui/ConfirmModal",
  
  // Common/Shared
  "@/components/common/ImageUpload": "@/shared/ui/ImageUpload",
  "@/components/organization/OrganizationGuard": "@/features/subscription/ui/organization/OrganizationGuard",
  "@/components/ProtectedRoute": "@/shared/ui/ProtectedRoute",
  "@/components/Footer": "@/shared/ui/Footer",
  "@/components/Homepage": "@/shared/ui/homepage",
  "@/components/FloatingAIButton": "@/shared/ui/FloatingAIButton",
  "@/components/Button": "@/shared/ui/Button",
  
  // Students components
  "@/components/Students/components/Header": "@/features/student-profile/ui/Header",
  "@/components/Students/components/ProfileHeroEdit": "@/features/student-profile/ui/ProfileHeroEdit",
  "@/components/Students/components/ui/toaster": "@/shared/ui/toaster",
  "@/components/Students/components/ui/label": "@/shared/ui/label",
  "@/components/Students/components/ui/input": "@/shared/ui/input",
  "@/components/Students/components/ui/wavy-background": "@/shared/ui/wavy-background",
  "@/components/Students/components/ProfileEditModals": "@/features/student-profile/ui/ProfileEditModals",
  "@/components/Students/data/mockData": "@/features/student-profile/lib/mockData",
  "@/components/ui/toggle": "@/shared/ui/toggle",
  
  // Educator
  "@/components/educator/Header": "@/features/college-admin/ui/Header",
  "@/components/educator/Sidebar": "@/features/college-admin/ui/Sidebar",
  
  // Recruiter
  "@/components/Recruiter/components/Header": "@/features/recruiter-copilot/ui/Header",
  "@/components/Recruiter/components/Sidebar": "@/features/recruiter-copilot/ui/Sidebar",
  "@/components/Recruiter/components/MobileTabBar": "@/features/recruiter-copilot/ui/MobileTabBar",
  "@/components/Recruiter/components/CandidateProfileDrawer": "@/features/recruiter-copilot/ui/CandidateProfileDrawer",
  "@/components/FloatingRecruiterAIButton": "@/shared/ui/FloatingRecruiterAIButton",
  "@/components/FloatingEducatorAIButton": "@/shared/ui/FloatingEducatorAIButton",
  
  // Subscription
  "@/components/Subscription/SubscriptionPurchaseHeader": "@/features/subscription/ui/shared/SubscriptionPurchaseHeader",
  
  // Misc
  "@/components/ScrollToTop": "@/shared/ui/ScrollToTop",
};

async function fixImports() {
  console.log('🔧 Fixing remaining component imports...\n');
  
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/migration/**', '**/components/**']
  });
  
  let updated = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    
    for (const [oldPath, newPath] of Object.entries(replacements)) {
      const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, newPath);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      updated++;
      console.log(`✅ ${file}`);
    }
  }
  
  console.log(`\n✨ Updated ${updated} files`);
}

fixImports().catch(console.error);
