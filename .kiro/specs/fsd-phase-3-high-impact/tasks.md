# Implementation Plan: FSD Phase 3 - High-Impact Features

## Overview

This plan implements Phase 3 of the Feature-Sliced Design (FSD) migration by creating four feature structures (Messaging, Courses, Student Profile, Subscription) and migrating all related code from the flat structure. The migration uses a copy-first strategy to maintain backward compatibility and includes aggressive consolidation to reduce code duplication.

**Execution Order:** Messaging → Courses → Subscription → Student Profile (simplest to most complex)

## Tasks

### Phase 3.1: Messaging Feature (Week 1)

- [x] 1. Create Messaging Feature Structure
  - Create src/features/messaging/ with ui/, model/, api/, lib/ subdirectories
  - Verify directory structure matches design specification
  - _Requirements: 1.1, 2.6_

- [x] 2. Migrate Messaging UI Components
  - [x] 2.1 Copy messaging components to features/messaging/ui/
    - Copy MessageModal.tsx
    - Copy DeleteConversationModal.tsx
    - Copy all 12 role-specific conversation modals
    - _Requirements: 2.1_
  
  - [x] 2.2 Consolidate conversation modals
    - Create unified ConversationModal.tsx component
    - Create conversationConfig.ts in lib/ with role configurations
    - Test all role combinations work with unified modal
    - _Requirements: 2.5, 6.1-6.6_
  
  - [x] 2.3 Create features/messaging/ui/index.ts
    - Export MessageModal, ConversationModal, DeleteConversationModal
    - _Requirements: 2.6_

- [x] 3. Migrate Messaging Services
  - [x] 3.1 Copy messageService.ts to features/messaging/api/
    - Update Supabase client import to @/shared/api
    - Preserve all service methods
    - _Requirements: 2.2_
  
  - [x] 3.2 Create features/messaging/api/index.ts
    - Export messageService
    - _Requirements: 2.6_

- [x] 4. Migrate Messaging State Management
  - [x] 4.1 Copy hooks to features/messaging/model/
    - Copy useMessages.ts
    - Copy useMessageNotifications.tsx
    - Copy useTypingIndicator.ts
    - _Requirements: 2.3_
  
  - [x] 4.2 Copy store to features/messaging/model/
    - Copy useMessageStore.ts from stores/
    - _Requirements: 2.4_
  
  - [x] 4.3 Create features/messaging/model/index.ts
    - Export all hooks and store
    - _Requirements: 2.6_

- [x] 5. Create Messaging Public API
  - [x] 5.1 Create features/messaging/index.ts
    - Export primary UI components
    - Export hooks (useMessages, useMessageNotifications)
    - Export messageService
    - Export types (Message, Conversation, ConversationType)
    - _Requirements: 2.6, 10.1_

- [x] 6. Update Messaging Imports
  - [x] 6.1 Update imports across codebase
    - Find all imports from components/messaging/
    - Update to @/features/messaging
    - _Requirements: 2.7, 11.1_
  
  - [x] 6.2 Update imports from services/messageService
    - Update to @/features/messaging/api
    - _Requirements: 11.5_
  
  - [x] 6.3 Update imports from hooks/
    - Update messaging hook imports to @/features/messaging/model
    - _Requirements: 11.8_

- [ ] 7. Validate Messaging Feature
  - [ ] 7.1 Test real-time messaging
    - Send messages between users
    - Verify real-time delivery
    - _Requirements: 2.8, 12.1_
  
  - [ ] 7.2 Test typing indicators
    - Verify typing status shows correctly
    - _Requirements: 2.9, 12.2_
  
  - [ ] 7.3 Test notifications
    - Verify message notifications appear
    - _Requirements: 2.10, 12.3_
  
  - [ ] 7.4 Test all role combinations
    - Test student-educator, admin-educator, etc.
    - _Requirements: 2.11, 12.4_
  
  - [ ] 7.5 Test conversation deletion
    - Verify conversations can be deleted
    - _Requirements: 2.12, 12.5_



### Phase 3.2: Courses Feature (Week 2)

- [x] 8. Create Courses Feature Structure
  - Create src/features/courses/ with ui/, model/, api/, lib/ subdirectories
  - Create lib/recommendations/ subdirectory for recommendation engine
  - Verify directory structure matches design specification
  - _Requirements: 1.2, 3.8_

