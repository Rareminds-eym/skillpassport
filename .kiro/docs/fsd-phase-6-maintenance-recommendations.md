# FSD Phase 6 - Ongoing Maintenance Recommendations

**Document Purpose:** Provide guidance for maintaining FSD architectural compliance and code quality after Phase 6 migration completion  
**Target Audience:** Development team, technical leads, new team members  
**Last Updated:** March 20, 2026

---

## Overview

The FSD Phase 6 migration has established a solid architectural foundation with comprehensive tooling and validation systems. This document provides recommendations for maintaining code quality, architectural compliance, and developer productivity going forward.

---

## Daily Development Practices

### 1. Creating New Entities

**When to create an entity:**
- You're working with a new business domain object (e.g., Invoice, Payment, Notification)
- The object has data models, business logic, and UI representations
- The object will be reused across multiple features

**How to create an entity:**

```bash
# Use the entity creation script
.kiro/scripts/create-entity.sh <entity-name>

# Example:
.kiro/scripts/create-entity.sh invoice
```

**Entity structure to follow:**
```
src/entities/<entity-name>/
├── index.ts              # Public API exports
├── model/
│   ├── index.ts          # Model exports
│   ├── types.ts          # TypeScript interfaces
│   ├── validation.ts     # Validation logic
│   └── utils.ts          # Entity utilities
├── ui/
│   ├── index.ts          # UI exports
│   └── <Entity>Card.tsx  # Display components
└── api/
    ├── index.ts          # API exports
    ├── queries.ts        # Data fetching
    └── mutations.ts      # Data mutations
```

**Best practices:**
- Keep entity logic domain-focused (no feature-specific code)
- Export only public APIs through index.ts
- Use TypeScript interfaces for all entity types
- Implement validation logic in validation.ts
- Document entity relationships in comments

### 2. Creating New Widgets

**When to create a widget:**
- You're building a complex UI composition that uses multiple features
- The component combines entities and features into a reusable interface section
- The component has significant internal state or composition logic

**How to create a widget:**

```bash
# Use the widget creation script
.kiro/scripts/create-widget.sh <widget-name>

# Example:
.kiro/scripts/create-widget.sh analytics-dashboard
```

**Widget structure to follow:**
```
src/widgets/<widget-name>/
├── index.ts              # Public API exports
├── ui/
│   ├── index.ts          # UI exports
│   ├── <Widget>.tsx      # Main widget component
│   └── components/       # Internal components
└── model/
    ├── index.ts          # Model exports
    ├── types.ts          # Widget-specific types
    └── store.ts          # Widget state (if needed)
```

**Best practices:**
- Widgets should only import from entities, features, and shared layers
- Keep widget state management in /model/ subdirectory
- Use composition over inheritance
- Document composition patterns in comments
- Expose minimal public API through index.ts

### 3. Creating New Features

**When to create a feature:**
- You're implementing a user-facing capability or workflow
- The feature encapsulates business logic and user interactions
- The feature may use entities but doesn't define them

**How to create a feature:**

```bash
# Use VS Code snippets or manual creation
# Snippet: type "fsd-feature" in VS Code
```

**Feature structure to follow:**
```
src/features/<feature-name>/
├── index.ts              # Public API exports
├── ui/
│   └── <Feature>.tsx     # Feature UI components
├── model/
│   ├── types.ts          # Feature types
│   └── store.ts          # Feature state
└── api/
    └── <feature>Api.ts   # Feature-specific API calls
```

**Best practices:**
- Features can import from entities and shared layers
- Features should not import from other features (use composition in widgets/pages)
- Keep feature logic focused on a single capability
- Use Zustand for feature state management
- Document feature dependencies

### 4. Import Path Guidelines

**Always use absolute imports with @ alias:**

```typescript
// ✅ CORRECT
import { User } from '@/entities/user'
import { CourseCard } from '@/entities/course/ui'
import { Button } from '@/shared/ui/button'

// ❌ INCORRECT
import { User } from '../../../entities/user'
import { CourseCard } from '../../entities/course/ui/CourseCard'
```

**Always import through public APIs (index.ts):**

```typescript
// ✅ CORRECT
import { User, validateUser } from '@/entities/user'

// ❌ INCORRECT
import { User } from '@/entities/user/model/types'
import { validateUser } from '@/entities/user/model/validation'
```

**Follow FSD layer import rules:**

```typescript
// ✅ CORRECT - Lower layers can import from even lower layers
// In a feature:
import { User } from '@/entities/user'
import { Button } from '@/shared/ui/button'

// ❌ INCORRECT - Lower layers cannot import from higher layers
// In an entity:
import { UserProfile } from '@/features/user-profile' // WRONG!
```

