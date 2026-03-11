# Design Document: FSD Phase 1 Foundation

## Overview

Phase 1 of the Feature-Sliced Design (FSD) migration establishes the architectural foundation by creating the FSD folder structure and migrating shared infrastructure components from the existing flat structure to the new layered architecture. This phase focuses exclusively on the `shared/` layer, which contains reusable infrastructure including UI components, API clients, configuration, utilities, hooks, and types.

The migration strategy prioritizes zero downtime and full backward compatibility by copying files to new locations rather than moving them, allowing both old and new import paths to coexist during the transition period. This approach enables incremental adoption and provides a safe rollback path if issues arise.

### Key Design Principles

1. **Copy, Don't Move**: Preserve existing file locations while creating new FSD structure
2. **Public API Pattern**: All modules export through index.ts files to control interfaces
3. **Backward Compatibility**: Support both old and new import paths during transition
4. **Automated Migration**: Use tooling to ensure consistency and reduce manual errors
5. **Validation First**: Verify build, tests, and runtime functionality after each step

## Architecture

### FSD Layer Hierarchy

The Feature-Sliced Design architecture organizes code into layers with strict import rules:

```
app/        (Application initialization - not in Phase 1)
  ↓
pages/      (Routing pages - not in Phase 1)
  ↓
widgets/    (Complex composite UI - not in Phase 1)
  ↓
features/   (Business features - not in Phase 1)
  ↓
entities/   (Business entities - not in Phase 1)
  ↓
shared/     (Reusable infrastructure - Phase 1 focus)
```

**Import Rules:**
- Higher layers can import from lower layers
- Lower layers CANNOT import from higher layers
- Each layer exposes a public API via index.ts files

### Phase 1 Scope: Shared Layer

Phase 1 creates the `shared/` layer structure and migrates infrastructure components:

```
src/shared/
├── ui/              # Reusable UI components
├── api/             # Base API clients
├── config/          # Application configuration
├── lib/
│   ├── utils/       # Generic utility functions
│   └── hooks/       # Generic React hooks
└── types/           # Shared TypeScript types
```

## Components and Interfaces

### 1. Shared UI Components (`shared/ui/`)

**Purpose**: Reusable UI primitives used across the application

**Source**: `src/components/ui/*`

**Structure**:
```
shared/ui/
├── button.tsx
├── card.tsx
├── input.tsx
├── modal.tsx
├── badge.tsx
├── loader.tsx
├── ... (all components from components/ui/)
└── index.ts
```

**Public API** (`shared/ui/index.ts`):
```typescript
// Named exports for all UI components
export { Button } from './button';
export { Card } from './card';
export { Input } from './input';
export { Modal } from './modal';
// ... all other UI components
```

**Migration Strategy**:
- Copy all files from `components/ui/` to `shared/ui/`
- Preserve original file names and content
- Generate index.ts with alphabetically sorted exports
- Update internal imports within UI components if needed

### 2. Base API Client (`shared/api/`)

**Purpose**: Core API clients for database and external service access

**Source**: `src/lib/supabaseClient.ts`

**Structure**:
```
shared/api/
├── supabaseClient.ts
└── index.ts
```

**Public API** (`shared/api/index.ts`):
```typescript
export { supabase, supabaseAdmin } from './supabaseClient';
```

**Migration Strategy**:
- Copy `lib/supabaseClient.ts` to `shared/api/supabaseClient.ts`
- Preserve all configuration and initialization logic
- Create index.ts with named exports
- Ensure environment variables remain accessible

### 3. Configuration (`shared/config/`)

**Purpose**: Application-wide configuration and constants

**Source**: `src/config/*`

**Structure**:
```
shared/config/
├── alerts.ts
├── fileSizeLimits.ts
├── logging.ts
├── metrics-dashboard.ts
├── monitoring.ts
├── payment.js
├── registrationConfig.js
├── subscriptionPlans.js
└── index.ts
```

**Public API** (`shared/config/index.ts`):
```typescript
export * from './alerts';
export * from './fileSizeLimits';
export * from './logging';
export * from './metrics-dashboard';
export * from './monitoring';
export * from './payment';
export * from './registrationConfig';
export * from './subscriptionPlans';
```

