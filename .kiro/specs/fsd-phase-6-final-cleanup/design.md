# FSD Phase 6 Final Cleanup - Design Document

## Overview

This design addresses the completion of the Feature-Sliced Design (FSD) architectural migration for the SkillPassport codebase. Despite completing Phases 1-5, the current audit shows only 15-20% FSD compliance due to the coexistence of legacy directories (components/, services/, hooks/, utils/, types/, config/, lib/, layouts/, routes/, providers/) alongside the new FSD structure (app/, pages/, widgets/, features/, entities/, shared/).

The core challenge is eliminating this dual structure by:
1. Migrating 976 remaining files from legacy directories to appropriate FSD layers
2. Removing business logic from 100+ page components containing direct Supabase calls
3. Eliminating 13+ direct service imports from pages
4. Fixing entity layer violations
5. Creating proper widgets for composite UI blocks
6. Establishing the app/ layer for application-level concerns
7. Deleting legacy directories to achieve 100% FSD compliance

### Success Criteria

- 100% FSD compliance (zero files in legacy directories)
- Zero business logic in page components
- Zero direct service imports from pages
- Zero FSD layer hierarchy violations
- All imports use public APIs through index.ts files
- TypeScript compilation with zero errors
- All tests passing with zero regressions

## Architecture

### FSD Layer Hierarchy

The Feature-Sliced Design architecture enforces a strict unidirectional dependency flow:

```
app/          (Application initialization, routing, layouts, providers)
  ↓
pages/        (Route-level components - composition only)
  ↓
widgets/      (Composite UI blocks combining features/entities)
  ↓
features/     (Business capabilities with user interactions)
  ↓
entities/     (Business domain objects)
  ↓
shared/       (Reusable infrastructure, UI kit, utilities)
```

**Dependency Rules:**
- Each layer can only import from layers below it
- Features cannot import from other features (use shared/entities instead)
- Entities cannot import from features or widgets
- Shared cannot import from any higher layer
- All imports must use public APIs (index.ts exports)

### Target Directory Structure

```
src/
├── app/                          # NEW: Application layer
│   ├── routes/                   # ← from src/routes/
│   ├── layouts/                  # ← from src/layouts/
│   ├── providers/                # ← from src/providers/
│   ├── config/                   # App-specific config
│   └── index.ts
│
├── pages/                        # REFACTOR: Remove business logic
│   ├── student/
│   ├── educator/
│   ├── recruiter/
│   ├── admin/
│   └── auth/
│
├── widgets/                      # EXPAND: Add composite UI blocks
│   ├── student-dashboard/
│   ├── educator-dashboard/
│   ├── recruiter-dashboard/
│   ├── admin-dashboard/
│   ├── course-player/
│   ├── assessment-player/
│   └── placement-tracker/
│
├── features/                     # EXPAND: Migrate remaining features
│   ├── auth/                     # ✅ Complete
│   ├── messaging/                # ✅ Complete
│   ├── courses/                  # ✅ Complete
│   ├── student-profile/          # ✅ Complete
│   ├── subscription/             # ✅ Complete
│   ├── opportunities/            # NEW: Job recommendations
│   ├── college-admin/            # NEW: College management
│   ├── school-admin/             # NEW: School management
│   ├── digital-portfolio/        # NEW: Portfolio/passport
│   ├── ai-tutor/                 # NEW: AI tutoring
│   ├── counselling/              # NEW: AI counselling
│   ├── placement/                # NEW: Placement management
│   └── exams/                    # REFACTOR: Fix structure
│
├── entities/                     # EXPAND: Add domain entities
│   ├── user/
│   ├── student/
│   ├── course/
│   ├── organization/
│   ├── opportunity/              # NEW: Job entity
│   ├── department/               # NEW: Department entity
│   ├── faculty/                  # NEW: Faculty entity
│   └── application/              # NEW: Application entity
│
└── shared/                       # EXPAND: Migrate utilities
    ├── ui/                       # ✅ Complete
    ├── api/                      # ✅ Complete
    ├── config/                   # EXPAND: ← from src/config/
    ├── lib/                      # EXPAND: ← from src/lib/, src/utils/
    └── types/                    # EXPAND: ← from src/types/
```

### Migration Scope

**Files to Migrate:**
- 557 files from components/ → features/widgets/entities/shared
- 235 files from services/ → feature/entity api/ directories
- 113 files from hooks/ → feature/entity model/ directories
- 58 files from utils/ → shared/lib/ or feature lib/
- 13 files from types/ → appropriate layer types
- 8 files from config/ → shared/config/ or app/config/
- 3 files from lib/ → shared/lib/
- 6 files from layouts/ → app/layouts/
- 6 files from routes/ → app/routes/
- 1 file from providers/ → app/providers/

**Total:** 1,000+ files to migrate or refactor

## Components and Interfaces

### 1. Migration Engine

The migration engine orchestrates the entire cleanup process with automated file movement, import path updates, and validation.