---

## Weekly Maintenance Tasks

### 1. Run FSD Compliance Validation

**Frequency:** Weekly or before major releases

```bash
# Run FSD compliance validator
npm run validate:fsd

# Or use the script directly
tsx src/migration/scripts/validate-fsd-compliance.ts
```

**What it checks:**
- Layer hierarchy compliance
- No upward dependencies
- Public API usage
- Cross-feature import patterns

**Action items:**
- Review any violations reported
- Fix violations before merging to main branch
- Update ESLint rules if new patterns emerge

### 2. Check Type Safety

**Frequency:** Weekly or before major releases

```bash
# Run type safety validator
npm run validate:types

# Or use the script directly
tsx src/migration/scripts/validate-type-safety.ts
```

**What it checks:**
- TypeScript strict mode compliance
- Complete entity interfaces
- Proper API function types
- Typed Zustand stores
- No 'any' types in disallowed locations

**Action items:**
- Fix any type errors reported
- Add missing interfaces
- Remove 'any' types where possible

### 3. Analyze Import Paths

**Frequency:** Weekly or when adding new slices

```bash
# Analyze import paths
npm run analyze:imports

# Generate import report
tsx src/migration/scripts/generate-import-report.ts
```

**What it checks:**
- Import path standardization
- Public API usage
- Cross-layer imports
- Relative vs absolute imports

**Action items:**
- Refactor non-standard import paths
- Update public APIs if needed
- Fix any cross-layer violations

### 4. Monitor Bundle Size

**Frequency:** Weekly or before releases

```bash
# Analyze bundle size
npm run analyze:bundle

# Or use the script directly
tsx src/migration/scripts/analyze-bundle.ts
```

**What it checks:**
- Total bundle size
- Chunk sizes
- Large dependencies
- Unused exports
- Duplicated modules

**Action items:**
- Investigate bundle size increases
- Optimize large dependencies
- Implement code splitting for large chunks
- Remove unused dependencies

---

## Monthly Maintenance Tasks

### 1. Performance Analysis

**Frequency:** Monthly or when performance issues reported

```bash
# Analyze performance
npm run analyze:performance

# Or use the script directly
tsx src/migration/scripts/analyze-performance.ts
```

**What it checks:**
- Component render performance
- Unnecessary re-renders
- Expensive computations
- Store selector optimization opportunities

**Action items:**
- Apply React optimization patterns (memo, useMemo, useCallback)
- Optimize expensive computations
- Refactor components with excessive re-renders
- Optimize Zustand store selectors

### 2. Test Coverage Review

**Frequency:** Monthly or before major releases

```bash
# Run test coverage analysis
npm run test:coverage

# Or use the script directly
tsx src/migration/scripts/run-test-coverage.ts
```

**What it checks:**
- Test coverage by layer
- Untested code paths
- Integration test coverage
- Quality gate compliance

**Action items:**
- Add tests for uncovered code paths
- Ensure critical paths have 80%+ coverage
- Update integration tests for new features
- Review and update e2e tests

### 3. Duplicate Code Analysis

**Frequency:** Monthly or when code smells detected

```bash
# Analyze duplicate code
npm run analyze:duplicates

# Or use the script directly
tsx src/migration/scripts/analyze-duplicates.ts
```

**What it checks:**
- Duplicate code blocks
- Similar code patterns
- Consolidation opportunities

**Action items:**
- Consolidate identified duplicates
- Extract common patterns to shared layer
- Update import paths after consolidation
- Verify functionality through tests

### 4. Entity Relationship Review

**Frequency:** Monthly or when adding new entities

```bash
# Analyze entity relationships
npm run analyze:entities

# Or use the script directly
tsx src/migration/scripts/analyze-entity-relationships.ts
```

**What it checks:**
- Entity relationships and dependencies
- Relationship cardinality
- Circular dependencies
- FSD layer compliance

**Action items:**
- Update entity relationship documentation
- Fix any circular dependencies
- Validate relationships through TypeScript types
- Update entity relationship diagram

---

## Quarterly Maintenance Tasks

### 1. Architecture Review

**Frequency:** Quarterly

**Activities:**
- Review FSD layer structure for any needed adjustments
- Evaluate new architectural patterns or improvements
- Assess developer feedback on FSD structure
- Review and update architectural decision records (ADRs)

**Deliverables:**
- Architecture review report
- Updated ADRs if needed
- Recommendations for improvements

### 2. Documentation Update

**Frequency:** Quarterly

