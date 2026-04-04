/**
 * RelationshipAnalyzer Tests
 * 
 * Tests for entity relationship analysis, validation, and diagram generation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RelationshipAnalyzer } from '../RelationshipAnalyzer'
import { EntityDefinition, EntityRelationship, EntityType } from '@/shared/types/entity-migration'

describe('RelationshipAnalyzer', () => {
  let analyzer: RelationshipAnalyzer

  beforeEach(() => {
    analyzer = new RelationshipAnalyzer()
  })

  describe('analyzeRelationships', () => {
    it('should analyze relationships between entities', async () => {
      const entities: EntityDefinition[] = [
        createEntityDefinition('user', 'User', [
          createRelationship('one-to-many', 'course', '1:N', 'User enrolls in courses')
        ]),
        createEntityDefinition('course', 'Course', [
          createRelationship('many-to-one', 'organization', 'N:1', 'Course offered by organization')
        ])
      ]

      const graph = await analyzer.analyzeRelationships(entities)

      expect(graph.entities).toHaveLength(2)
      expect(graph.entities).toContain('user')
      expect(graph.entities).toContain('course')
      expect(graph.relationships).toHaveLength(2)
    })

    it('should identify entity clusters', async () => {
      const entities: EntityDefinition[] = [
        createEntityDefinition('user', 'User', [
          createRelationship('one-to-many', 'course', '1:N', 'User enrolls in courses')
        ]),
        createEntityDefinition('course', 'Course', [
          createRelationship('one-to-many', 'assessment', '1:N', 'Course has assessments')
        ]),
        createEntityDefinition('assessment', 'Assessment', [])
      ]

      const graph = await analyzer.analyzeRelationships(entities)

      expect(graph.clusters.length).toBeGreaterThan(0)
    })

    it('should identify orphaned entities', async () => {
      const entities: EntityDefinition[] = [
        createEntityDefinition('user', 'User', []),
        createEntityDefinition('course', 'Course', [])
      ]

      const graph = await analyzer.analyzeRelationships(entities)

      expect(graph.orphans.length).toBeGreaterThan(0)
    })
  })

  describe('validateRelationships', () => {
    it('should validate correct relationships', async () => {
      const relationships: EntityRelationship[] = [
        createRelationship('one-to-many', 'course', '1:N', 'User enrolls in courses'),
        createRelationship('many-to-one', 'organization', 'N:1', 'User belongs to organization')
      ]

      const validation = await analyzer.validateRelationships(relationships)

      expect(validation.valid).toBe(true)
      expect(validation.circularReferences).toHaveLength(0)
      expect(validation.invalidRelationships).toHaveLength(0)
    })

    it('should detect invalid cardinality for one-to-one relationships', async () => {
      const relationships: EntityRelationship[] = [
        {
          type: 'one-to-one',
          target: 'profile',
          description: 'User has profile',
          cardinality: '1:N', // Invalid for one-to-one
          bidirectional: false
        }
      ]

      const validation = await analyzer.validateRelationships(relationships)

      expect(validation.valid).toBe(false)
      expect(validation.invalidRelationships.length).toBeGreaterThan(0)
    })

    it('should detect invalid cardinality for one-to-many relationships', async () => {
      const relationships: EntityRelationship[] = [
        {
          type: 'one-to-many',
          target: 'course',
          description: 'User enrolls in courses',
          cardinality: '1:1', // Invalid for one-to-many
          bidirectional: false
        }
      ]

      const validation = await analyzer.validateRelationships(relationships)

      expect(validation.valid).toBe(false)
      expect(validation.invalidRelationships.length).toBeGreaterThan(0)
    })

    it('should detect invalid cardinality for many-to-many relationships', async () => {
      const relationships: EntityRelationship[] = [
        {
          type: 'many-to-many',
          target: 'tag',
          description: 'Course has tags',
          cardinality: '1:N', // Invalid for many-to-many
          bidirectional: false
        }
      ]

      const validation = await analyzer.validateRelationships(relationships)

      expect(validation.valid).toBe(false)
      expect(validation.invalidRelationships.length).toBeGreaterThan(0)
    })
  })

  describe('generateRelationshipDiagram', () => {
    it('should generate Mermaid diagram for entity relationships', async () => {
      const entities: EntityDefinition[] = [
        createEntityDefinition('user', 'User', [
          createRelationship('one-to-many', 'course', '1:N', 'User enrolls in courses')
        ]),
        createEntityDefinition('course', 'Course', [])
      ]

      const graph = await analyzer.analyzeRelationships(entities)
      const diagram = await analyzer.generateRelationshipDiagram(graph)

      expect(diagram).toContain('```mermaid')
      expect(diagram).toContain('erDiagram')
      expect(diagram).toContain('user')
      expect(diagram).toContain('course')
      expect(diagram).toContain('```')
    })

    it('should include relationship descriptions in diagram', async () => {
      const entities: EntityDefinition[] = [
        createEntityDefinition('user', 'User', [
          createRelationship('one-to-many', 'course', '1:N', 'User enrolls in courses')
        ]),
        createEntityDefinition('course', 'Course', [])
      ]

      const graph = await analyzer.analyzeRelationships(entities)
      const diagram = await analyzer.generateRelationshipDiagram(graph)

      expect(diagram).toContain('User enrolls in courses')
    })
  })

  describe('analyzeAllEntities', () => {
    it('should extract all entity definitions', async () => {
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
})

// Helper functions
function createEntityDefinition(
  name: string,
  type: EntityType,
  relationships: EntityRelationship[]
): EntityDefinition {
  return {
    name,
    type,
    sourceFiles: [`src/entities/${name}/model/types.ts`],
    models: [],
    uiComponents: [],
    apiMethods: [],
    relationships
  }
}

function createRelationship(
  type: 'one-to-one' | 'one-to-many' | 'many-to-many',
  target: string,
  cardinality: '1:1' | '1:N' | 'N:1' | 'N:M',
  description: string
): EntityRelationship {
  return {
    type,
    target,
    description,
    cardinality,
    bidirectional: false
  }
}