```typescript
interface MigrationEngine {
  // File classification
  classifyFile(filePath: string): FileClassification;
  determineTargetLocation(file: FileClassification): string;
  
  // Migration execution
  migrateFile(source: string, target: string): MigrationResult;
  updateImportPaths(file: string, oldPath: string, newPath: string): void;
  
  // Validation
  validateMigration(): ValidationReport;
  detectCircularDependencies(): CircularDependency[];
  validateLayerHierarchy(): LayerViolation[];
}

interface FileClassification {
  sourceFile: string;
  fileType: 'component' | 'service' | 'hook' | 'util' | 'type' | 'config';
  domain: string;  // e.g., 'auth', 'courses', 'student-profile'
  layer: 'app' | 'pages' | 'widgets' | 'features' | 'entities' | 'shared';
  targetPath: string;
  confidence: number;  // 0-1 confidence score
}
```

### 2. Component Classifier

Determines the appropriate FSD layer for each component based on usage patterns and dependencies.

```typescript
interface ComponentClassifier {
  // Analysis
  analyzeComponent(filePath: string): ComponentAnalysis;
  determineFeatureOwnership(component: ComponentAnalysis): string;
  isWidget(component: ComponentAnalysis): boolean;
  isEntity(component: ComponentAnalysis): boolean;
  
  // Classification rules
  classifyByImports(imports: Import[]): LayerHint;
  classifyByUsage(usageLocations: string[]): LayerHint;
  classifyByNaming(fileName: string): LayerHint;
}

interface ComponentAnalysis {
  filePath: string;
  imports: Import[];
  exports: Export[];
  usageLocations: string[];
  hasBusinessLogic: boolean;
  composesMultipleFeatures: boolean;
  isDomainSpecific: boolean;
}
```

### 3. Business Logic Extractor

Extracts business logic from page components and moves it to appropriate feature layers.

```typescript
interface BusinessLogicExtractor {
  // Detection
  detectBusinessLogic(pageFile: string): BusinessLogicViolation[];
  findSupabaseCalls(ast: AST): SupabaseCall[];
  findStateManagement(ast: AST): StateManagement[];
  
  // Extraction
  extractToFeatureApi(violation: BusinessLogicViolation): ExtractionResult;
  extractToFeatureModel(violation: BusinessLogicViolation): ExtractionResult;
  refactorPageToComposition(pageFile: string): RefactorResult;
}

interface BusinessLogicViolation {
  file: string;
  line: number;
  type: 'supabase_call' | 'state_management' | 'data_transformation';
  code: string;
  targetFeature: string;
  targetLocation: string;  // e.g., 'features/courses/api/courseService.ts'
}

interface SupabaseCall {
  type: 'from' | 'rpc' | 'auth';
  table?: string;
  rpcFunction?: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  line: number;
  code: string;
}
```

### 4. Import Path Migrator

Updates all import statements to use new FSD paths and public APIs.

```typescript
interface ImportPathMigrator {
  // Path resolution
  resolveNewPath(oldPath: string): string;
  findPublicApi(targetFile: string): string;
  
  // Migration
  updateImportsInFile(file: string, pathMap: PathMapping[]): void;
  updateAllImports(pathMap: PathMapping[]): UpdateResult;
  
  // Validation
  validateImportPaths(): ImportValidation[];
  detectBrokenImports(): BrokenImport[];
}

interface PathMapping {
  oldPath: string;
  newPath: string;
  publicApiPath: string;
  affectedFiles: string[];
}

interface ImportValidation {
  file: string;
  import: string;
  isValid: boolean;
  usesPublicApi: boolean;
  violatesLayerHierarchy: boolean;
  suggestion?: string;
}
```

### 5. Widget Creator

Identifies and creates widgets for composite UI blocks that combine multiple features.

```typescript
interface WidgetCreator {
  // Identification
  identifyWidgetCandidates(): WidgetCandidate[];
  analyzeComposition(component: string): CompositionAnalysis;
  
  // Creation
  createWidget(candidate: WidgetCandidate): WidgetCreationResult;
  extractWidgetLogic(sourceFiles: string[]): WidgetStructure;
  
  // Validation
  validateWidget(widgetPath: string): WidgetValidation;
}

interface WidgetCandidate {
  sourceFiles: string[];
  name: string;
  composedFeatures: string[];
  composedEntities: string[];
  complexity: number;
  usageCount: number;
}

interface WidgetStructure {
  ui: string[];        // UI components
  model: string[];     // State management hooks
  lib: string[];       // Widget-specific utilities
  publicApi: Export[];
}
```

### 6. App Layer Builder

Creates the app/ layer structure for application-level concerns.

```typescript
interface AppLayerBuilder {
  // Structure creation
  createAppStructure(): void;
  migrateRoutes(sourcePath: string): void;
  migrateLayouts(sourcePath: string): void;
  migrateProviders(sourcePath: string): void;
  
  // Configuration
  consolidateConfig(): ConfigConsolidation;
  createAppEntry(): void;
  
  // Validation
  validateAppLayer(): AppLayerValidation;
}

interface ConfigConsolidation {
  appConfig: string[];      // App-specific config → app/config/
  sharedConfig: string[];   // Shared config → shared/config/
  duplicates: string[];     // Duplicate config to merge
}
```

### 7. Validation Framework

