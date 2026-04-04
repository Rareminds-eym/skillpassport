# Phase 6 Migration Scripts

## Running the Analysis

To analyze the codebase and generate migration reports:

```bash
npx tsx src/migration/scripts/phase6-analyze.ts
```

This will:
1. Scan all source files and classify them
2. Build dependency graph
3. Detect circular dependencies
4. Create migration plan with batches
5. Create backup of legacy directories
6. Generate JSON reports in `.migration-reports/`

## Output

The analysis generates:
- `.migration-reports/analysis-report.json` - Full classification report
- `.migration-reports/circular-dependencies.json` - Circular dependency report with visualization
- `.migration-backups/backup-{timestamp}/` - Backup of all legacy directories

## Next Steps

After running the analysis:
1. Review the reports to understand the migration scope
2. Check circular dependencies and resolve critical ones
3. Proceed with Phase 2: Infrastructure Migration