- [x] 9. Migrate Course UI Components
  - [x] 9.1 Copy educator course components to features/courses/ui/
    - Copy CourseCard.tsx
    - Copy CourseDetailDrawer.tsx
    - Copy CourseFilters.tsx
    - Copy CreateCourseModal.tsx
    - Copy AddLessonModal.tsx
    - Copy AssignEducatorModal.tsx
    - Copy ResourceUploadComponent.tsx
    - _Requirements: 3.1_
  
  - [x] 9.2 Copy student course components to features/courses/ui/
    - Copy CourseDetailModal.jsx
    - Copy QuizProgressTracker.jsx
    - Copy RestoreProgressModal.jsx
    - Copy SyncStatusIndicator.jsx
    - _Requirements: 3.1_
  
  - [x] 9.3 Move CoursePlayer from pages to features/courses/ui/
    - Copy CoursePlayer.jsx from pages/student/
    - Update imports within CoursePlayer
    - _Requirements: 3.4_
  
  - [x] 9.4 Consolidate course components
    - Merge educator/student CourseCard into unified component
    - Merge educator/student CourseDetail into unified drawer
    - Test both educator and student views
    - _Requirements: 3.5, 7.1-7.6_
  
  - [x] 9.5 Create features/courses/ui/index.ts
    - Export all course UI components
    - _Requirements: 3.8_

- [-] 10. Migrate Course Services
  - [x] 10.1 Copy course services to features/courses/api/
    - Copy courseApiService.ts
    - Copy courseProgressService.js
    - Copy courseEnrollmentService.js
    - _Requirements: 3.2_
  
  - [x] 10.2 Consolidate course services
    - Create unified courseService.ts
    - Merge methods from courseApiService, courseProgressService, courseEnrollmentService
    - Create enrollmentService.ts for enrollment operations
    - Create progressService.ts for progress tracking
    - Test all service methods
    - _Requirements: 3.6, 7.1-7.6_
  
  - [x] 10.3 Create features/courses/api/index.ts
    - Export courseService, enrollmentService, progressService
    - _Requirements: 3.8_

- [x] 11. Migrate Course Recommendation Engine
  - [x] 11.1 Copy recommendation services to features/courses/lib/recommendations/
    - Copy recommendationService.js
    - Copy courseRepository.js
    - Copy embeddingService.js
    - Copy skillGapMatcher.js
    - _Requirements: 3.7, 22.1-22.7_
  
  - [x] 11.2 Create features/courses/lib/recommendations/index.ts
    - Export getCourseRecommendations
    - _Requirements: 22.1_
  
  - [x] 11.3 Create features/courses/lib/index.ts
    - Export recommendation functions
    - Export courseValidation utilities
    - _Requirements: 3.8_

- [x] 12. Migrate Course State Management
  - [x] 12.1 Copy course hooks to features/courses/model/
    - Copy useCoursePerformance.ts
    - _Requirements: 3.3_
  
  - [x] 12.2 Create additional course hooks
    - Create useCourses.ts for course list and filters
    - Create useCourseEnrollment.ts for enrollment operations
    - Create useCourseProgress.ts for progress tracking
    - _Requirements: 3.3_
  
  - [x] 12.3 Create features/courses/model/index.ts
    - Export all course hooks
    - _Requirements: 3.8_

- [x] 13. Create Courses Public API
  - [x] 13.1 Create features/courses/index.ts
    - Export primary UI components (CourseCard, CourseDetailDrawer, CoursePlayer, CreateCourseModal)
    - Export hooks (useCourses, useCourseEnrollment, useCourseProgress)
    - Export services (courseService, enrollmentService)
    - Export getCourseRecommendations
    - Export types (Course, Lesson, Enrollment, Progress)
    - _Requirements: 3.8, 10.2_

- [x] 14. Update Course Imports
  - [x] 14.1 Update imports from components/educator/courses/
    - Update to @/features/courses
    - _Requirements: 3.9, 11.2_
  
  - [x] 14.2 Update imports from components/student/courses/
    - Update to @/features/courses
    - _Requirements: 3.9, 11.2_
  
  - [x] 14.3 Update imports from services/
    - Update courseApiService imports to @/features/courses/api
    - Update courseProgressService imports to @/features/courses/api
    - Update courseEnrollmentService imports to @/features/courses/api
    - _Requirements: 11.6_
  
  - [x] 14.4 Update imports from pages/student/CoursePlayer
    - Update to @/features/courses/ui
    - _Requirements: 11.2_

