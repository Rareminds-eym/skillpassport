# Migration: pagesUrl → apiUtils

## Summary

Successfully migrated API URL utilities from `@/shared/lib/pagesUrl` to `@/shared/api/apiUtils` for FSD architecture compliance.

## What Changed

### Files Modified
- **src/shared/api/apiUtils.ts** - Added 3 API URL utility functions with comprehensive documentation
- **47 source files** - Updated imports and function calls

### Files Deleted
- **src/shared/lib/pagesUrl.ts** - Deprecated file removed

## Functions Migrated

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `getPagesBaseUrl()` | `getApiBaseUrl()` | Get base URL for API endpoints |
| `getPagesApiUrl(path)` | `getApiUrl