**Migration Strategy**:
- Copy all files from `config/` to `shared/config/`
- Preserve all configuration values
- Create index.ts with re-exports
- Maintain backward compatibility for config imports

### 4. Generic Utilities (`shared/lib/utils/`)

**Purpose**: Reusable utility functions not tied to specific features

**Source**: Selected files from `src/utils/*`

**Criteria for Migration**:
- Generic, reusable across multiple features
- No feature-specific business logic
- Pure functions or simple helpers

**Files to Migrate**:
```
shared/lib/utils/
├── cn.ts                    # Class name utility
├── formatters.ts            # Date, currency, text formatters
├── fileValidation.ts        # File type/size validation
├── isbnValidator.ts         # ISBN validation
├── fingerprint.ts           # Device fingerprinting
├── chartDownload.ts         # Chart export utility
└── index.ts
```

**Files to Exclude** (feature-specific):
- authCleanup.js (auth feature)
- authErrorHandler.js (auth feature)
- profileCompletenessChecker.ts (student-profile feature)
- subscriptionHelpers.js (subscription feature)
- organizationHelper.ts (organization feature)

**Public API** (`shared/lib/utils/index.ts`):
```typescript
export { cn } from './cn';
export * from './formatters';
export * from './fileValidation';
export * from './isbnValidator';
export * from './fingerprint';
export * from './chartDownload';
```

**Migration Strategy**:
- Manually review each utility file
- Copy generic utilities to `shared/lib/utils/`
- Leave feature-specific utilities in original location
- Document which utilities were migrated vs. deferred

### 5. Generic Hooks (`shared/lib/hooks/`)

**Purpose**: Reusable React hooks not tied to specific features

**Source**: Selected files from `src/hooks/*`

**Criteria for Migration**:
- Generic, reusable across multiple features
- No feature-specific business logic
- UI/UX helpers or general React patterns

**Files to Migrate**:
```
shared/lib/hooks/
├── use-toast.js             # Toast notification hook
├── useresponsive.tsx        # Responsive design hook
└── index.ts
```

**Files to Exclude** (feature-specific):
- useAuth.js (auth feature)
- useMessages.ts (messaging feature)
- useStudentData.js (student-profile feature)
- useCounsellingChat.ts (counselling feature)
- All other domain-specific hooks

**Public API** (`shared/lib/hooks/index.ts`):
```typescript
export { useToast } from './use-toast';
export { useResponsive } from './useresponsive';
```

**Migration Strategy**:
- Manually review each hook file
- Copy generic hooks to `shared/lib/hooks/`
- Leave feature-specific hooks in original location
- Document which hooks were migrated vs. deferred

### 6. Shared Types (`shared/types/`)

**Purpose**: TypeScript type definitions shared across multiple features

**Source**: Selected files from `src/types/*`

**Criteria for Migration**:
- Used by multiple features
- Not specific to a single domain
- Infrastructure or common data types

**Files to Migrate**:
```
shared/types/
├── index.ts                 # Re-export common types
└── common.ts                # New file for truly shared types
```

**Migration Strategy**:
- Review existing types in `src/types/*`
- Most types are feature-specific (college, student, recruiter, etc.)
- Create `common.ts` for truly shared types if needed
- Defer most type migrations to feature-specific phases
- For Phase 1, create minimal structure with index.ts

**Public API** (`shared/types/index.ts`):
```typescript
// Phase 1: Minimal shared types
export type * from './common';
```

## Data Models

### File Migration Mapping

Complete mapping of source files to destination locations:

#### UI Components
```
components/ui/button.tsx          → shared/ui/button.tsx
components/ui/card.tsx            → shared/ui/card.tsx
components/ui/input.tsx           → shared/ui/input.tsx
components/ui/modal.tsx           → shared/ui/modal.tsx
components/ui/badge.tsx           → shared/ui/badge.tsx
components/ui/loader.tsx          → shared/ui/loader.tsx
... (all other UI components)
```

#### API Clients
```
lib/supabaseClient.ts             → shared/api/supabaseClient.ts
```

#### Configuration
```
config/alerts.ts                  → shared/config/alerts.ts
config/fileSizeLimits.ts          → shared/config/fileSizeLimits.ts
config/logging.ts                 → shared/config/logging.ts
config/metrics-dashboard.ts       → shared/config/metrics-dashboard.ts
config/monitoring.ts              → shared/config/monitoring.ts
config/payment.js                 → shared/config/payment.js
config/registrationConfig.js      → shared/config/registrationConfig.js
config/subscriptionPlans.js       → shared/config/subscriptionPlans.js
```