- [ ] 15. Validate Courses Feature
  - [-] 15.1 Test course creation (educator)
    - Create new course
    - Add lessons
    - Upload resources
    - _Requirements: 3.10, 13.1_
  
  - [ ] 15.2 Test course enrollment (student)
    - Enroll in course
    - Access course content
    - _Requirements: 3.11, 13.2_
  
  - [ ] 15.3 Test progress tracking
    - Watch video
    - Complete lesson
    - Verify progress updates
    - _Requirements: 3.12, 13.3_
  
  - [ ] 15.4 Test course recommendations
    - View recommendations
    - Verify skill gap matching
    - _Requirements: 3.13, 13.4_
  
  - [ ] 15.5 Test video player
    - Play video
    - Verify controls work
    - _Requirements: 3.14, 13.5_
  
  - [ ] 15.6 Test quiz integration
    - Take quiz
    - View results
    - _Requirements: 3.15, 13.6_
  
  - [ ] 15.7 Test course filtering
    - Apply filters
    - Search courses
    - _Requirements: 3.16, 13.7_



### Phase 3.3: Subscription Feature (Week 3)

- [x] 16. Create Subscription Feature Structure
  - Create src/features/subscription/ with ui/, model/, api/, lib/ subdirectories
  - Create ui/individual/, ui/organization/, ui/shared/ subdirectories
  - Verify directory structure matches design specification
  - _Requirements: 1.4, 5.7, 23.1-23.7_

- [x] 17. Migrate Individual Subscription UI
  - [x] 17.1 Copy individual subscription components to features/subscription/ui/individual/
    - Copy SubscriptionDashboard.jsx
    - Copy SubscriptionDetails.jsx
    - Copy AddOnMarketplace.jsx
    - Copy AddOnCard.jsx
    - Copy BundleCard.jsx
    - Copy ReceiptCard.jsx
    - Copy TransactionList.jsx
    - Copy TransactionGrid.jsx
    - Copy UpgradePrompt.jsx
    - _Requirements: 5.1_
  
  - [x] 17.2 Move subscription pages to features/subscription/ui/individual/
    - Copy SubscriptionPlans.jsx from pages/subscription/
    - Copy MySubscription.jsx from pages/subscription/
    - Copy AddOns.jsx from pages/subscription/
    - _Requirements: 5.5_
  
  - [x] 17.3 Create features/subscription/ui/individual/index.ts
    - Export all individual subscription components
    - _Requirements: 5.8_

- [x] 18. Migrate Organization Subscription UI
  - [x] 18.1 Copy organization components to features/subscription/ui/organization/
    - Copy OrganizationDashboard.tsx
    - Copy LicensePoolManager.tsx
    - Copy BulkPurchaseWizard.tsx
    - Copy InvitationManager.tsx
    - Copy MemberAssignments.tsx
    - Copy BillingDashboard.tsx
    - Copy CreatePoolModal.tsx
    - Copy EditPoolModal.tsx
    - Copy DeletePoolModal.tsx
    - Copy AssignToPoolModal.tsx
    - Copy PoolAssignmentsModal.tsx
    - Copy MemberTypeSelector.tsx
    - Copy SeatSelector.tsx
    - Copy PricingBreakdown.tsx
    - _Requirements: 5.2_
  
  - [x] 18.2 Create features/subscription/ui/organization/index.ts
    - Export all organization subscription components
    - _Requirements: 5.8_

- [x] 19. Migrate Shared Subscription UI
  - [x] 19.1 Copy shared components to features/subscription/ui/shared/
    - Copy SubscriptionGate.jsx
    - Copy SubscriptionProtectedRoute.jsx
    - Copy SubscriptionStatusWidget.jsx
    - Copy FeatureGate.jsx
    - Copy SubscriptionBanner.jsx
    - Copy SubscriptionPrefetch.jsx
    - Copy SubscriptionRouteGuard.jsx
    - _Requirements: 5.1_
  
  - [x] 19.2 Move payment result pages to features/subscription/ui/shared/
    - Copy PaymentSuccess.jsx from pages/subscription/
    - Copy PaymentFailure.jsx from pages/subscription/
    - _Requirements: 5.5_
  
  - [x] 19.3 Create features/subscription/ui/shared/index.ts
    - Export all shared subscription components
    - _Requirements: 5.8_
  
  - [x] 19.4 Create features/subscription/ui/index.ts
    - Export from individual/, organization/, shared/
    - _Requirements: 5.8_

