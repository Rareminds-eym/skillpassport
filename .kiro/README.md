# FSD Developer Tools

This directory contains developer tools and resources for working with the Feature-Sliced Design (FSD) architecture.

## Quick Start

### Create a New Entity
```bash
bash .kiro/scripts/create-entity.sh product
```

### Create a New Widget
```bash
bash .kiro/scripts/create-widget.sh product-catalog
```

### Validate FSD Compliance
```bash
npm run fsd:validate
```

## Directory Structure

```
.kiro/
├── docs/                          # API reference and guides
│   ├── entity-api-reference.md    # Entity API documentation
│   ├── widget-api-reference.md    # Widget API documentation
│   └── fsd-quick-reference.md     # FSD best practices guide
├── scripts/                       # CLI tools
│   ├── create-entity.sh           # Entity scaffolding script
│   └── create-widget.sh           # Widget scaffolding script
├── templates/                     # Code templates
│   ├── entity-template.ts         # Entity template
│   └── widget-template.ts         # Widget template
├── eslint/                        # ESLint rules
│   └── fsd-rules.js               # FSD compliance rules
└── vscode/                        # VS Code configuration
    └── fsd-snippets.code-snippets # Code snippets
```

## Available Tools

### 1. CLI Scripts

#### Create Entity
```bash
bash .kiro/scripts/create-entity.sh <entity-name>
```
Creates a complete entity structure with:
- Model (types, validation, utils)
- API (queries, mutations)
- UI (components)
- Public API exports

#### Create Widget
```bash
bash .kiro/scripts/create-widget.sh <widget-name>
```
Creates a complete widget structure with:
- Model (types, state)
- UI (components)
- Public API exports

### 2. ESLint Rules

FSD compliance rules are automatically integrated in `eslint.config.js`:
- `fsd/no-upward-imports` - Prevents lower layers from importing higher layers
- `fsd/use-public-api` - Enforces imports through public APIs
- `fsd/no-cross-slice-imports` - Prevents cross-slice imports
- `fsd/use-absolute-imports` - Enforces @ alias imports

Run linting:
```bash
npm run lint
```

### 3. VS Code Snippets

Type these prefixes and press Tab:
- `fsd-entity-types` - Entity type definitions
- `fsd-entity-validation` - Entity validation
- `fsd-entity-utils` - Entity utilities
- `fsd-entity-queries` - Entity API queries
- `fsd-entity-mutations` - Entity API mutations
- `fsd-entity-card` - Entity card component
- `fsd-widget` - Widget component
- `fsd-widget-types` - Widget types
- `import-entity` - Import from entity
- `import-widget` - Import from widget

### 4. Validation Commands

```bash
# FSD compliance validation
npm run fsd:validate
npm run fsd:validate:verbose
npm run fsd:validate:json

# Type safety validation
npm run types:validate
npm run types:validate:strict

# Import path analysis
npm run imports:analyze
npm run imports:standardize
npm run imports:report
```

## Documentation

- **[Entity API Reference](.kiro/docs/entity-api-reference.md)** - Complete API docs for all entities
- **[Widget API Reference](.kiro/docs/widget-api-reference.md)** - Complete API docs for all widgets
- **[FSD Quick Reference](.kiro/docs/fsd-quick-reference.md)** - Best practices and patterns

## FSD Layer Rules

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

**Golden Rule**: Lower layers cannot import from higher layers

## Examples

### Import from Entity
```typescript
import { User, getUsers, UserCard } from '@/entities/user';
```

### Import from Widget
```typescript
import { KPIDashboard } from '@/widgets/kpi-dashboard';
```

### Create New Entity
```bash
bash .kiro/scripts/create-entity.sh product
# Creates: src/entities/product/
```

### Create New Widget
```bash
bash .kiro/scripts/create-widget.sh product-catalog
# Creates: src/widgets/product-catalog/
```

## Support

For questions or issues with FSD architecture:
1. Check the [FSD Quick Reference](.kiro/docs/fsd-quick-reference.md)
2. Review the [Entity API Reference](.kiro/docs/entity-api-reference.md)
3. Run `npm run fsd:validate` to check compliance
