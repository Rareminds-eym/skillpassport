# RBAC & Role Management Architecture

**Date**: 2026-06-06
**Scope**: SkillPassport codebase (`src/`, `functions/`, `supabase/`) + SSO auth architecture
**Authoritative Sources**: [OWASP Access Control](https://owasp.org/www-community/Access_Control), [OWASP RBAC Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html), [IBM RBAC Implementation Guide 2026](https://www.ibm.com/think/topics/role-based-access-control-implementation), [Microsoft Azure RBAC Best Practices](https://learn.microsoft.com/en-us/azure/role-based-access-control/best-practices), [Beyond Hardcoded Rules: OPA (2026)](https://www.vroble.com/2026/01/beyond-hardcoded-rules-architecting.html), [LoginRadius RBAC Best Practices 2026](https://www.loginradius.com/blog/engineering/rbac-enterprise-sso-federation)

---

## 1. What Industrial-Grade & World-Class RBAC Looks Like (2026 Standards)

### 1.1 Core Principles from OWASP / NIST / ISO

| Principle | Description |
|-----------|-------------|
| **Single Source of Truth** | Roles defined in ONE canonical location (database) |
| **Dynamic Role Resolution** | Roles resolved at runtime from the SSO database |
| **Centralized Policy Engine** | Auth decisions made by a central policy layer (OPA, custom middleware) |
| **Deny by Default** | Access denied unless explicitly granted |
| **Least Privilege** | Users get minimum permissions needed |
| **Validate Every Request** | Permission check on every API call |
| **Auditability** | Who can do what is queryable without reading code |
| **Zero-Downtime Role Changes** | Add/remove roles without deploying code |

### 1.2 Database-Driven RBAC (The World-Class Pattern)

The system is designed around a canonical `roles` table in the sso-auth database (already exists), with a `role_categories` table (proposed) that classifies roles into groups with priority ordering. A `school_role_permissions` table (proposed) handles school-internal feature-level permissions.

**Benefits over hardcoded arrays:**
- Adding a role to a category is a DB insert — **zero code changes**
- Removing a role from a category is a DB delete — **zero code changes**
- TypeScript types can be auto-generated from the DB

### 1.3 Code Should Consume, Not Define

Roles should be consumed from the database at runtime, not defined as array literals in source code. TypeScript types should be auto-generated from the database for compile-time safety via a type generation script.

### 1.4 Policy-as-Code (Cutting-Edge 2026 Pattern)

For very complex auth requirements, externalize to a policy engine like [Open Policy Agent (OPA)](https://www.openpolicyagent.org/). This decouples policy decisions from application code entirely, achieving:
- **40% reduction in authorization bugs** (per OPA case studies)
- **30% faster feature delivery** (developers stop writing auth logic)
- **Unified enforcement** across APIs, infrastructure, and CI/CD

Auth policies are expressed declaratively — the user's roles are evaluated against resource-level rules without hardcoding role-to-permission mappings in application code.

---

## 2. The Canonical Source of Truth

The **sso-auth `roles` table** is the single canonical source for all authentication-level roles. The skillpassport application database has a **shadow `roles` table** (columns: `name`, `description`, `created_at`, `updated_at`) that should be kept in sync via trigger or scheduled job. This avoids crossing the database boundary for local queries, type generation, and permission lookups. The sso-auth DB owns the truth; the shadow copy is read-only for reference only.

### 2.1 Separate Concern: School-Internal Roles

School-internal roles control feature-level permissions within a school, not authentication identity. These should live in separate DB tables independent of the SSO roles table, with their permission matrix consumed from the database rather than hardcoded in source code.

### 2.2 Separate Concern: Recruitment Roles

Organization-level recruitment roles are membership roles within an organization, not user-level auth roles. They should use a separate DB table independent of the SSO roles system.

## 3. Related Documents

- `.kiro/verifications/2026-06-06_comprehensive-role-audit_report.md` — Full role audit with status tracking
- `.kiro/plans/2026-06-06_rbac-role-migration_plan.md` — Phased migration plan (4 phases: bugs → single source → DB-driven → policy-as-code)
- `.kiro/steering/00-core-standards.md` — Core engineering standards (section 8: Frontend-Backend Separation)
- `.kiro/steering/01-security-compliance.md` — Authentication architecture requirements
- `.kiro/steering/04-database-api-standards.md` — Database migration patterns
