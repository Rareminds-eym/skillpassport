# Requirements Document

## Introduction

This specification addresses the remaining Feature-Sliced Design (FSD) architectural violations in the codebase. After the initial FSD migration, 14 violations remain across two categories: pages importing from app layer (4 violations) and app layer importing from features/widgets layers (10 violations). These violations break FSD's strict layer hierarchy and must be resolved to maintain architectural integrity.

## Glossary

- **FSD_Architecture**: Feature-Sliced Design architectural methodology that enforces strict layer hierarchy
- **Pages_Layer**: Top-level FSD layer containing route-level components
- **App_Layer**: FSD layer responsible for application initialization, providers, and global configuration
- **Features_Layer**: FSD layer containing business logic features
- **Widgets_Layer**: FSD layer containing composite UI components
- **Shared_Layer**: Bottom-level FSD layer containing reusable utilities, UI components, and types
- **Layer_Violation**: Import dependency that breaks FSD's hierarchical rules
- **Header_Component**: Navigation component currently exported from app/layouts but should be in shared or widgets
- **Tour_System**: Application tour/onboarding system with types and configuration
- **Organization_Guard**: Route guard component that checks organization setup status

## Requirements

### Requirement 1: Fix Pages Layer Importing from App Layer

**User Story:** As a developer, I want pages to not depend on the app layer, so that the FSD layer hierarchy is maintained and pages remain portable.

#### Acceptance Criteria

1. WHEN SkillPassportPreRegistration page is rendered, THE Page SHALL import Header from shared layer instead of app layer
2. WHEN SimpleEventRegistration page is rendered, THE Page SHALL import Header from shared layer instead of app layer
3. WHEN EventSalesSuccess page is rendered, THE Page SHALL import Header from shared layer instead of app layer
4. WHEN EventSalesFailure page is rendered, THE Page SHALL import Header from shared layer instead of app layer
5. THE Shared_Layer SHALL export Header component through its public API
6. THE App_Layouts_Index SHALL NOT re-export Header from shared layer (remove the proxy export)
7. FOR ALL pages importing Header, changing the import path SHALL NOT break functionality
8. FOR ALL pages importing Header, the Header component SHALL render identically before and after the fix

### Requirement 2: Move Tour Types from Features to Shared Layer

**User Story:** As a developer, I want tour-related types in the shared layer, so that the app layer can use them without violating FSD hierarchy.

#### Acceptance Criteria

1. THE Shared_Types SHALL include TourProgress, TourKey, TourStep, TourConfig, and TourState types
2. WHEN app/providers/tour-wrapper imports tour types, THE Provider SHALL import from shared/types instead of features layer
3. THE Tour_Wrapper_Utils SHALL import TourProgress and TourKey from shared/types
4. THE Tour_Wrapper_Constants SHALL import TourKey from shared/types
5. THE Tour_Config_Files SHALL import TourStep from shared/types
6. FOR ALL files importing tour types, the types SHALL be imported from @/shared/types
7. THE Features_Student_Profile_Model SHALL NOT export tour types (remove if present)
8. FOR ALL tour type imports, changing the import path SHALL NOT cause TypeScript errors

### Requirement 3: Refactor Organization Guard to Remove Feature UI Dependency

**User Story:** As a developer, I want the organization guard to not render feature UI directly, so that app layer guards remain decoupled from features layer.

#### Acceptance Criteria

1. WHEN OrganizationGuard detects missing organization, THE Guard SHALL redirect to organization setup route instead of rendering OrganizationSetup component
2. THE OrganizationGuard SHALL NOT import any UI components from features layer
3. THE OrganizationGuard SHALL use navigation/redirect for organization setup flow
4. WHEN user needs organization setup, THE Guard SHALL pass organization type via URL parameters
5. THE Organization_Setup_Route SHALL handle rendering the OrganizationSetup component
6. FOR ALL organization types (school, college, university), the redirect flow SHALL work correctly
7. WHEN organization is created, THE Guard SHALL allow access to protected routes
8. THE OrganizationGuard SHALL remain in app/guards directory with updated implementation

