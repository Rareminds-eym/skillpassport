/**
 * Entity Relationship Analysis Entry Point
 * 
 * Provides functions to analyze entity relationships, generate diagrams,
 * and validate TypeScript types.
 * 
 * Requirements: 16.2, 16.6, 16.7, 16.8
 */

import { RelationshipAnalyzer } from './RelationshipAnalyzer'
import type { RelationshipGraph } from '@/shared/types/entity-migration'

/**
 * Analyze all entity relationships and generate diagram
 * Requirement 16.2: Generate entity relationship diagram
 */
export async function analyzeEntityRelationships(): Promise<{
  graph: RelationshipGraph
  diagram: string
}> {
  const analyzer = new RelationshipAnalyzer()
  
  // Analyze all entities
  const entityMap = await analyzer.analyzeAllEntities()
  const entities = Array.from(entityMap.values())
  
  // Build relationship graph
  const graph = await analyzer.analyzeRelationships(entities)
  
  // Generate Mermaid diagram
  const diagram = await analyzer.generateRelationshipDiagram(graph)
  
  return { graph, diagram }
}

/**
 * Validate entity relationships through TypeScript types
 * Requirement 16.7: Validate relationships through TypeScript types
 */
export async function validateEntityRelationships(): Promise<{
  valid: boolean
  errors: string[]
}> {
  const analyzer = new RelationshipAnalyzer()
  
  // Analyze all entities
  const entityMap = await analyzer.analyzeAllEntities()
  const entities = Array.from(entityMap.values())
  
  // Build relationship graph
  const graph = await analyzer.analyzeRelationships(entities)
  
  // Validate relationships
  const validation = await analyzer.validateRelationships(graph.relationships)
  
  const errors: string[] = []
  
  if (!validation.valid) {
    validation.circularReferences.forEach(ref => {
      errors.push(`Circular reference: ${ref.cycle.join(' -> ')}`)
    })
    
    validation.missingEntities.forEach(entity => {
      errors.push(`Missing entity: ${entity}`)
    })
    
    validation.invalidRelationships.forEach(rel => {
      errors.push(`Invalid relationship from ${rel.from} to ${rel.to}: ${rel.reason}`)
    })
  }
  
  return {
    valid: validation.valid,
    errors
  }
}

/**
 * Get shared entity types documentation
 * Requirement 16.6: Document shared entity types in shared layer
 */
export function getSharedEntityTypes(): string[] {
  return [
    'ID - Primary identifier type',
    'Timestamp - Timestamp for created_at, updated_at fields',
    'Status - Common status values (active, inactive, pending, archived)',
    'Role - User role types',
    'BaseEntity - Base interface with id, created_at, updated_at',
    'Auditable - Entity with created_by, updated_by tracking',
    'UserID, CourseID, OrganizationID, etc. - Foreign key types'
  ]
}