Comprehensive validation to ensure zero regressions and 100% FSD compliance.

```typescript
interface ValidationFramework {
  // Compilation
  validateTypeScript(): TypeScriptValidation;
  
  // FSD Compliance
  measureFSDCompliance(): ComplianceReport;
  validateLayerHierarchy(): LayerViolation[];
  validatePublicApis(): PublicApiValidation[];
  
  // Functionality
  runUnitTests(): TestResults;
  runIntegrationTests(): TestResults;
  validatePageRendering(): PageValidation[];
  
  // Performance
  measureBuildTime(): PerformanceMetrics;
  measureBundleSize(): BundleSizeReport;
}

interface ComplianceReport {
  overallScore: number;  // 0-100%
  filesInFsdStructure: number;
  filesInLegacyStructure: number;
  layerViolations: number;
  businessLogicInPages: number;
  directServiceImports: number;
  breakdown: {
    app: number;
    pages: number;
    widgets: number;
    features: number;
    entities: number;
    shared: number;
  };
}
```

## Data Models

### File Mapping

```typescript
interface FileMapping {
  id: string;
  sourceFile: string;
  targetFile: string;
  fileType: FileType;
  layer: FSDLayer;
  domain: string;
  migrationStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependentFiles: string[];
  importedBy: string[];
  createdAt: Date;
  migratedAt?: Date;
}

type FileType = 
  | 'component' 
  | 'service' 
  | 'hook' 
  | 'util' 
  | 'type' 
  | 'config' 
  | 'layout' 
  | 'route';

type FSDLayer = 
  | 'app' 
  | 'pages' 
  | 'widgets' 
  | 'features' 
  | 'entities' 
  | 'shared';
```

### Dependency Graph

```typescript
interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

interface DependencyNode {
  id: string;
  filePath: string;
  layer: FSDLayer;
  domain: string;
  exports: Export[];
}

interface DependencyEdge {
  from: string;  // node id
  to: string;    // node id
  importType: 'default' | 'named' | 'namespace';
  isPublicApi: boolean;
  violatesHierarchy: boolean;
}

interface Export {
  name: string;
  type: 'function' | 'class' | 'const' | 'type' | 'interface';
  isDefault: boolean;
}
```

### Migration State

```typescript
interface MigrationState {
  phase: 'analysis' | 'classification' | 'migration' | 'validation' | 'cleanup';
  progress: {
    totalFiles: number;
    migratedFiles: number;
    failedFiles: number;
    percentage: number;
  };
  currentBatch: string[];
  errors: MigrationError[];
  warnings: MigrationWarning[];
  startedAt: Date;
  completedAt?: Date;
}

interface MigrationError {
  file: string;
  error: string;
  stack?: string;
  recoverable: boolean;
}

interface MigrationWarning {
  file: string;
  warning: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}
```

## API Design

### Public API Patterns

Every FSD module (feature/entity/widget) must expose a public API through index.ts:

```typescript
// features/opportunities/index.ts
export { 
  OpportunityCard,
  OpportunityList,
  JobFilters 
} from './ui';

export { 
  useOpportunities,
  useAIJobMatching 
} from './model';

export { 
  opportunitiesService,
  aiJobMatchingService 
} from './api';

export type { 
  Opportunity,
  JobFilter,
  MatchScore 
} from './model/types';
```

### Feature API Structure

Each feature follows a consistent internal structure:

```typescript
features/{feature-name}/
├── ui/                    # UI components
│   ├── ComponentA.tsx
│   ├── ComponentB.tsx
│   └── index.ts          # export { ComponentA, ComponentB }
├── model/                 # State management & business logic
│   ├── useFeature.ts
│   ├── featureStore.ts
│   ├── types.ts
│   └── index.ts          # export hooks, stores, types
├── api/                   # Data access layer
│   ├── featureService.ts
│   └── index.ts          # export services
├── lib/                   # Feature-specific utilities
│   ├── validation.ts
│   ├── helpers.ts
│   └── index.ts          # export utilities
└── index.ts              # Public API (exports from all subdirectories)
```

### Service Migration Pattern

Services migrate from centralized services/ to feature-specific api/ directories:

```typescript
// OLD: src/services/opportunitiesService.ts
export const opportunitiesService = {
  getOpportunities: async () => { /* ... */ },
  applyToJob: async (jobId: string) => { /* ... */ }
};

// NEW: src/features/opportunities/api/opportunitiesService.ts
export const opportunitiesService = {
  getOpportunities: async () => { /* ... */ },
  applyToJob: async (jobId: string) => { /* ... */ }
};

// NEW: src/features/opportunities/api/index.ts
export { opportunitiesService } from './opportunitiesService';

// NEW: src/features/opportunities/index.ts
export { opportunitiesService } from './api';

// Usage in pages (OLD):
import { opportunitiesService } from '@/services/opportunitiesService';

// Usage in pages (NEW):
import { opportunitiesService } from '@/features/opportunities';
```

### Page Refactoring Pattern

Pages transform from containing business logic to pure composition:

