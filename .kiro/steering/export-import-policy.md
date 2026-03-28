---
inclusion: always
---

# Export/Import Policy for FSD Migration

## Build Command Policy

**CRITICAL**: Always use `npm run build:dev` for testing builds, NEVER use `npm run dev`.

- `npm run build:dev` - Use this to test the build and catch import/export errors
- `npm run dev` - Do NOT use for testing, this is for development server only

## Import/Export Analysis Process

When fixing import/export issues, follow this strict process:

### 1. Identify the Error
- Run `npm run build:dev` to get the exact error
- Note the file path and line number
- Note what is being imported and from where

### 2. Check the Entire File
- Read the COMPLETE file that has the import error
- Identify ALL imports from the problematic module
- Check if there are multiple imports that might have the same issue

### 3. Analyze the Export Side
- Read the index file being imported from
- Check if exports are default or named
- Verify the actual component file's export type
- Look for duplicate exports (multiple `export default` or `export { default }`)

### 4. Check for Codebase-Wide Issues
- Use scripts to find all files with the same import pattern
- Fix all occurrences at once, not one by one
- Example: If `SearchBar` import is wrong in one file, it's likely wrong in many files

### 5. Consult Migration Backups
- If confused about file structure, check `.migration-backups/legacy-final-backup-2026-03-23-173634/`
- If a file is corrupted or incomplete, restore from backup
- Backup structure: `.migration-backups/legacy-final-backup-2026-03-23-173634/components/`

## Common Import/Export Patterns

### Named Exports (Preferred in FSD)
```typescript
// Export side
export { ComponentName } from './ComponentName';
export { default as ComponentName } from './ComponentName';

// Import side
import { ComponentName } from '@/feature/name';
```

### Default Exports (Legacy)
```typescript
// Export side
export default ComponentName;

// Import side
import ComponentName from '@/feature/name';
```

### FORBIDDEN: Duplicate Default Exports
```typescript
// ❌ WRONG - Cannot have both
export { default } from './Component';
export { default as Component } from './Component';

// ✅ CORRECT - Choose one
export { default as Component } from './Component';
```

## Script-Based Fixing

When the same issue appears in multiple files, create a Python script:

```python
from pathlib import Path

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the problematic import
    if 'import Component from "@/module"' in content:
        content = content.replace(
            'import Component from "@/module"',
            'import { Component } from "@/module"'
        )
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path('src')
    fixed = 0
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            if fix_file(filepath):
                fixed += 1
    print(f"Fixed {fixed} files")

if __name__ == '__main__':
    main()
```

## Common Issues After FSD Migration

### 1. Header Components
- All role-specific headers now export as named exports
- Use: `import { Header } from '@/features/feature-name'`
- NOT: `import Header from '@/features/feature-name'`

### 2. Subscription Components
- `SubscriptionProtectedRoute` - named export
- `DatePicker` - named export
- `SubscriptionPurchaseHeader` - default export from specific path

### 3. Guards
- `OrganizationGuard` - exported from `@/shared/lib/guards`
- NOT from `@/features/subscription`

### 4. Shared UI Components
- `SearchBar` - named export from `@/shared/ui`
- `Footer` - named export from `@/shared/ui`
- `ConfirmModal` - named export from `@/shared/ui`

### 5. Widget Components
- Mock data exports from `@/widgets/student-dashboard/model/mockData`
- NOT from feature index files

## Verification Steps

After each fix:
1. Run `npm run build:dev`
2. If error persists, check if the same pattern exists elsewhere
3. Create a script to fix all occurrences
4. Run build again
5. Repeat until build succeeds

## File Path Resolution

- Always use `@/` alias for imports
- Check actual file locations in FSD structure
- Verify paths in index.ts files match actual component locations
- Use `fileSearch` tool to locate components if unsure