#### Utilities
```
utils/cn.ts                       → shared/lib/utils/cn.ts
utils/formatters.ts               → shared/lib/utils/formatters.ts
utils/fileValidation.ts           → shared/lib/utils/fileValidation.ts
utils/isbnValidator.ts            → shared/lib/utils/isbnValidator.ts
utils/fingerprint.ts              → shared/lib/utils/fingerprint.ts
utils/chartDownload.ts            → shared/lib/utils/chartDownload.ts
```

#### Hooks
```
hooks/use-toast.js                → shared/lib/hooks/use-toast.js
hooks/useresponsive.tsx           → shared/lib/hooks/useresponsive.tsx
```

### Import Path Transformation

The migration system must update import statements across the codebase:

#### UI Components
```typescript
// Before
import { Button } from '@/components/ui/button';
import { Card } from '../components/ui/card';

// After
import { Button } from '@/shared/ui';
import { Card } from '@/shared/ui';
```

#### API Clients
```typescript
// Before
import { supabase } from '@/lib/supabaseClient';
import { supabase } from '../lib/supabaseClient';

// After
import { supabase } from '@/shared/api';
import { supabase } from '@/shared/api';
```

#### Configuration
```typescript
// Before
import { ALERT_CONFIG } from '@/config/alerts';
import paymentConfig from '../config/payment';

// After
import { ALERT_CONFIG } from '@/shared/config';
import { paymentConfig } from '@/shared/config';
```

#### Utilities
```typescript
// Before
import { cn } from '@/utils/cn';
import { formatDate } from '../utils/formatters';

// After
import { cn } from '@/shared/lib/utils';
import { formatDate } from '@/shared/lib/utils';
```

#### Hooks
```typescript
// Before
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '../hooks/useresponsive';

// After
import { useToast } from '@/shared/lib/hooks';
import { useResponsive } from '@/shared/lib/hooks';
```

### Import Path Patterns

The migration system must handle various import patterns:

1. **Absolute imports with @/ alias**: `@/components/ui/button`
2. **Relative imports**: `../components/ui/button`, `../../lib/supabaseClient`
3. **Direct file imports**: `@/components/ui/button.tsx`
4. **Index imports**: `@/components/ui` (if index exists)

**Transformation Strategy**:
- Use AST parsing to identify import statements
- Match import paths against migration mapping
- Replace with public API imports (via index.ts)
- Preserve import style (named, default, namespace)
- Update both .ts, .tsx, .js, and .jsx files


## Migration Implementation Strategy

### Phase 1 Execution Steps

The migration follows a sequential process to minimize risk:

**Step 1: Create FSD Folder Structure**
```bash
mkdir -p src/shared/ui
mkdir -p src/shared/api
mkdir -p src/shared/config
mkdir -p src/shared/lib/utils
mkdir -p src/shared/lib/hooks
mkdir -p src/shared/types
```

**Step 2: Copy UI Components**
- Copy all files from `src/components/ui/` to `src/shared/ui/`
- Generate `src/shared/ui/index.ts` with named exports
- Verify no internal import issues within UI components

**Step 3: Copy API Client**
- Copy `src/lib/supabaseClient.ts` to `src/shared/api/supabaseClient.ts`
- Create `src/shared/api/index.ts` with exports
- Verify environment variables are accessible

**Step 4: Copy Configuration**
- Copy all files from `src/config/` to `src/shared/config/`
- Create `src/shared/config/index.ts` with re-exports
- Verify configuration values are preserved

**Step 5: Copy Generic Utilities**
- Manually identify generic utilities from `src/utils/`
- Copy selected utilities to `src/shared/lib/utils/`
- Create `src/shared/lib/utils/index.ts` with exports
- Document excluded utilities

**Step 6: Copy Generic Hooks**
- Manually identify generic hooks from `src/hooks/`
- Copy selected hooks to `src/shared/lib/hooks/`
- Create `src/shared/lib/hooks/index.ts` with exports
- Document excluded hooks