```typescript
// BEFORE: Page with business logic
const StudentDashboard = () => {
  const [courses, setCourses] = useState([]);
  
  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('student_id', userId);
      setCourses(data);
    };
    fetchCourses();
  }, [userId]);
  
  return <div>{/* render courses */}</div>;
};

// AFTER: Page with composition only
const StudentDashboard = () => {
  return (
    <StudentDashboardWidget />
  );
};

// Business logic moved to widget
// widgets/student-dashboard/ui/StudentDashboardWidget.tsx
const StudentDashboardWidget = () => {
  const { courses } = useCourses();  // from features/courses
  const { profile } = useStudentProfile();  // from features/student-profile
  
  return (
    <div>
      <ProfileSection profile={profile} />
      <CourseList courses={courses} />
    </div>
  );
};

// Data fetching in feature
// features/courses/model/useCourses.ts
export const useCourses = () => {
  const [courses, setCourses] = useState([]);
  
  useEffect(() => {
    courseService.getCourses().then(setCourses);
  }, []);
  
  return { courses };
};

// features/courses/api/courseService.ts
export const courseService = {
  getCourses: async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('student_id', userId);
    return data;
  }
};
```

## Error Handling

### Migration Errors

```typescript
class MigrationError extends Error {
  constructor(
    public file: string,
    public operation: string,
    message: string,
    public recoverable: boolean = true
  ) {
    super(`Migration failed for ${file} during ${operation}: ${message}`);
  }
}

class CircularDependencyError extends MigrationError {
  constructor(
    public cycle: string[],
    message: string
  ) {
    super(cycle[0], 'dependency_analysis', message, false);
  }
}

class LayerViolationError extends MigrationError {
  constructor(
    public file: string,
    public importPath: string,
    public fromLayer: FSDLayer,
    public toLayer: FSDLayer
  ) {
    super(
      file,
      'layer_validation',
      `Invalid import: ${fromLayer} cannot import from ${toLayer}`,
      true
    );
  }
}
```

### Error Recovery Strategies

1. **File Migration Failures**
   - Log error with full context
   - Skip file and continue with batch
   - Add to retry queue
   - Generate manual migration guide for failed files

2. **Import Path Update Failures**
   - Preserve original import as comment
   - Add TODO comment with suggested fix
   - Log warning for manual review
   - Continue with other imports

3. **Circular Dependency Detection**
   - Halt migration for affected files
   - Generate dependency graph visualization
   - Suggest refactoring to break cycle
   - Require manual intervention

4. **Layer Hierarchy Violations**
   - Log violation with suggestion
   - Attempt automatic fix (move to correct layer)
   - If unfixable, add to manual review queue
   - Generate violation report

### Rollback Mechanism

```typescript
interface RollbackManager {
  // Backup
  createBackup(): BackupId;
  backupFile(file: string): void;
  
  // Rollback
  rollbackFile(file: string): void;
  rollbackBatch(batchId: string): void;
  rollbackAll(): void;
  
  // Verification
  verifyBackup(backupId: BackupId): boolean;
  listBackups(): Backup[];
}

interface Backup {
  id: BackupId;
  timestamp: Date;
  files: string[];
  size: number;
  compressed: boolean;
}
```

## Testing Strategy

### Dual Testing Approach

This migration requires both unit tests and property-based tests to ensure correctness:

- **Unit tests**: Verify specific migration scenarios, edge cases, and error conditions
- **Property tests**: Verify universal properties across all migrations (100+ iterations each)

### Unit Testing

Unit tests focus on specific examples and integration points:

```typescript
describe('Migration Engine', () => {
  describe('File Classification', () => {
    it('should classify auth components as features/auth/ui', () => {
      const result = classifyFile('src/components/auth/LoginForm.tsx');
      expect(result.layer).toBe('features');
      expect(result.domain).toBe('auth');
      expect(result.targetPath).toBe('src/features/auth/ui/LoginForm.tsx');
    });
    
    it('should classify generic utilities as shared/lib', () => {
      const result = classifyFile('src/utils/formatters.ts');
      expect(result.layer).toBe('shared');
      expect(result.targetPath).toBe('src/shared/lib/formatters.ts');
    });
  });
  
  describe('Business Logic Extraction', () => {
    it('should extract supabase.from() calls to feature api', async () => {
      const pageFile = 'src/pages/student/Dashboard.tsx';
      const violations = await detectBusinessLogic(pageFile);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('supabase_call');
      expect(violations[0].targetLocation).toContain('features/courses/api');
    });
  });
  
  describe('Import Path Migration', () => {
    it('should update service imports to use feature public API', () => {
      const oldImport = "import { courseService } from '@/services/courseApiService'";
      const newImport = updateImport(oldImport);
      
      expect(newImport).toBe("import { courseService } from '@/features/courses'");
    });
  });
});
```

### Property-Based Testing

Property tests verify universal correctness properties across all migrations. Each test runs 100+ iterations with randomized inputs.

**Property-Based Testing Library**: We'll use `fast-check` for TypeScript/JavaScript property-based testing.