- [x] 20. Migrate Subscription Services
  - [x] 20.1 Copy subscription services to features/subscription/api/
    - Copy subscriptionService.js
    - Copy paymentVerificationService.js
    - Copy razorpayService.js
    - _Requirements: 5.3_
  
  - [x] 20.2 Create additional services
    - Create organizationService.ts for organization operations
    - Create licensePoolService.ts for license management
    - _Requirements: 5.3_
  
  - [x] 20.3 Create features/subscription/api/index.ts
    - Export all subscription services
    - _Requirements: 5.8_

- [x] 21. Migrate Subscription State Management
  - [x] 21.1 Copy subscription hooks to features/subscription/model/
    - Copy useSubscription.js
    - Copy useOrganizationSubscription.ts
    - Copy usePaymentVerification.js
    - Copy useSubscriptionPlansData.js
    - Copy useSubscriptionQuery.js
    - _Requirements: 5.4_
  
  - [x] 21.2 Create features/subscription/model/index.ts
    - Export all subscription hooks
    - _Requirements: 5.8_

- [x] 22. Migrate Subscription Utilities
  - [x] 22.1 Copy utilities to features/subscription/lib/
    - Copy subscriptionHelpers.js
    - Copy subscriptionRoutes.js
    - Copy pdfReceiptGenerator.js from services/Subscriptions/
    - _Requirements: 5.6_
  
  - [x] 22.2 Create featureGating.ts utility
    - Extract feature gating logic
    - _Requirements: 5.6_
  
  - [x] 22.3 Create features/subscription/lib/index.ts
    - Export all subscription utilities
    - _Requirements: 5.8_

- [x] 23. Create Subscription Public API
  - [x] 23.1 Create features/subscription/index.ts
    - Export individual subscription components
    - Export organization subscription components
    - Export shared components (SubscriptionGate, FeatureGate)
    - Export hooks (useSubscription, useOrganizationSubscription)
    - Export services (subscriptionService, paymentService)
    - Export types (Subscription, SubscriptionPlan, LicensePool)
    - _Requirements: 5.8, 10.4_

- [x] 24. Update Subscription Imports
  - [x] 24.1 Update imports from components/Subscription/
    - Update to @/features/subscription
    - _Requirements: 5.9, 11.4_
  
  - [x] 24.2 Update imports from services/Subscriptions/
    - Update to @/features/subscription/api
    - _Requirements: 11.7_
  
  - [x] 24.3 Update imports from hooks/Subscription/
    - Update to @/features/subscription/model
    - _Requirements: 11.8_
  
  - [x] 24.4 Update imports from pages/subscription/
    - Update to @/features/subscription/ui
    - _Requirements: 11.4_

- [ ] 25. Validate Subscription Feature
  - [ ] 25.1 Test subscription plan selection
    - View plans
    - Select plan
    - _Requirements: 5.10, 15.1_
  
  - [ ] 25.2 Test payment processing
    - Initiate payment
    - Complete payment via Razorpay
    - Verify payment success
    - _Requirements: 5.11, 15.2, 16.1-16.9_
  
  - [ ] 25.3 Test payment verification
    - Verify payment signature
    - Update subscription status
    - _Requirements: 5.12, 15.3_
  
  - [ ] 25.4 Test subscription dashboard
    - View current subscription
    - View transaction history
    - _Requirements: 5.13, 15.4_
  
  - [ ] 25.5 Test add-on marketplace
    - Browse add-ons
    - Purchase add-on
    - _Requirements: 5.14, 15.5_
  
  - [ ] 25.6 Test organization subscription
    - Create organization subscription
    - View organization dashboard
    - _Requirements: 5.15, 15.6_
  
  - [ ] 25.7 Test license pool management
    - Create license pool
    - Edit pool
    - Delete pool
    - _Requirements: 5.16, 15.7_
  
  - [ ] 25.8 Test bulk purchase
    - Complete bulk purchase wizard
    - Allocate licenses
    - _Requirements: 5.17, 15.8_
  
  - [ ] 25.9 Test invitation system
    - Send invitation
    - Accept invitation
    - Activate license
    - _Requirements: 5.18, 15.9_
  
  - [ ] 25.10 Test feature gating
    - Verify feature access based on subscription
    - Test protected routes
    - _Requirements: 5.19, 15.11_
  
  - [ ] 25.11 Test receipt generation
    - Generate PDF receipt
    - Verify receipt content
    - _Requirements: 5.12, 15.12_
  
  - [ ] 25.12 Test billing dashboard
    - View billing history
    - View transaction details
    - _Requirements: 5.20, 15.14_