**Step 7: Create Shared Types Structure**
- Create `src/shared/types/index.ts`
- Create `src/shared/types/common.ts` if needed
- Defer most type migrations to later phases

**Step 8: Update Import Paths**
- Scan entire codebase for imports from migrated locations
- Update import statements to use new `shared/` paths
- Use public API imports (via index.ts)
- Verify no broken imports

**Step 9: Validation**
- Run TypeScript compiler: `npm run type-check`
- Run build process: `npm run build`
- Run test suite: `npm run test`
- Manual testing of key user flows
- Check for console errors in development

**Step 10: Documentation**
- Generate migration report with file counts
- Document any deviations from plan
- Update developer documentation

### Backward Compatibility Strategy

To ensure zero downtime and safe rollback:

1. **Preserve Original Files**: Keep all files in original locations
2. **Dual Import Support**: Both old and new import paths work
3. **Gradual Adoption**: Teams can adopt new paths incrementally
4. **Deprecation Period**: Announce timeline for removing old structure
5. **Monitoring**: Track usage of old vs. new import paths

**Implementation**:
- Original files remain untouched
- New files are copies, not moves
- No breaking changes in Phase 1
- Old structure removal planned for Phase 6 (after all features migrated)

### Rollback Plan

If critical issues arise:

1. **Git Revert**: Revert the migration commit
2. **Feature Flag**: Toggle between old/new structure (if implemented)
3. **Selective Rollback**: Keep new structure but revert import updates
4. **Hotfix**: Fix specific issues while keeping migration

**Rollback Triggers**:
- Build failures that cannot be quickly resolved
- Critical runtime errors in production
- Test suite failures exceeding 5% of tests
- Performance degradation > 10%

## Automated Migration Tooling

### Tool Requirements

The migration system should provide:

1. **File Copier**: Copy files from source to destination
2. **Index Generator**: Create index.ts files with exports
3. **Import Updater**: Transform import statements
4. **Validator**: Verify migration completeness
5. **Reporter**: Generate migration statistics

### Import Update Algorithm

```typescript
interface MigrationMapping {
  pattern: RegExp;
  replacement: string;
  publicApi: string;
}

const mappings: MigrationMapping[] = [
  {
    pattern: /['"]@?\/components\/ui\/([^'"]+)['"]/,
    replacement: '@/shared/ui',
    publicApi: 'shared/ui'
  },
  {
    pattern: /['"]@?\/lib\/supabaseClient['"]/,
    replacement: '@/shared/api',
    publicApi: 'shared/api'
  },
  {
    pattern: /['"]@?\/config\/([^'"]+)['"]/,
    replacement: '@/shared/config',
    publicApi: 'shared/config'
  },
  // ... more mappings
];

function updateImports(fileContent: string): string {
  let updated = fileContent;
  
  for (const mapping of mappings) {
    updated = updated.replace(
      mapping.pattern,
      `'${mapping.replacement}'`
    );
  }
  
  return updated;
}
```

### Index.ts Generation

```typescript
function generateIndexFile(directory: string): string {
  const files = getFilesInDirectory(directory);
  const exports: string[] = [];
  
  for (const file of files) {
    if (file === 'index.ts') continue;
    
    const moduleName = file.replace(/\.(ts|tsx|js|jsx)$/, '');
    const exportName = toPascalCase(moduleName);
    
    exports.push(`export { ${exportName} } from './${moduleName}';`);
  }
  
  // Sort alphabetically
  exports.sort();
  
  return exports.join('\n') + '\n';
}
```

### Validation Checks

The migration system must verify:

1. **File Existence**: All expected files copied successfully
2. **Import Resolution**: No unresolved imports
3. **Type Checking**: TypeScript compiles without errors
4. **Build Success**: Production build completes
5. **Test Passing**: All tests pass
6. **Runtime Verification**: Application starts without errors


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

**File Content Preservation**: Requirements 2.3, 4.3, 5.4, 6.4, 7.4, 9.4, 9.5, 9.6 all specify that file content should be preserved during migration. These can be combined into a single comprehensive property.

**Public API Accessibility**: Requirements 2.5, 4.4, 5.5, 6.5, 7.5 all specify that migrated modules should be accessible via public APIs. These can be combined into a single property.

**Import Path Updates**: Requirements 8.1-8.6 all specify updating import paths for different module types. These can be combined into a single property with the migration mapping as input.