**Test Configuration**: Each property test must run minimum 100 iterations and reference its design document property using the tag format:
```typescript
// Feature: fsd-phase-6-final-cleanup, Property {number}: {property_text}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **File Movement Properties**: Many criteria (1.4, 4.3-4.5, 5.3-5.5, 6.3-6.5, 7.3-7.5, 9.5-9.6, 10.2-10.4, 11.3-11.4, 12.3-12.4) all test the same underlying property: "files are moved to their classified target location." These can be combined into a single comprehensive property.

2. **Import Update Properties**: Multiple criteria (1.6, 4.6, 5.6, 6.6, 7.6, 11.5, 12.5) all test that imports are updated after migration. These can be combined into one property.

3. **Validation Properties**: Many criteria (1.8, 2.8, 3.5, 3.8, 4.7, 5.7, 6.7, 7.7, 8.7, 14.2-14.6, 15.1) test various aspects of post-migration validation. These can be consolidated into comprehensive validation properties.

4. **Directory Creation Properties**: Criteria 1.3, 9.2-9.4 all test directory creation, which can be combined.

5. **Public API Properties**: Criteria 1.5, 6.8, 7.8, 9.8 all test public API existence, which can be combined.

6. **Classification Properties**: Criteria 1.2, 3.2, 4.2, 5.2, 6.2, 7.2, 11.2, 12.2 all test classification logic, which can be combined into domain-specific properties.

7. **Extraction Properties**: Criteria 2.2-2.6 all test business logic extraction, which can be combined into a single comprehensive property.

8. **Deduplication Properties**: Criteria 1.7, 5.8, 11.8, 12.8 all test deduplication, which can be combined.

### Property 1: File Migration Preserves Content

*For any* file in the legacy structure, when migrated to its classified FSD location, the file content should remain identical and the file should exist only in the target location (not in both source and target).

**Validates: Requirements 1.4, 4.3, 4.4, 4.5, 5.3, 5.4, 5.5, 6.3, 6.4, 6.5, 7.3, 7.4, 7.5, 9.5, 9.6, 10.2, 10.3, 10.4, 11.3, 11.4, 12.3, 12.4**

### Property 2: Classification Consistency

*For any* file classified multiple times with the same inputs, the classification result (target layer and domain) should be identical across all invocations.

**Validates: Requirements 1.2, 3.2, 4.2, 5.2, 6.2, 7.2, 11.2, 12.2**

### Property 3: Directory Creation Idempotence

*For any* target path requiring directory creation, creating the directory structure multiple times should result in the same final state (directories exist, no errors thrown).

**Validates: Requirements 1.3, 9.2, 9.3, 9.4**

### Property 4: Import Path Update Completeness

*For any* migrated file, all import statements referencing that file across the entire codebase should be updated to use the new path, and zero imports should reference the old path.

**Validates: Requirements 1.6, 4.6, 5.6, 6.6, 7.6, 11.5, 12.5**

### Property 5: Public API Exposure

*For any* migrated feature, entity, or widget, an index.ts file should exist at the module root that exports all public components, hooks, services, and types from that module.

**Validates: Requirements 1.5, 6.8, 7.8, 9.8**

### Property 6: FSD Structure Compliance

*For any* migrated feature or entity, the directory structure should contain only valid FSD subdirectories (ui/, model/, api/, lib/) and an index.ts file.

**Validates: Requirements 1.8**

### Property 7: Business Logic Extraction

*For any* page component containing Supabase calls (from/rpc/auth), state management, or data transformation logic, after extraction, the page should contain zero business logic and all logic should exist in the appropriate feature layer (api/ for data access, model/ for state, lib/ for transformations).

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

### Property 8: Service Import Elimination

*For any* page component, after migration, zero imports should reference @/services/ and all service functionality should be accessed through feature or shared public APIs.

**Validates: Requirements 3.4, 3.5, 3.7, 3.8**

### Property 9: Shared Service Identification

*For any* service used by multiple features (2+), the service should be moved to shared/api/ rather than any single feature's api/ directory.

**Validates: Requirements 3.6**

### Property 10: Hook Naming Convention

*For any* hook file, the filename should start with "use" followed by a PascalCase name (e.g., useAuth, useStudentData).

**Validates: Requirements 4.8**

### Property 11: Legacy Import Elimination

*For any* legacy directory path (@/components/, @/services/, @/hooks/, @/utils/, @/types/, @/config/, @/lib/), after migration, zero import statements across the codebase should reference that path.

**Validates: Requirements 4.7, 5.7, 6.7, 7.7, 11.6, 12.6, 15.1**

### Property 12: Code Deduplication

*For any* set of duplicate code blocks (identical or near-identical functions/components), after migration, only one canonical version should exist and all references should point to that canonical location.

**Validates: Requirements 1.7, 5.8, 11.8, 12.8**

### Property 13: Layer Hierarchy Enforcement

*For any* import statement, the importing file's layer must be higher than or equal to the imported file's layer in the FSD hierarchy (app > pages > widgets > features > entities > shared), with the exception that features cannot import from other features.

**Validates: Requirements 8.5, 8.6, 9.7, 10.8, 14.2, 14.3, 14.4, 14.5, 14.6**

### Property 14: Public API Usage

*For any* import from a feature, entity, or widget, the import path should reference the module's public API (index.ts) rather than internal file paths.

**Validates: Requirements 14.8**

### Property 15: Entity Layer Purity

*For any* file in the entities/ layer, after migration, it should contain zero imports from @/services/ and zero imports from features/ or widgets/ layers.

**Validates: Requirements 8.2, 8.3, 8.7**

### Property 16: Supabase Client Location

*For any* migration operation, the Supabase client should remain in shared/api/ and should not be moved to any other location.

**Validates: Requirements 12.7**

### Property 17: Environment Variable Access Pattern

*For any* code accessing environment variables, after migration, the access should go through shared/config/ rather than direct process.env access.

**Validates: Requirements 11.7**

### Property 18: TypeScript Compilation Success

*For any* state of the codebase after migration, running the TypeScript compiler should produce zero type errors.

**Validates: Requirements 16.1**


## Testing Strategy

### Dual Testing Approach

This migration requires both unit tests and property-based tests to ensure correctness:

- **Unit tests**: Verify specific migration scenarios, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs (100+ iterations each)

Both approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across the input space.

### Unit Testing Focus

Unit tests should focus on:

1. **Specific Migration Scenarios**
   - Migrating an auth component to features/auth/ui/
   - Migrating a generic utility to shared/lib/
   - Extracting a Supabase call from a page to feature api/
   - Creating a widget from composite components

2. **Edge Cases**
   - Files with no imports
   - Files with circular dependencies
   - Files with mixed concerns (both feature and entity logic)
   - Files with invalid naming conventions

3. **Error Conditions**
   - File not found during migration
   - Permission denied when creating directories
   - Invalid TypeScript syntax in migrated files
   - Circular dependencies detected

4. **Integration Points**
   - Migration engine + import path migrator
   - Business logic extractor + page refactorer
   - Component classifier + widget creator
   - Validation framework + compliance reporter

### Property-Based Testing Configuration

**Library**: `fast-check` for TypeScript/JavaScript property-based testing

**Configuration**: Each property test must run minimum 100 iterations

**Tagging**: Each test must reference its design document property:
```typescript
// Feature: fsd-phase-6-final-cleanup, Property 1: File Migration Preserves Content
```

### Property Test Examples

```typescript
import fc from 'fast-check';