### Phase 3.4: Student Profile Feature (Week 4)

- [x] 26. Create Student Profile Feature Structure
  - Create src/features/student-profile/ with ui/, model/, api/, lib/ subdirectories
  - Create ui/components/, ui/tabs/, ui/modals/ subdirectories
  - Verify directory structure matches design specification
  - _Requirements: 1.3, 4.6_

- [x] 27. Migrate Student Profile UI Components
  - [x] 27.1 Copy main drawer to features/student-profile/ui/
    - Copy StudentProfileDrawer.tsx
    - _Requirements: 4.1_
  
  - [x] 27.2 Copy sub-components to features/student-profile/ui/components/
    - Copy Badge.tsx
    - Copy CertificateCard.tsx
    - Copy LessonSection.tsx
    - Copy ProjectCard.tsx
    - Copy StatusBadge.tsx
    - Copy TabButton.tsx
    - _Requirements: 4.1_
  
  - [x] 27.3 Copy tabs to features/student-profile/ui/tabs/
    - Copy OverviewTab.tsx
    - Copy AcademicTab.tsx
    - Copy ProjectsTab.tsx
    - Copy CertificatesTab.tsx
    - Copy AssessmentsTab.tsx
    - Copy ExamResultsTab.tsx
    - Copy CoursesTab.tsx
    - Copy CurriculumTab.tsx
    - Copy DocumentsTab.tsx
    - Copy NotesTab.tsx
    - Copy ClubsCompetitionsTab.tsx
    - Copy EventsTab.tsx
    - _Requirements: 4.1, 4.6_
  
  - [x] 27.4 Copy modals to features/student-profile/ui/modals/
    - Copy AdmissionNoteModal.tsx
    - Copy ApprovalModal.tsx
    - Copy DocumentsModal.tsx
    - Copy ExportModal.tsx
    - Copy GraduationModal.tsx
    - Copy MessageModal.tsx
    - Copy PromotionModal.tsx
    - Copy SchoolAdmissionNoteModal.tsx
    - _Requirements: 4.1_
  
  - [x] 27.5 Create index.ts files for UI subdirectories
    - Create ui/components/index.ts
    - Create ui/tabs/index.ts
    - Create ui/modals/index.ts
    - Create ui/index.ts
    - _Requirements: 4.7_

- [x] 28. Consolidate Student Services
  - [x] 28.1 Analyze existing student services
    - Review studentService.js
    - Review studentServiceProfile.js
    - Review studentServiceAdapted.js
    - Review studentServiceReal.js
    - Identify unique methods and duplicates
    - _Requirements: 4.4, 8.1-8.7_
  
  - [x] 28.2 Create unified studentProfileService.ts
    - Merge all methods from 4 service variants
    - Eliminate duplicate methods
    - Preserve all unique functionality
    - Convert to TypeScript
    - _Requirements: 4.4, 8.2-8.4_
  
  - [x] 28.3 Copy specialized services to features/student-profile/api/
    - Copy studentDocumentService.ts
    - Copy studentManagementService.ts
    - Copy studentEnrollmentService.ts
    - Copy studentExamService.ts
    - Copy studentActivityService.js
    - Copy studentNotificationService.js
    - Copy studentPipelineService.js
    - Copy studentClassService.ts
    - Copy studentSettingsService.js
    - _Requirements: 4.2_
  
  - [x] 28.4 Create features/student-profile/api/index.ts
    - Export studentProfileService
    - Export specialized services
    - _Requirements: 4.7_