**Activities:**
- Review and update entity API documentation
- Review and update widget API documentation
- Update FSD quick reference if patterns changed
- Review and update widget pattern library
- Update troubleshooting guides

**Deliverables:**
- Updated documentation in `.kiro/docs/`
- Updated code examples
- Updated best practices

### 3. Tooling and Automation Review

**Frequency:** Quarterly

**Activities:**
- Review entity/widget creation scripts
- Evaluate ESLint rules effectiveness
- Review VS Code snippets and IDE integration
- Assess validation system effectiveness
- Identify opportunities for new automation

**Deliverables:**
- Updated scripts and templates
- New or updated ESLint rules
- Enhanced IDE integration
- New automation tools if needed

### 4. Dependency Audit

**Frequency:** Quarterly

**Activities:**
- Review and update npm dependencies
- Identify and remove unused dependencies
- Evaluate alternatives for large dependencies
- Check for security vulnerabilities
- Update TypeScript and React versions

**Deliverables:**
- Updated package.json
- Dependency audit report
- Security vulnerability fixes

---

## Code Review Guidelines

### FSD Compliance Checklist for Code Reviews

When reviewing pull requests, verify:

**Layer Structure:**
- [ ] New code is in the correct FSD layer
- [ ] No upward dependencies introduced
- [ ] Public APIs used for cross-layer imports
- [ ] Layer isolation maintained

**Import Paths:**
- [ ] Absolute imports with @ alias used
- [ ] Imports through public APIs (index.ts)
- [ ] No deep imports into internal structure
- [ ] Import paths follow @/{layer}/{slice}/... pattern

**Type Safety:**
- [ ] All new code has TypeScript types
- [ ] No 'any' types without justification
- [ ] Interfaces complete for entities
- [ ] API functions have proper types

**Testing:**
- [ ] New code has unit tests
- [ ] Critical paths have integration tests
- [ ] Test coverage meets quality gates
- [ ] Tests follow testing best practices

**Documentation:**
- [ ] Public APIs documented with JSDoc comments
- [ ] Complex logic has explanatory comments
- [ ] Entity relationships documented
- [ ] Widget composition patterns documented

**Performance:**
- [ ] No obvious performance issues
- [ ] React optimization patterns used where appropriate
- [ ] Large lists use virtualization
- [ ] Images use lazy loading

---

## Troubleshooting Common Issues

### Issue: "Cannot find module '@/entities/...'"

**Cause:** TypeScript path mapping not configured or IDE not recognizing paths

**Solution:**
1. Verify `tsconfig.json` has correct path mappings
2. Restart TypeScript server in IDE
3. Run `npm run build` to verify paths work
4. Check that entity has proper `index.ts` export

### Issue: "Upward dependency detected"

**Cause:** Lower layer importing from higher layer (violates FSD rules)

**Solution:**
1. Review FSD layer hierarchy: app → pages → widgets → features → entities → shared
2. Move shared code to lower layer (shared or entities)
3. Use composition in higher layer instead of importing
4. Refactor to follow FSD dependency rules

### Issue: "Type error in entity/feature"

**Cause:** Missing or incomplete TypeScript interfaces

**Solution:**
1. Add complete TypeScript interfaces in `types.ts`
2. Export types through public API (`index.ts`)
3. Use strict TypeScript mode to catch issues early
4. Run `npm run validate:types` to verify

### Issue: "Bundle size increased significantly"

**Cause:** Large dependency added or code splitting not applied

**Solution:**
1. Run `npm run analyze:bundle` to identify large chunks
2. Implement code splitting for large features
3. Use dynamic imports for routes
4. Consider alternative smaller dependencies
5. Remove unused dependencies

### Issue: "Performance regression detected"

**Cause:** Unnecessary re-renders or expensive computations

**Solution:**
1. Run `npm run analyze:performance` to identify issues
2. Apply React.memo to components with expensive renders
3. Use useMemo for expensive computations
4. Use useCallback for callback functions
5. Optimize Zustand store selectors

---

## Training and Onboarding

### New Developer Onboarding Checklist

When onboarding new developers to the FSD architecture:

- [ ] Review FSD Quick Reference (`.kiro/docs/fsd-quick-reference.md`)
- [ ] Walk through entity API documentation
- [ ] Walk through widget API documentation
- [ ] Demonstrate entity creation script
- [ ] Demonstrate widget creation script
- [ ] Review import path guidelines
- [ ] Show VS Code snippets and IDE integration
- [ ] Explain FSD layer hierarchy and rules
- [ ] Review code review guidelines
- [ ] Practice creating a sample entity
- [ ] Practice creating a sample widget
- [ ] Review common troubleshooting issues