// Feature: fsd-phase-6-final-cleanup, Property 1: File Migration Preserves Content
describe('Property 1: File Migration Preserves Content', () => {
  it('should preserve file content and remove from source', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          path: fc.string({ minLength: 1 }),
          content: fc.string(),
          fileType: fc.constantFrom('component', 'service', 'hook', 'util')
        }),
        async ({ path, content, fileType }) => {
          // Setup: Create file in legacy location
          const legacyPath = `src/components/${path}`;
          await createFile(legacyPath, content);
          
          // Execute: Migrate file
          const classification = classifyFile(legacyPath);
          const result = await migrateFile(legacyPath, classification.targetPath);
          
          // Assert: Content preserved, source removed
          const targetContent = await readFile(classification.targetPath);
          const sourceExists = await fileExists(legacyPath);
          
          expect(targetContent).toBe(content);
          expect(sourceExists).toBe(false);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: fsd-phase-6-final-cleanup, Property 2: Classification Consistency
describe('Property 2: Classification Consistency', () => {
  it('should produce identical classification for same inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          path: fc.string({ minLength: 1 }),
          imports: fc.array(fc.string()),
          exports: fc.array(fc.string())
        }),
        ({ path, imports, exports }) => {
          const file = { path, imports, exports };
          
          const result1 = classifyFile(file);
          const result2 = classifyFile(file);
          const result3 = classifyFile(file);
          
          expect(result1).toEqual(result2);
          expect(result2).toEqual(result3);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: fsd-phase-6-final-cleanup, Property 4: Import Path Update Completeness
describe('Property 4: Import Path Update Completeness', () => {
  it('should update all imports and leave zero old references', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          migratedFile: fc.string({ minLength: 1 }),
          oldPath: fc.string({ minLength: 1 }),
          newPath: fc.string({ minLength: 1 }),
          importingFiles: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 })
        }),
        async ({ migratedFile, oldPath, newPath, importingFiles }) => {
          // Setup: Create files with imports
          for (const file of importingFiles) {
            await createFileWithImport(file, oldPath);
          }
          
          // Execute: Update imports
          await updateImportPaths(migratedFile, oldPath, newPath);
          
          // Assert: All imports updated, zero old references
          const oldImportCount = await countImports(oldPath);
          const newImportCount = await countImports(newPath);
          
          expect(oldImportCount).toBe(0);
          expect(newImportCount).toBe(importingFiles.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: fsd-phase-6-final-cleanup, Property 7: Business Logic Extraction
describe('Property 7: Business Logic Extraction', () => {
  it('should extract all business logic from pages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pagePath: fc.string({ minLength: 1 }),
          supabaseCalls: fc.array(fc.constantFrom('from', 'rpc', 'auth'), { minLength: 1, maxLength: 5 }),
          stateManagement: fc.boolean(),
          dataTransformation: fc.boolean()
        }),
        async ({ pagePath, supabaseCalls, stateManagement, dataTransformation }) => {
          // Setup: Create page with business logic
          const pageContent = generatePageWithLogic({
            supabaseCalls,
            stateManagement,
            dataTransformation
          });
          await createFile(pagePath, pageContent);
          
          // Execute: Extract business logic
          const violations = await detectBusinessLogic(pagePath);
          for (const violation of violations) {
            await extractToFeatureApi(violation);
          }
          await refactorPageToComposition(pagePath);
          
          // Assert: Zero business logic remains
          const remainingViolations = await detectBusinessLogic(pagePath);
          expect(remainingViolations).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: fsd-phase-6-final-cleanup, Property 13: Layer Hierarchy Enforcement
describe('Property 13: Layer Hierarchy Enforcement', () => {
  it('should enforce FSD layer hierarchy for all imports', () => {
    fc.assert(
      fc.property(
        fc.record({
          fromLayer: fc.constantFrom('app', 'pages', 'widgets', 'features', 'entities', 'shared'),
          toLayer: fc.constantFrom('app', 'pages', 'widgets', 'features', 'entities', 'shared'),
          fromFile: fc.string({ minLength: 1 }),
          toFile: fc.string({ minLength: 1 })
        }),
        ({ fromLayer, toLayer, fromFile, toFile }) => {
          const importStatement = `import { something } from '${toFile}'`;
          const violation = validateLayerHierarchy(fromFile, fromLayer, toFile, toLayer);
          
          const layerOrder = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];
          const fromIndex = layerOrder.indexOf(fromLayer);
          const toIndex = layerOrder.indexOf(toLayer);
          
          // Features cannot import from other features
          if (fromLayer === 'features' && toLayer === 'features' && fromFile !== toFile) {
            expect(violation).toBeDefined();
          }
          // Lower layers cannot import from higher layers
          else if (fromIndex < toIndex) {
            expect(violation).toBeDefined();
          }
          // Valid imports should have no violation
          else {
            expect(violation).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: 100% of correctness properties implemented
- **Integration Tests**: All major workflows (file migration, business logic extraction, import updates)
- **E2E Tests**: Full migration pipeline from legacy to FSD structure

### Validation Testing

After migration, comprehensive validation tests must pass:

1. **TypeScript Compilation**: Zero type errors
2. **Unit Tests**: 100% pass rate
3. **Integration Tests**: All features work correctly
4. **Page Rendering**: All pages render without errors
5. **Authentication**: Login, signup, password reset flows work
6. **Data Fetching**: All API calls return expected data
7. **State Management**: All Zustand stores function correctly

### Performance Testing

Monitor performance metrics before and after migration:

1. **Build Time**: Should not increase by more than 10%
2. **Bundle Size**: Should not increase (may decrease due to deduplication)
3. **Hot Module Replacement**: Should remain fast (<1s)
4. **Test Execution Time**: Should not increase significantly

### Regression Testing

Use snapshot testing for critical components:

```typescript
describe('Regression Tests', () => {
  it('should render student dashboard identically', () => {
    const { container } = render(<StudentDashboard />);
    expect(container).toMatchSnapshot();
  });
  
  it('should maintain auth flow behavior', async () => {
    const result = await authService.login('test@example.com', 'password');
    expect(result).toMatchSnapshot();
  });
});
```

## Performance Considerations

### Build Time Optimization

1. **Parallel Migration**: Process independent files in parallel batches
2. **Incremental Updates**: Only update affected import paths, not entire codebase
3. **Caching**: Cache classification results to avoid re-analyzing files
4. **Lazy Loading**: Load AST parsers only when needed

### Bundle Size Impact

Expected improvements from migration:

1. **Deduplication**: Eliminate duplicate code across features (~5-10% reduction)
2. **Tree Shaking**: Better tree shaking with explicit public APIs (~3-5% reduction)
3. **Code Splitting**: Improved code splitting by feature boundaries (~10-15% reduction)

### Runtime Performance

Migration should not impact runtime performance:

1. **Import Paths**: Alias resolution happens at build time (zero runtime cost)
2. **Public APIs**: Re-exports have zero runtime overhead with tree shaking
3. **Layer Structure**: Directory organization has no runtime impact

### Migration Performance

Target performance for migration execution:

- **File Classification**: <100ms per file
- **File Migration**: <50ms per file
- **Import Update**: <200ms per file
- **Validation**: <5s for entire codebase
- **Total Migration Time**: <30 minutes for 1000+ files

### Memory Management

Prevent memory issues during migration:

1. **Streaming**: Process files in batches rather than loading all into memory
2. **Garbage Collection**: Clear caches between batches
3. **AST Disposal**: Dispose of AST objects after processing
4. **Progress Tracking**: Use lightweight progress tracking (file counts, not full state)

## Migration Phases

### Phase 1: Analysis & Planning (Week 1)

1. Run comprehensive codebase analysis
2. Generate file classification report
3. Identify circular dependencies
4. Create migration plan with batches
5. Set up backup and rollback mechanisms

### Phase 2: Infrastructure Migration (Week 1)

1. Create app/ layer structure
2. Migrate routes/ → app/routes/
3. Migrate layouts/ → app/layouts/
4. Migrate providers/ → app/providers/
5. Migrate config/ → app/config/ and shared/config/
6. Migrate lib/ → shared/lib/
7. Update main.tsx to use app/ layer

### Phase 3: Feature Migration (Week 2-3)

1. Migrate remaining features from components/:
   - opportunities/
   - college-admin/
   - school-admin/
   - digital-portfolio/
   - ai-tutor/
   - counselling/
   - placement/
2. Create widgets for composite UI blocks
3. Refactor features/assessment to proper FSD structure

### Phase 4: Service & Hook Migration (Week 3-4)

1. Migrate services/ → feature/entity api/ directories
2. Migrate hooks/ → feature/entity model/ directories
3. Migrate utils/ → shared/lib/ or feature lib/
4. Migrate types/ → appropriate layer types
5. Update all import paths

### Phase 5: Page Refactoring (Week 4-5)

1. Extract business logic from pages
2. Remove direct Supabase calls
3. Eliminate direct service imports
4. Refactor pages to composition-only
5. Validate zero business logic in pages

### Phase 6: Validation & Cleanup (Week 5-6)

1. Run comprehensive validation suite
2. Fix any layer hierarchy violations
3. Ensure all imports use public APIs
4. Validate 100% FSD compliance
5. Delete legacy directories
6. Run full test suite
7. Performance audit

### Rollback Strategy

Each phase has a rollback point:

1. **Git Branches**: Each phase in separate branch
2. **Backup System**: Automated backups before each batch
3. **Validation Gates**: Must pass validation before proceeding
4. **Incremental Rollout**: Can rollback individual phases without affecting others

## Success Metrics

### Compliance Metrics

- **FSD Compliance**: 100% (zero files in legacy directories)
- **Layer Violations**: 0
- **Business Logic in Pages**: 0
- **Direct Service Imports**: 0
- **Public API Usage**: 100%

### Quality Metrics

- **TypeScript Errors**: 0
- **Unit Test Pass Rate**: 100%
- **Integration Test Pass Rate**: 100%
- **Code Coverage**: 80%+

### Performance Metrics

- **Build Time**: No increase (or <10% increase)
- **Bundle Size**: 10-20% reduction (from deduplication and tree shaking)
- **Hot Module Replacement**: <1s
- **Test Execution Time**: No significant increase

### Developer Experience Metrics

- **File Discovery Time**: <10s to find any component
- **Import Path Clarity**: 100% of imports use clear, semantic paths
- **Feature Isolation**: 100% of features have clear boundaries
- **Onboarding Time**: 50% reduction for new developers

## Architectural Decisions

### Decision 1: Automated vs Manual Migration

**Decision**: Use automated migration with manual review for edge cases

**Rationale**: 
- 1000+ files make manual migration error-prone and time-consuming
- Automated tooling ensures consistency
- Manual review catches edge cases and validates correctness

### Decision 2: Big Bang vs Incremental Migration

**Decision**: Incremental migration by phase with validation gates

**Rationale**:
- Reduces risk of breaking changes
- Allows rollback of individual phases
- Enables continuous validation and testing
- Maintains working application throughout migration

### Decision 3: Service Ownership (Feature vs Entity)

**Decision**: Services belong to features unless they're pure entity CRUD operations

**Rationale**:
- Features encapsulate business logic and workflows
- Entities represent domain objects with minimal logic
- Most services involve business rules, making them feature-owned
- Entity services limited to basic CRUD operations

### Decision 4: Widget Creation Criteria

**Decision**: Create widgets for components that compose 2+ features or are used by 3+ pages

**Rationale**:
- Avoids over-engineering with too many widgets
- Focuses on genuinely reusable composite blocks
- Maintains clear separation between features and widgets

### Decision 5: Config Split (App vs Shared)

**Decision**: App-specific config in app/config/, reusable config in shared/config/

**Rationale**:
- App config: routing, layouts, providers, app initialization
- Shared config: API endpoints, feature flags, constants, environment variables
- Clear separation of concerns

### Decision 6: Public API Strictness

**Decision**: Enforce public API usage through linting rules and validation

**Rationale**:
- Prevents tight coupling between modules
- Enables easier refactoring within modules
- Improves code discoverability
- Enforces architectural boundaries

### Decision 7: Legacy Directory Deletion Timing

**Decision**: Delete legacy directories only after 100% validation passes

**Rationale**:
- Ensures zero regressions before point of no return
- Allows easy rollback if issues discovered
- Provides confidence in migration completeness

## Conclusion

This design provides a comprehensive approach to completing the FSD migration for the SkillPassport codebase. The migration will transform a 15-20% compliant codebase into a 100% FSD-compliant architecture through:

1. **Automated Migration**: Tooling to migrate 1000+ files with consistency
2. **Business Logic Extraction**: Removing logic from 100+ pages
3. **Layer Enforcement**: Validating FSD hierarchy across all imports
4. **Public API Creation**: Establishing clear module boundaries
5. **Comprehensive Validation**: Ensuring zero regressions

The phased approach with validation gates minimizes risk while the dual testing strategy (unit + property tests) ensures correctness. Upon completion, the codebase will have clear feature boundaries, improved maintainability, and better developer experience.