- [x] 29. Consolidate Student Hooks
  - [x] 29.1 Analyze existing student hooks
    - Review all 20+ student hooks
    - Group by domain (profile, academics, portfolio, activity, messages, settings)
    - Identify consolidation opportunities
    - _Requirements: 4.5, 9.1-9.7_
  
  - [x] 29.2 Create useStudentProfile.ts
    - Consolidate: useStudentData, useStudentDataById, useStudentDataByEmail, useStudentEducation, useStudentExperience, useStudentSkills
    - Return: data, education, experience, skills
    - _Requirements: 4.5, 9.2-9.6_
  
  - [x] 29.3 Create useStudentAcademics.ts
    - Consolidate: academic-related hooks
    - Return: curriculum, exams, grades, academic records
    - _Requirements: 4.5, 9.2-9.6_
  
  - [x] 29.4 Create useStudentPortfolio.ts
    - Consolidate: useStudentProjects, useStudentCertificates, useStudentTrainings
    - Return: projects, certificates, trainings
    - _Requirements: 4.5, 9.2-9.6_
  
  - [x] 29.5 Create useStudentActivity.ts
    - Consolidate: useStudentLearning, useStudentAchievements, useStudentRecentUpdates, useStudentRecentUpdatesById
    - Return: learning, achievements, updates
    - _Requirements: 4.5, 9.2-9.6_
  
  - [x] 29.6 Create useStudentMessages.ts
    - Consolidate: useStudentMessages, useStudentMessageNotifications, useStudentEducatorMessages, useStudentAdminMessages, useStudentCollegeAdminMessages, useStudentCollegeLecturerMessages
    - Return: messages, notifications, conversations
    - _Requirements: 4.5, 9.2-9.6_
  
  - [x] 29.7 Create useStudentSettings.ts
    - Consolidate: useStudentSettings
    - Return: settings, preferences
    - _Requirements: 4.5, 9.2-9.6_
  
  - [x] 29.8 Copy internal hooks to features/student-profile/model/
    - Copy useStudentData.ts (internal)
    - Copy useStudentActions.ts (internal)
    - _Requirements: 4.3_
  
  - [x] 29.9 Create features/student-profile/model/index.ts
    - Export 6 domain hooks
    - Export types
    - _Requirements: 4.7_

- [x] 30. Migrate Student Profile Utilities
  - [x] 30.1 Create profile utilities in features/student-profile/lib/
    - Create profileValidation.ts
    - Create profileCompletion.ts
    - Create profileExport.ts
    - _Requirements: 4.1_
  
  - [x] 30.2 Create features/student-profile/lib/index.ts
    - Export all utilities
    - _Requirements: 4.7_

- [x] 31. Create Student Profile Public API
  - [x] 31.1 Create features/student-profile/index.ts
    - Export StudentProfileDrawer
    - Export domain hooks (useStudentProfile, useStudentAcademics, useStudentPortfolio, useStudentActivity)
    - Export services (studentProfileService, studentDocumentService)
    - Export types (StudentProfile, AcademicRecord, Project, Certificate)
    - _Requirements: 4.7, 10.3_

- [x] 32. Update Student Profile Imports
  - [x] 32.1 Update imports from components/shared/StudentProfileDrawer/
    - Update to @/features/student-profile
    - _Requirements: 4.8, 11.3_
  
  - [x] 32.2 Update imports from services/student*
    - Update to @/features/student-profile/api
    - _Requirements: 11.7_
  
  - [x] 32.3 Update imports from hooks/useStudent*
    - Update to @/features/student-profile/model
    - _Requirements: 11.8_

