# FSD Quick Reference Guide

## Layer Hierarchy

```
app       → Application setup, providers, routing
  ↓
pages     → Route components, page composition
  ↓
widgets   → Complex composite UI (dashboards, forms)
  ↓
features  → User interactions, business features
  ↓
entities  → Business domain models
  ↓
shared    → Reusable utilities, UI components
```

**Rule**: Lower layers cannot import from higher layers

## Import Rules

### ✓ Allowed Imports

```typescript
// Entities can import from shared
import { Button } from '@/shared/ui';

// Features can import from entities and shared
import { User, getUsers } from '@/entities/user';
import { api } from '@/shared/api';

// Widgets can import from features, entities, and shared
import { LoginForm } from '@/features/auth';
import { UserCard } from '@/entities/user';

// Pages can import from widgets, features, entities, and shared
import { KPIDashboard } from '@/widgets/kpi-dashboard';
```

### ✗ Forbidden Imports

```typescript
// ✗ Upward imports (lower layer importing from higher layer)
// entities/user/model/types.ts
import { LoginForm } from '@/features/auth'; // ERROR

// ✗ Cross-slice imports within same layer
// features/auth/ui/LoginForm.tsx
import { CourseCard } from '@/features/courses'; // ERROR

// ✗ Deep imports (bypassing public API)
import { validateUser } from '@/entities/user/model/validation'; // ERROR
// Use: import { validateUser } from '@/entities/user';

// ✗ Widget importing from another widget
// widgets/dashboard/ui/Dashboard.tsx
import { ExamWorkflow } from '@/widgets/exam-workflow'; // ERROR
```

## Entity Structure

```
src/entities/{entity-name}/
├── index.ts              # Public API - ONLY import from here
├── model/
│   ├── index.ts          # Model exports
│   ├── types.ts          # TypeScript interfaces
│   ├── validation.ts     # Validation functions
│   └── utils.ts          # Business logic utilities
├── api/
│   ├── index.ts          # API exports
│   ├── queries.ts        # GET operations
│   └── mutations.ts      # POST/PUT/DELETE operations
└── ui/
    ├── index.ts          # UI exports
    └── {Entity}Card.tsx  # Presentational components
```

## Widget Structure

```
src/widgets/{widget-name}/
├── index.ts              # Public API - ONLY import from here
├── model/
│   ├── index.ts          # Model exports
│   ├── types.ts          # Widget types
│   └── store.ts          # Widget state (optional)
└── ui/
    ├── index.ts          # UI exports
    ├── {Widget}.tsx      # Main widget component
    └── components/       # Internal components (optional)
```

## CLI Commands

### Create New Entity
```bash
bash .kiro/scripts/create-entity.sh product
```

### Create New Widget
```bash
bash .kiro/scripts/create-widget.sh product-catalog
```

### Validate FSD Compliance
```bash
npm run fsd:validate
npm run fsd:validate:verbose
npm run fsd:validate:json
```

### Validate Type Safety
```bash
npm run types:validate
npm run types:validate:strict
```

### Analyze Import Paths
```bash
npm run imports:analyze
npm run imports:standardize
npm run imports:report
```

## Code Snippets (VS Code)

Type these prefixes and press Tab:

- `fsd-entity-types` - Entity type definitions
- `fsd-entity-validation` - Entity validation function
- `fsd-entity-utils` - Entity utility functions
- `fsd-entity-queries` - Entity API queries
- `fsd-entity-mutations` - Entity API mutations
- `fsd-entity-card` - Entity card component
- `fsd-entity-index` - Entity public API
- `fsd-widget` - Widget component
- `fsd-widget-types` - Widget type definitions
- `fsd-widget-store` - Widget Zustand store
- `import-entity` - Import from entity
- `import-widget` - Import from widget
- `import-feature` - Import from feature

## Best Practices

### 1. Always Use Public APIs
```typescript
// ✓ Good
import { User, getUsers, validateUser } from '@/entities/user';

// ✗ Bad
import { User } from '@/entities/user/model/types';
import { validateUser } from '@/entities/user/model/validation';
```

### 2. Use Absolute Imports
```typescript
// ✓ Good
import { Button } from '@/shared/ui';

// ✗ Bad
import { Button } from '../../../shared/ui';
```

### 3. Keep Slices Independent
```typescript
// If two features need to share code, move it to:
// - entities/ (if it's a business domain concept)
// - shared/ (if it's a generic utility)
```

### 4. Widget Composition
```typescript
// Widgets compose features and entities
export function Dashboard() {
  return (
    <div>
      <UserProfile />      {/* from @/features/profile */}
      <CourseList />       {/* from @/features/courses */}
      <UserCard />         {/* from @/entities/user */}
    </div>
  );
}
```

### 5. Entity Responsibilities
- **Model**: Types, validation, business logic
- **API**: Data fetching and mutations
- **UI**: Presentational components only
- **No**: Feature-specific logic, routing, complex state

### 6. Widget Responsibilities
- **Compose**: Multiple features and entities
- **Coordinate**: Complex UI interactions
- **Manage**: Widget-specific state
- **No**: Business logic, API calls (delegate to features/entities)

## Common Patterns

### Entity with API Integration
```typescript
// entities/user/api/queries.ts
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  if (error) throw error;
  return data;
}

// Usage in feature
import { getUsers } from '@/entities/user';
const users = await getUsers();
```

### Widget with State Management
```typescript
// widgets/dashboard/model/store.ts
export const useDashboardStore = create<DashboardStore>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

// widgets/dashboard/ui/Dashboard.tsx
import { useDashboardStore } from '../model/store';
export function Dashboard() {
  const isLoading = useDashboardStore(state => state.isLoading);
  // ...
}
```

### Feature Using Entity
```typescript
// features/user-management/ui/UserList.tsx
import { User, UserCard, getUsers } from '@/entities/user';
import { useQuery } from '@tanstack/react-query';

export function UserList() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });
  
  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} entity={user} />
      ))}
    </div>
  );
}
```

## Troubleshooting

### "Cannot import from higher layer"
- Check the layer hierarchy
- Move shared code to a lower layer (entities or shared)

### "Deep import detected"
- Import from the slice's index.ts instead
- Add the export to the public API if missing

### "Cross-slice import"
- Slices should be independent
- Move shared code to entities or shared layer

### "Circular dependency"
- Usually caused by cross-slice imports
- Refactor to use proper layer hierarchy
- Extract shared types to shared layer

## ESLint Integration

Add FSD rules to your `eslint.config.js`:

```javascript
import fsdRules from './.kiro/eslint/fsd-rules.js';

export default tseslint.config(
  // ... other config
  fsdRules
);
```

This enables automatic checking for:
- Upward imports
- Deep imports
- Cross-slice imports
- Relative imports across layers
