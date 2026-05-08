// Common types shared across the application
// Most type migrations will be deferred to feature-specific phases

/**
 * Base entity types shared across all entities
 * Requirements: 16.6 - Document shared entity types in shared layer
 */

// Primary identifier type
export type ID = string

// Timestamp type for created_at, updated_at fields
export type Timestamp = string

// Common status values across entities
export type Status = 'active' | 'inactive' | 'pending' | 'archived'

// User role types
export type Role = 'learner' | 'educator' | 'recruiter' | 'admin'

/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
  id: ID
  created_at: Timestamp
  updated_at: Timestamp
}

/**
 * Auditable entity with tracking fields
 */
export interface Auditable extends BaseEntity {
  created_by?: ID
  updated_by?: ID
}

/**
 * Foreign key types for entity relationships
 * Requirements: 16.7 - Validate relationships through TypeScript types
 */
export type UserID = ID
export type CourseID = ID
export type OrganizationID = ID
export type AssessmentID = ID
export type ProjectID = ID
export type CertificateID = ID
export type MessageID = ID
export type SubscriptionID = ID