- [ ] 33. Validate Student Profile Feature
  - [ ] 33.1 Test profile drawer opening
    - Open student profile
    - Verify all tabs visible
    - _Requirements: 4.9, 14.1_
  
  - [ ] 33.2 Test all profile tabs
    - Test Overview tab
    - Test Academic tab
    - Test Projects tab
    - Test Certificates tab
    - Test Assessments tab
    - Test Exams tab
    - Test Courses tab
    - Test Curriculum tab
    - Test Documents tab
    - Test Notes tab
    - Test Clubs/Competitions tab
    - Test Events tab
    - _Requirements: 4.9, 14.2-14.9_
  
  - [ ] 33.3 Test profile editing
    - Edit profile information
    - Save changes
    - _Requirements: 4.10, 14.10_
  
  - [ ] 33.4 Test document management
    - Upload document
    - View documents
    - Delete document
    - _Requirements: 4.11, 14.11_
  
  - [ ] 33.5 Test admission notes
    - Add admission note
    - View notes
    - _Requirements: 4.12, 14.12_
  
  - [ ] 33.6 Test approval workflow
    - Approve student
    - Verify status update
    - _Requirements: 4.12, 14.13_
  
  - [ ] 33.7 Test promotion
    - Promote student
    - Verify grade level update
    - _Requirements: 4.13, 14.14_
  
  - [ ] 33.8 Test graduation
    - Graduate student
    - Verify graduation status
    - _Requirements: 4.13, 14.15_
  
  - [ ] 33.9 Test profile export
    - Export profile to PDF
    - Verify PDF content
    - _Requirements: 4.14, 14.16_
  
  - [ ] 33.10 Test profile completion tracking
    - View completion percentage
    - Verify completion calculation
    - _Requirements: 4.15_
  
  - [ ] 33.11 Test feature integrations
    - Test messaging integration
    - Test courses integration
    - Test assessments integration
    - _Requirements: 4.16_



### Phase 3.5: Cross-Feature Integration & Validation

- [x] 34. Handle Cross-Feature Dependencies
  - [x] 34.1 Identify feature dependencies
    - Document Messaging ← Auth
    - Document Courses ← Auth
    - Document Student Profile ← Auth
    - Document Student Profile ← Messaging
    - Document Student Profile ← Courses
    - Document Subscription ← Auth
    - _Requirements: 24.1-24.7_
  
  - [x] 34.2 Validate allowed dependencies
    - Verify all features import from @/features/auth
    - Verify all features import from @/shared
    - _Requirements: 24.3_
  
  - [x] 34.3 Resolve disallowed dependencies
    - Identify direct feature-to-feature imports
    - Extract shared components to @/shared/ui if needed
    - Use composition at page level for complex interactions
    - _Requirements: 24.2, 24.4-24.7_