**Index.ts Generation**: Requirements 12.1-12.5 all specify how index.ts files should be created. These can be combined into a single comprehensive property.

**Backward Compatibility**: Requirements 13.1, 13.2, 13.3 all relate to maintaining both old and new file locations. These can be combined into a single property.

### Property 1: File Copy Preserves Content

*For any* file in the migration mapping (UI components, config files, utilities, hooks, types), when the migration system copies it from source to destination, the destination file content SHALL be identical to the source file content.

**Validates: Requirements 2.1, 2.3, 3.1, 3.3, 4.1, 4.3, 5.1, 5.4, 6.1, 6.4, 7.1, 7.4, 9.4, 9.5, 9.6**

### Property 2: Public API Exports All Migrated Modules

*For any* shared subdirectory (ui, api, config, lib/utils, lib/hooks, types), when the migration completes, all migrated modules in that subdirectory SHALL be exported through the index.ts public API.

**Validates: Requirements 2.5, 4.4, 5.5, 6.5, 7.5**

### Property 3: Import Path Transformation

*For any* import statement in the codebase that references a migrated module, the migration system SHALL update the import path to reference the new shared/ location using the public API path.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8**

### Property 4: Index Files Use Named Exports

*For any* index.ts file created in the shared/ layer, all exports SHALL use named export syntax (not default exports) and SHALL be organized alphabetically.

**Validates: Requirements 12.2, 12.3, 12.4**

### Property 5: Feature-Specific Modules Remain Unmigrated

*For any* utility, hook, or type identified as feature-specific, the migration system SHALL NOT copy it to the shared/ layer, and it SHALL remain in its original location.

**Validates: Requirements 5.3, 6.3, 7.3**

### Property 6: Backward Compatibility Maintained

*For any* file that is migrated to the shared/ layer, both the original file location and the new file location SHALL exist after migration, allowing imports from either path to resolve successfully.

**Validates: Requirements 13.1, 13.2, 13.3**

### Property 7: All Pages Render Successfully

*For any* page route in the application, when the migration completes, navigating to that route SHALL render the page without runtime errors.

**Validates: Requirements 9.2**

### Property 8: Index Files Created for All Subdirectories

*For any* subdirectory created under shared/ (ui, api, config, lib/utils, lib/hooks, types), the migration system SHALL create an index.ts file in that subdirectory.

**Validates: Requirements 12.1**

### Property 9: Internal Imports Preserved

*For any* UI component that contains imports to other UI components, when the component is migrated to shared/ui/, those internal import references SHALL continue to resolve correctly.

**Validates: Requirements 2.4**


## Error Handling

### Migration Errors

**File Copy Failures**:
- **Cause**: Permission issues, disk space, file locks
- **Handling**: Log error with file path, skip file, continue migration, report at end
- **Recovery**: Manual file copy or re-run migration for failed files

**Import Update Failures**:
- **Cause**: Complex import patterns, dynamic imports, non-standard syntax
- **Handling**: Log warning with file path and import statement, skip update, continue
- **Recovery**: Manual import update with developer review

**Index Generation Failures**:
- **Cause**: Circular dependencies, invalid module exports
- **Handling**: Log error with directory path, create partial index.ts, continue
- **Recovery**: Manual index.ts completion

**Build Failures**:
- **Cause**: Broken imports, type errors, missing dependencies
- **Handling**: Stop migration, display build errors, provide rollback option
- **Recovery**: Fix errors or rollback migration

**Test Failures**:
- **Cause**: Broken imports in tests, changed module paths
- **Handling**: Display failing tests, provide import update suggestions
- **Recovery**: Update test imports or rollback migration

### Validation Errors

**Missing Files**:
- **Detection**: Compare expected vs. actual migrated files
- **Handling**: Report missing files with source paths
- **Recovery**: Re-run migration or manual file copy

**Broken Imports**:
- **Detection**: TypeScript compiler errors, build failures
- **Handling**: List all unresolved imports with file locations
- **Recovery**: Update imports or add missing files

**Runtime Errors**:
- **Detection**: Application startup, page navigation, console errors
- **Handling**: Log errors with stack traces, identify affected modules
- **Recovery**: Fix module exports or rollback migration

### Rollback Procedures

