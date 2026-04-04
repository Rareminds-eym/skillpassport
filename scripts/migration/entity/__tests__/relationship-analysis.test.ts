/**
 * Entity Relationship Analysis Tests
 * 
 * Tests for entity relationship mapping, validation, and documentation generation.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.7, 16.8
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RelationshipAnalyzer } from '../RelationshipAnalyzer'
import type { EntityDefinition, EntityRelationship } from '@/shared/types/entity-migration'

describe('RelationshipAnalyzer', () => {
  let analyzer: RelationshipAnalyzer

  beforeEach(() => {
    analyzer = new RelationshipAnalyzer()
  })

  describe('analyzeAllEntities', () => {
    it('should analyze all entities and extract relationships', async () => {
      const entityMap = await analyzer.analyzeAllEntities()

      expect(entityMap.size).toBeGreaterThan(0)
      expect(entityMap.has('user')).toBe(true)
      expect(entityMap.has('course')).toBe(true)
      expect(entityMap.has('organization')).toBe(true)
    })

    it('should extract relationships for each entity', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const userEntity = entityMap.get('user')

      expect(userEntity).toBeDefined()
      expect(userEntity?.relationships).toBeDefined()
      expect(userEntity?.relationships.length).toBeGreaterThan(0)
    })
  })

  describe('analyzeRelationships', () => {
    it('should build relationship graph from entities', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())

      const graph = await analyzer.analyzeRelationships(entities)

      expect(graph.entities).toBeDefined()
      expect(graph.relationships).toBeDefined()
      expect(graph.clusters).toBeDefined()
      expect(graph.orphans).toBeDefined()
    })

    it('should identify entity clusters', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())

      const graph = await analyzer.analyzeRelationships(entities)

      expect(graph.clusters.length).toBeGreaterThan(0)
      expect(graph.clusters[0].entities.length).toBeGreaterThan(1)
    })

    it('should identify orphaned entities', async () => {
      const entities: EntityDefinition[] = [
        {
          name: 'orphan',
          sourceFiles: [],
          models: [],
          uiComponents: [],
          apiMethods: [],
          relationships: []
        }
      ]

      const graph = await analyzer.analyzeRelationships(entities)

      expect(graph.orphans).toContain('orphan')
    })
  })

  describe('validateRelationships', () => {
    it('should validate valid relationships', async () => {
      const relationships: EntityRelationship[] = [
        {
          type: 'one-to-many',
          target: 'course',
          foreignKey: 'user_id',
          description: 'User enrolls in courses',
          cardinality: '1:N',
          bidirectional: false
        }
      ]

      const validation = await analyzer.validateRelationships(relationships)

      expect(validation.valid).toBe(true)
      expect(validation.circularReferences).toHaveLength(0)
      expect(validation.invalidRelationships).toHaveLength(0)
    })

    it('should detect invalid cardinality', async () => {
      const relationships: EntityRelationship[] = [
        {
          type: 'one-to-one',
          target: 'course',
          foreignKey: 'user_id',
          description: 'Invalid relationship',
          cardinality: '1:N', // Wrong cardinality for one-to-one
          bidirectional: false
        }
      ]

      const validation = await analyzer.validateRelationships(relationships)

      expect(validation.valid).toBe(false)
      expect(validation.invalidRelationships.length).toBeGreaterThan(0)
    })

    it('should provide suggestions for invalid relationships', async () => {
      const relationships: EntityRelationship[] = [
        {
          type: 'one-to-many',
          target: 'course',
          foreignKey: 'user_id',
          description: 'Invalid relationship',
          cardinality: 'N:M', // Wrong cardinality
          bidirectional: false
        }
      ]

      const validation = await analyzer.validateRelationships(relationships)

      expect(validation.invalidRelationships[0]?.suggestion).toBeDefined()
    })
  })

  describe('generateRelationshipDiagram', () => {
    it('should generate Mermaid diagram', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())
      const graph = await analyzer.analyzeRelationships(entities)

      const diagram = await analyzer.generateRelationshipDiagram(graph)

      expect(diagram).toContain('```mermaid')
      expect(diagram).toContain('erDiagram')
      expect(diagram).toContain('```')
    })

    it('should include all entities in diagram', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())
      const graph = await analyzer.analyzeRelationships(entities)

      const diagram = await analyzer.generateRelationshipDiagram(graph)

      for (const entity of graph.entities) {
        expect(diagram).toContain(entity)
      }
    })

    it('should include relationship descriptions', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())
      const graph = await analyzer.analyzeRelationships(entities)

      const diagram = await analyzer.generateRelationshipDiagram(graph)

      // Check for at least one relationship description
      expect(diagram).toMatch(/: ".*"/)
    })
  })

  describe('Requirement 16.1: Analyze relationships between entities', () => {
    it('should identify all relationships between entities', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())
      const graph = await analyzer.analyzeRelationships(entities)

      // Should find relationships between User-Course, User-Organization, etc.
      expect(graph.relationships.length).toBeGreaterThan(0)
      
      // Verify specific known relationships exist
      const userCourseRel = graph.relationships.find(
        r => r.target === 'course' && r.description.includes('User')
      )
      expect(userCourseRel).toBeDefined()
    })
  })

  describe('Requirement 16.2: Generate entity relationship diagram', () => {
    it('should generate diagram showing connections', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())
      const graph = await analyzer.analyzeRelationships(entities)

      const diagram = await analyzer.generateRelationshipDiagram(graph)

      // Diagram should be in Mermaid format
      expect(diagram).toContain('erDiagram')
      
      // Should show entity connections
      expect(diagram).toMatch(/\|\|--/)
    })
  })

  describe('Requirement 16.3: Document cardinality for each relationship', () => {
    it('should document cardinality for all relationships', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())

      for (const entity of entities) {
        for (const rel of entity.relationships) {
          expect(rel.cardinality).toBeDefined()
          expect(['1:1', '1:N', 'N:1', 'N:M']).toContain(rel.cardinality)
        }
      }
    })
  })

  describe('Requirement 16.4: Identify and document entity dependencies', () => {
    it('should identify dependencies between entities', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())
      const graph = await analyzer.analyzeRelationships(entities)

      // Clusters represent dependency groups
      expect(graph.clusters.length).toBeGreaterThan(0)
      
      // Each cluster should have multiple related entities
      const mainCluster = graph.clusters[0]
      expect(mainCluster.entities.length).toBeGreaterThan(1)
    })
  })

  describe('Requirement 16.5: Verify entity relationships follow FSD layer rules', () => {
    it('should validate FSD compliance of relationships', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())

      // Entities should only reference other entities or shared types
      for (const entity of entities) {
        for (const rel of entity.relationships) {
          // Target should be another entity (lowercase name)
          expect(rel.target).toMatch(/^[a-z]+$/)
        }
      }
    })
  })

  describe('Requirement 16.7: Validate entity relationships through TypeScript types', () => {
    it('should ensure relationships are type-safe', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())

      // All relationships should have foreign keys defined
      for (const entity of entities) {
        for (const rel of entity.relationships) {
          if (rel.type !== 'many-to-many') {
            expect(rel.foreignKey).toBeDefined()
            expect(rel.foreignKey).toBeTruthy()
          }
        }
      }
    })
  })

  describe('Requirement 16.8: Generate relationship documentation in markdown format', () => {
    it('should generate markdown documentation', async () => {
      const entityMap = await analyzer.analyzeAllEntities()
      const entities = Array.from(entityMap.values())
      const graph = await analyzer.analyzeRelationships(entities)

      const diagram = await analyzer.generateRelationshipDiagram(graph)

      // Should be valid markdown with code block
      expect(diagram).toMatch(/^```mermaid\n/)
      expect(diagram).toMatch(/\n```$/)
    })
  })

  describe('Edge Cases', () => {
    it('should handle entities with no relationships', async () => {
      const entities: EntityDefinition[] = [
        {
          name: 'standalone',
          sourceFiles: [],
          models: [],
          uiComponents: [],
          apiMethods: [],
          relationships: []
        }
      ]

      const graph = await analyzer.analyzeRelationships(entities)

      expect(graph.orphans).toContain('standalone')
    })

    it('should handle self-referential relationships', async () => {
      const relationships: EntityRelationship[] = [
        {
          type: 'one-to-many',
          target: 'project',
          foreignKey: 'project_id',
          description: 'Project has proposals',
          cardinality: '1:N',
          bidirectional: false
        }
      ]

      const validation = await analyzer.validateRelationships(relationships)

      // Self-referential relationships are valid
      expect(validation.valid).toBe(true)
    })

    it('should handle bidirectional relationships', async () => {
      const relationships: EntityRelationship[] = [
        {
          type: 'many-to-many',
          target: 'course',
          foreignKey: 'enrollment_id',
          description: 'User enrolls in courses',
          cardinality: 'N:M',
          bidirectional: true
        }
      ]

      const validation = await analyzer.validateRelationships(relationships)

      expect(validation.valid).toBe(true)
    })
  })
})