- [x] 35. Validate Build Process
  - [x] 35.1 Run TypeScript compilation
    - Execute tsc --noEmit
    - Verify no compilation errors
    - _Requirements: 17.1, 17.6_
  
  - [x] 35.2 Run production build
    - Execute npm run build
    - Verify build succeeds
    - Verify bundle size within 5% of baseline
    - _Requirements: 17.2-17.5_
  
  - [x] 35.3 Verify path resolution
    - Check all @/features/* imports resolve
    - Check all public API imports work
    - _Requirements: 17.2, 17.7_

- [ ] 36. Validate Test Suite
  - [ ] 36.1 Run all tests
    - Execute npm run test
    - Verify all tests pass
    - _Requirements: 18.1-18.2_
  
  - [ ] 36.2 Verify test imports
    - Check test files use new import paths
    - Update test imports if needed
    - _Requirements: 18.3_
  
  - [ ] 36.3 Run feature-specific tests
    - Run messaging tests
    - Run courses tests
    - Run student profile tests
    - Run subscription tests
    - _Requirements: 18.4-18.7_
  
  - [ ] 36.4 Test payment processing
    - Run payment integration tests
    - Verify Razorpay integration works
    - _Requirements: 18.8_

- [ ] 37. Validate Application Functionality
  - [ ] 37.1 Manual smoke testing
    - Test messaging flows
    - Test course enrollment and progress
    - Test student profile viewing
    - Test subscription purchase
    - _Requirements: 19.1-19.3_
  
  - [ ] 37.2 Verify no runtime errors
    - Check browser console for errors
    - Verify no broken imports
    - _Requirements: 19.1, 19.8_
  
  - [ ] 37.3 Test all pages render
    - Navigate to all major pages
    - Verify pages load without errors
    - _Requirements: 19.2_
  
  - [ ] 37.4 Verify feature functionality preserved
    - Test all Phase 3 features work as before
    - Verify no regressions
    - _Requirements: 19.3-19.6_

- [ ] 38. Verify Backward Compatibility
  - [ ] 38.1 Verify original files preserved
    - Check components/messaging/ still exists
    - Check components/educator/courses/ still exists
    - Check components/student/courses/ still exists
    - Check components/shared/StudentProfileDrawer/ still exists
    - Check components/Subscription/ still exists
    - Check services/ files still exist
    - Check hooks/ files still exist
    - _Requirements: 20.1_
  
  - [ ] 38.2 Test dual import support
    - Verify old import paths still work
    - Verify new import paths work
    - _Requirements: 20.3_
  
  - [ ] 38.3 Document deprecation timeline
    - Mark old paths as deprecated
    - Set timeline for removal (Phase 6)
    - _Requirements: 20.4-20.5_

- [ ] 39. Document Migration Results
  - [ ] 39.1 Generate migration statistics
    - Count files migrated per feature
    - Count import updates per feature
    - Calculate file reduction percentages
    - _Requirements: 21.1, 21.4_
  
  - [ ] 39.2 Document public APIs
    - Document messaging public API
    - Document courses public API
    - Document student profile public API
    - Document subscription public API
    - _Requirements: 21.5_
  
  - [ ] 39.3 Document consolidation decisions
    - Document messaging modal consolidation
    - Document course service consolidation
    - Document student service consolidation
    - Document student hook consolidation
    - _Requirements: 21.7_
  
  - [ ] 39.4 Document import examples
    - Provide examples for each feature
    - Show before/after import patterns
    - _Requirements: 21.8_
  
  - [ ] 39.5 Identify files that couldn't be migrated
    - List any problematic files
    - Document reasons
    - _Requirements: 21.3_
  
  - [ ] 39.6 Document deviations from plan
    - Note any changes from original design
    - Explain reasons for deviations
    - _Requirements: 21.6, 21.9_

- [ ] 40. Final Phase 3 Validation
  - [ ] 40.1 Verify all 4 features migrated
    - Messaging feature complete
    - Courses feature complete
    - Student profile feature complete
    - Subscription feature complete
    - _Requirements: All Phase 3 requirements_
  
  - [ ] 40.2 Verify consolidation achievements
    - Messaging: 18 → 8 files (56% reduction)
    - Courses: 27 → 20 files (26% reduction)
    - Student Profile: 63+ → 35 files (44% reduction)
    - Subscription: 60+ → 45 files (25% reduction)
    - _Requirements: 6.1-6.6, 7.1-7.6, 8.1-8.7, 9.1-9.7_
  
  - [ ] 40.3 Verify import updates complete
    - ~350+ imports updated across codebase
    - All features use new import paths
    - _Requirements: 11.1-11.11_
  
  - [ ] 40.4 Verify all functionality preserved
    - All messaging features work
    - All course features work
    - All student profile features work
    - All subscription features work
    - _Requirements: 12.1-12.5, 13.1-13.7, 14.1-14.16, 15.1-15.14_
  
  - [ ] 40.5 Create Phase 3 migration report
    - Summarize migration results
    - Document lessons learned
    - Provide recommendations for Phase 4
    - _Requirements: 21.1-21.9, 25.8_

## Success Criteria

### Code Organization
- ✅ All 4 features organized into FSD structure
- ✅ Clear feature boundaries established
- ✅ Public APIs created for all features
- ✅ 36% overall file reduction achieved

### Consolidation
- ✅ Messaging modals: 12 → 1 unified component
- ✅ Student services: 4 → 1 unified service
- ✅ Student hooks: 20+ → 6 domain hooks
- ✅ Course services: 3 → 1 unified service

### Import Updates
- ✅ ~350+ import statements updated
- ✅ ~200+ files affected
- ✅ All imports use public APIs

### Functionality
- ✅ All messaging features work
- ✅ All course features work
- ✅ All student profile features work
- ✅ All subscription features work
- ✅ Payment integration works
- ✅ Real-time messaging works

### Quality
- ✅ TypeScript compilation passes
- ✅ Build process succeeds
- ✅ Test suite passes
- ✅ No runtime errors
- ✅ Backward compatibility maintained

## Timeline

- **Week 1:** Messaging Feature (Tasks 1-7)
- **Week 2:** Courses Feature (Tasks 8-15)
- **Week 3:** Subscription Feature (Tasks 16-25)
- **Week 4:** Student Profile Feature (Tasks 26-33)
- **Week 4 (end):** Integration & Validation (Tasks 34-40)

**Total Duration:** 4 weeks

## Notes

- Execute features in order: Messaging → Courses → Subscription → Student Profile
- Test thoroughly after each feature migration
- Maintain backward compatibility throughout
- Document consolidation decisions
- Property-based tests marked with * are optional but recommended
- All original files remain in place until Phase 6