**Git-Based Rollback**:
```bash
# Revert migration commit
git revert <migration-commit-hash>

# Or reset to pre-migration state
git reset --hard <pre-migration-commit-hash>
```

**Selective Rollback**:
- Keep new shared/ structure
- Revert import path updates
- Allow gradual re-migration

**Partial Rollback**:
- Rollback specific subdirectories (e.g., shared/ui only)
- Keep other migrations intact
- Useful for isolating issues

## Testing Strategy

### Dual Testing Approach

The migration requires both unit tests and property-based tests to ensure correctness:

**Unit Tests**: Verify specific examples, edge cases, and concrete scenarios
**Property Tests**: Verify universal properties across all inputs with randomization

Both approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across many inputs.

### Property-Based Testing

**Library**: fast-check (for TypeScript/JavaScript)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `Feature: fsd-phase-1-foundation, Property {number}: {property_text}`

**Property Test Examples**:

```typescript
import fc from 'fast-check';

describe('Feature: fsd-phase-1-foundation, Property 1: File Copy Preserves Content', () => {
  it('should preserve file content when copying from source to destination', () => {
    fc.assert(
      fc.property(
        fc.record({
          filename: fc.string({ minLength: 1, maxLength: 50 }),
          content: fc.string(),
          sourceDir: fc.constantFrom('components/ui', 'config', 'utils', 'hooks'),
        }),
        ({ filename, content, sourceDir }) => {
          // Setup: Create source file with content
          const sourcePath = `${sourceDir}/${filename}`;
          const destPath = getDestinationPath(sourcePath);
          
          writeFile(sourcePath, content);
          
          // Execute: Run migration
          migrationSystem.copyFile(sourcePath, destPath);
          
          // Verify: Destination content matches source
          const destContent = readFile(destPath);
          expect(destContent).toBe(content);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: fsd-phase-1-foundation, Property 3: Import Path Transformation', () => {
  it('should update all import paths to reference new shared/ locations', () => {
    fc.assert(
      fc.property(
        fc.record({
          importPath: fc.constantFrom(
            '@/components/ui/button',
            '../components/ui/card',
            '@/lib/supabaseClient',
            '@/config/alerts',
            '@/utils/cn',
            '@/hooks/use-toast'
          ),
          fileContent: fc.string(),
        }),
        ({ importPath, fileContent }) => {
          // Setup: Create file with old import
          const testFile = `import { Something } from '${importPath}';\n${fileContent}`;
          
          // Execute: Update imports
          const updated = migrationSystem.updateImports(testFile);
          
          // Verify: Import path updated to shared/
          const expectedPath = getExpectedSharedPath(importPath);
          expect(updated).toContain(expectedPath);
          expect(updated).not.toContain(importPath);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: fsd-phase-1-foundation, Property 6: Backward Compatibility Maintained', () => {
  it('should maintain both old and new file locations after migration', () => {
    fc.assert(
      fc.property(
        fc.record({
          filename: fc.string({ minLength: 1, maxLength: 50 }),
          sourceDir: fc.constantFrom('components/ui', 'config', 'lib'),
        }),
        ({ filename, sourceDir }) => {
          // Setup: Create source file
          const sourcePath = `${sourceDir}/${filename}`;
          const destPath = getDestinationPath(sourcePath);
          
          writeFile(sourcePath, 'test content');
          
          // Execute: Run migration
          migrationSystem.copyFile(sourcePath, destPath);
          
          // Verify: Both locations exist
          expect(fileExists(sourcePath)).toBe(true);
          expect(fileExists(destPath)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

**Focus Areas**:
- Specific directory creation (Requirements 1.1-1.12)
- Specific file migrations (supabaseClient, specific configs)
- Build success after migration
- Test suite passing after migration
- Application startup without errors
- Rollback functionality
- Documentation generation

**Unit Test Examples**:

```typescript
describe('FSD Structure Creation', () => {
  it('should create src/shared/ui/ directory', () => {
    migrationSystem.createStructure();
    expect(fs.existsSync('src/shared/ui')).toBe(true);
  });

  it('should create src/shared/api/ directory', () => {
    migrationSystem.createStructure();
    expect(fs.existsSync('src/shared/api')).toBe(true);
  });

  it('should create all required shared subdirectories', () => {
    migrationSystem.createStructure();
    
    const requiredDirs = [
      'src/app',
      'src/pages',
      'src/widgets',
      'src/features',
      'src/entities',
      'src/shared',
      'src/shared/ui',
      'src/shared/api',
      'src/shared/config',
      'src/shared/lib/utils',
      'src/shared/lib/hooks',
      'src/shared/types',
    ];
    
    requiredDirs.forEach(dir => {
      expect(fs.existsSync(dir)).toBe(true);
    });
  });
});