### Training Resources

**Documentation:**
- FSD Quick Reference: `.kiro/docs/fsd-quick-reference.md`
- Entity API Reference: `.kiro/docs/entity-api-reference.md`
- Widget API Reference: `.kiro/docs/widget-api-reference.md`
- Widget Patterns: `.kiro/docs/widget-patterns.md`

**Tools:**
- Entity creation script: `.kiro/scripts/create-entity.sh`
- Widget creation script: `.kiro/scripts/create-widget.sh`
- VS Code snippets: `.kiro/vscode/fsd-snippets.code-snippets`
- ESLint rules: `.kiro/eslint/fsd-rules.js`

**Validation Scripts:**
- FSD compliance: `npm run validate:fsd`
- Type safety: `npm run validate:types`
- Import paths: `npm run analyze:imports`
- Bundle size: `npm run analyze:bundle`

---

## Continuous Improvement

### Feedback Collection

**Collect feedback from developers on:**
- FSD architecture usability
- Tooling effectiveness
- Documentation clarity
- Pain points and friction
- Suggestions for improvements

**Feedback channels:**
- Regular team retrospectives
- Architecture review meetings
- Code review comments
- Developer surveys

### Metrics to Track

**Code Quality Metrics:**
- FSD compliance violation count (target: 0)
- Type safety error count (target: 0)
- Test coverage percentage (target: >80% for critical paths)
- Bundle size (track trends)
- Performance metrics (track trends)

**Developer Productivity Metrics:**
- Time to create new entity (should decrease with tooling)
- Time to create new widget (should decrease with tooling)
- Code review cycle time
- Onboarding time for new developers

**Architecture Health Metrics:**
- Number of upward dependencies (target: 0)
- Number of cross-feature direct imports (target: 0)
- Duplicate code percentage (track trends)
- Deprecated code remaining (target: 0)

### Improvement Process

1. **Identify Issues:** Collect feedback and review metrics
2. **Prioritize:** Rank issues by impact and effort
3. **Plan:** Create improvement plan with clear goals
4. **Implement:** Execute improvements incrementally
5. **Validate:** Measure impact of improvements
6. **Document:** Update documentation and guidelines
7. **Communicate:** Share improvements with team

---

## Emergency Procedures

### Rollback Procedure

If critical issues are discovered after migration:

```bash
# Test rollback first (dry run)
tsx src/migration/scripts/test-phase6-rollback.ts

# Perform actual rollback if needed
tsx src/migration/scripts/perform-phase6-rollback.ts --backup-id=<backup-id>
```

**Rollback checklist:**
- [ ] Identify backup to restore (check backup history)
- [ ] Test rollback in staging environment first
- [ ] Notify team of rollback operation
- [ ] Execute rollback script
- [ ] Verify application functionality
- [ ] Run tests to confirm stability
- [ ] Document rollback reason and lessons learned

### Hotfix Procedure

For urgent production fixes:

1. **Create hotfix branch** from production
2. **Apply minimal fix** following FSD rules
3. **Run validation** (`npm run validate:fsd && npm run validate:types`)
4. **Test thoroughly** in staging
5. **Deploy to production**
6. **Backport to main branch**
7. **Document hotfix** in ADR if architectural

---

## Contact and Support

### Internal Resources

- **FSD Documentation:** `.kiro/docs/`
- **Migration Scripts:** `src/migration/scripts/`
- **Validation Tools:** Run `npm run validate:*` commands
- **Creation Scripts:** `.kiro/scripts/`

### Getting Help

1. **Check documentation** in `.kiro/docs/` first
2. **Review troubleshooting guide** in this document
3. **Run validation scripts** to identify issues
4. **Consult with technical lead** for architectural questions
5. **Review code examples** in entity/widget documentation

---

## Conclusion

Maintaining FSD architectural compliance requires ongoing attention and discipline. By following these recommendations and using the provided tooling, the development team can ensure code quality, architectural consistency, and developer productivity.

**Key Takeaways:**
- Use provided scripts and tooling for creating entities and widgets
- Run validation scripts regularly (weekly/monthly)
- Follow import path guidelines strictly
- Review code for FSD compliance during code reviews
- Keep documentation updated
- Collect feedback and continuously improve
- Train new developers on FSD architecture

**Remember:** The FSD architecture is designed to scale with your application. Invest time in maintaining it, and it will pay dividends in code quality, maintainability, and developer productivity.

---

**Document Version:** 1.0  
**Last Updated:** March 20, 2026  
**Next Review:** June 20, 2026 (Quarterly)