### Requirement 4: Move Mock Data from Widgets to Shared Layer

**User Story:** As a developer, I want mock data in the shared layer, so that layouts can access test data without importing from widgets.

#### Acceptance Criteria

1. THE Shared_Config SHALL include mockData.js with educationData, trainingData, experienceData, technicalSkills, and softSkills
2. WHEN StudentLayout imports mock data, THE Layout SHALL import from @/shared/config/mockData
3. THE Widgets_Student_Dashboard_Model SHALL NOT export mockData (remove the file or export)
4. THE Mock_Data SHALL be structured identically in shared layer as it was in widgets layer
5. FOR ALL components using mock data, changing the import path SHALL NOT break functionality
6. THE Mock_Data SHALL be available for use by any layer (shared, entities, features, widgets, pages, app)
7. WHEN mock data is updated in shared layer, THE Changes SHALL be reflected in all consuming components

### Requirement 5: Fix PublicLayout Feature Utility Import

**User Story:** As a developer, I want layouts to import from feature public APIs, so that internal feature boundaries are respected.

#### Acceptance Criteria

1. WHEN PublicLayout checks subscription status, THE Layout SHALL import isActiveOrPaused from @/features/subscription public index
2. THE Features_Subscription_Index SHALL export isActiveOrPaused function
3. THE PublicLayout SHALL NOT import from @/features/subscription internal paths
4. FOR ALL subscription utility imports in layouts, the imports SHALL use feature public API
5. WHEN isActiveOrPaused is called, THE Function SHALL behave identically before and after the fix
6. THE Subscription_Feature_Index SHALL document all exported utilities

### Requirement 6: Verify No New Violations Introduced

**User Story:** As a developer, I want to ensure no new FSD violations are created during fixes, so that architectural integrity is maintained.

#### Acceptance Criteria

1. WHEN all fixes are applied, THE Codebase SHALL have zero pages importing from app layer
2. WHEN all fixes are applied, THE Codebase SHALL have zero app layer imports from features layer (except through public APIs)
3. WHEN all fixes are applied, THE Codebase SHALL have zero app layer imports from widgets layer
4. THE Build_Process SHALL complete successfully with no import errors
5. THE TypeScript_Compiler SHALL report no type errors related to moved types
6. FOR ALL moved components and types, existing functionality SHALL remain unchanged
7. THE FSD_Violation_Check_Script SHALL report zero violations after fixes

### Requirement 7: Update Import Paths Across Codebase

**User Story:** As a developer, I want all import paths updated consistently, so that the codebase uses the new locations correctly.

#### Acceptance Criteria

1. WHEN searching for Header imports from app/layouts, THE Search SHALL return zero results
2. WHEN searching for tour type imports from features, THE Search SHALL return zero results
3. WHEN searching for mockData imports from widgets, THE Search SHALL return zero results
4. THE Codebase SHALL use @/ path alias for all cross-layer imports
5. FOR ALL updated imports, the import statements SHALL follow FSD conventions
6. THE Import_Paths SHALL be verified using grep or similar search tools
7. WHEN running build, THE Build SHALL succeed without module resolution errors

### Requirement 8: Document Architectural Decisions

**User Story:** As a developer, I want architectural decisions documented, so that future developers understand why components were moved.

#### Acceptance Criteria

1. THE Shared_UI_Index SHALL include comments explaining Header is shared across all layers
2. THE Shared_Types_Tour SHALL include comments explaining tour types are shared infrastructure
3. THE Shared_Config_MockData SHALL include comments explaining mock data is test infrastructure
4. THE OrganizationGuard SHALL include comments explaining redirect-based approach
5. THE Features_Subscription_Index SHALL include comments documenting exported utilities
6. FOR ALL moved files, the new location SHALL have JSDoc comments explaining purpose
7. THE Comments SHALL reference FSD layer hierarchy rules