describe('Supabase Client Migration', () => {
  it('should copy supabaseClient.ts to shared/api/', () => {
    migrationSystem.migrateApiClients();
    
    expect(fs.existsSync('src/shared/api/supabaseClient.ts')).toBe(true);
  });

  it('should create index.ts in shared/api/ with supabase exports', () => {
    migrationSystem.migrateApiClients();
    
    const indexContent = fs.readFileSync('src/shared/api/index.ts', 'utf-8');
    expect(indexContent).toContain("export { supabase");
  });
});

describe('Build Validation', () => {
  it('should compile without TypeScript errors after migration', () => {
    migrationSystem.runFullMigration();
    
    const result = execSync('npm run type-check', { encoding: 'utf-8' });
    expect(result).not.toContain('error TS');
  });

  it('should build successfully after migration', () => {
    migrationSystem.runFullMigration();
    
    const result = execSync('npm run build', { encoding: 'utf-8' });
    expect(result).toContain('built successfully');
  });

  it('should produce bundle size within 5% of original', () => {
    const originalSize = getBundleSize();
    
    migrationSystem.runFullMigration();
    
    const newSize = getBundleSize();
    const difference = Math.abs(newSize - originalSize) / originalSize;
    
    expect(difference).toBeLessThan(0.05);
  });
});

describe('Test Suite Validation', () => {
  it('should pass all existing tests after migration', () => {
    migrationSystem.runFullMigration();
    
    const result = execSync('npm run test', { encoding: 'utf-8' });
    expect(result).toContain('All tests passed');
  });
});

describe('Documentation Generation', () => {
  it('should generate migration report with file counts', () => {
    const report = migrationSystem.runFullMigration();
    
    expect(report.migratedFiles).toBeGreaterThan(0);
    expect(report.updatedImports).toBeGreaterThan(0);
    expect(report.createdIndexFiles).toBeGreaterThan(0);
  });

  it('should list all migrated files', () => {
    const report = migrationSystem.runFullMigration();
    
    expect(report.migratedFilesList).toBeInstanceOf(Array);
    expect(report.migratedFilesList.length).toBeGreaterThan(0);
  });
});

describe('Rollback Functionality', () => {
  it('should successfully rollback migration', () => {
    // Take snapshot before migration
    const snapshot = takeFilesystemSnapshot();
    
    migrationSystem.runFullMigration();
    migrationSystem.rollback();
    
    // Verify filesystem restored
    const current = takeFilesystemSnapshot();
    expect(current).toEqual(snapshot);
  });
});
```

### Integration Testing

**Test Scenarios**:
1. Full migration end-to-end
2. Application startup after migration
3. Page navigation across all routes
4. Component rendering with new imports
5. API calls using migrated supabase client
6. Configuration access from new paths

**Manual Testing Checklist**:
- [ ] Application starts without console errors
- [ ] All pages load successfully
- [ ] UI components render correctly
- [ ] Authentication flows work
- [ ] API calls succeed
- [ ] Configuration values accessible
- [ ] No broken images or assets
- [ ] Developer tools show no warnings

### Performance Testing

**Metrics to Track**:
- Build time (before vs. after)
- Bundle size (before vs. after)
- Application startup time
- Page load times
- Hot module replacement speed

**Acceptance Criteria**:
- Build time: Within ±10% of original
- Bundle size: Within ±5% of original
- No performance regressions in user-facing metrics

### Test Execution Order

1. **Pre-Migration**: Run all tests, record baseline metrics
2. **Post-Structure Creation**: Verify directories exist
3. **Post-File Copy**: Verify files copied, content preserved
4. **Post-Import Update**: Run TypeScript compiler, verify no errors
5. **Post-Migration**: Run full test suite, build, manual testing
6. **Performance Validation**: Compare metrics to baseline

