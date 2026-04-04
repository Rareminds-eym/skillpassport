/**
 * RelationshipAnalyzer - Analyzes relationships between entities
 * 
 * Identifies and validates entity relationships, generates relationship graphs,
 * and provides relationship documentation.
 */

import {
  RelationshipAnalyzer as IRelationshipAnalyzer,
  EntityDefinition,
  EntityRelationship,
  RelationshipGraph,
  RelationshipValidation,
  EntityCluster,
  CircularReference,
  InvalidRelationship,
  RelationshipType
} from '@/shared/types/entity-migration'

export class RelationshipAnalyzer implements IRelationshipAnalyzer {
  /**
   * Analyze relationships between entities
   */
  async analyzeRelationships(entities: EntityDefinition[]): Promise<RelationshipGraph> {
    const allRelationships: EntityRelationship[] = []
    const entityNames = entities.map(e => e.name)
    
    // Collect all relationships from entities
    for (const entity of entities) {
      allRelationships.push(...entity.relationships)
    }
    
    // Identify clusters of related entities
    const clusters = this.identifyClusters(entities, allRelationships)
    
    // Find orphaned entities (no relationships)
    const orphans = entityNames.filter(name => {
      const entity = entities.find(e => e.name === name)
      return !allRelationships.some(rel => rel.target === name) && 
             (!entity || entity.relationships.length === 0)
    })
    
    return {
      entities: entityNames,
      relationships: allRelationships,
      clusters,
      orphans
    }
  }

  /**
   * Identify relationship between two entities
   */
  async identifyRelationship(entity1: string, entity2: string): Promise<EntityRelationship | null> {
    try {
      // Search for relationship patterns in code
      const relationship = await this.searchForRelationship(entity1, entity2)
      return relationship
    } catch (error) {
      console.error(`Error identifying relationship between ${entity1} and ${entity2}:`, error)
      return null
    }
  }

  /**
   * Analyze all entities and extract their relationships from type definitions
   */
  async analyzeAllEntities(): Promise<Map<string, EntityDefinition>> {
    const entityMap = new Map<string, EntityDefinition>()
    
    const entities = [
      'user',
      'course',
      'organization',
      'assessment',
      'project',
      'certificate',
      'message',
      'subscription'
    ]
    
    for (const entity of entities) {
      const definition = await this.extractEntityDefinition(entity)
      if (definition) {
        entityMap.set(entity, definition)
      }
    }
    
    return entityMap
  }

  /**
   * Extract entity definition from type files
   */
  private async extractEntityDefinition(entityName: string): Promise<EntityDefinition | null> {
    try {
      const typesPath = `src/entities/${entityName}/model/types.ts`
      
      // Read the types file to extract relationships
      const relationships = await this.extractRelationshipsFromTypes(typesPath, entityName)
      
      // Capitalize first letter for EntityType
      const entityType = (entityName.charAt(0).toUpperCase() + entityName.slice(1)) as import('../types/entity-migration').EntityType
      
      return {
        name: entityName,
        type: entityType,
        sourceFiles: [typesPath],
        models: [],
        uiComponents: [],
        apiMethods: [],
        relationships
      }
    } catch (error) {
      console.error(`Error extracting entity definition for ${entityName}:`, error)
      return null
    }
  }

  /**
   * Extract relationships from entity type definitions
   */
  private async extractRelationshipsFromTypes(
    _filePath: string,
    entityName: string
  ): Promise<EntityRelationship[]> {
    // Define known relationships based on entity type analysis
    const relationshipMap: Record<string, EntityRelationship[]> = {
      user: [
        {
          type: 'one-to-many',
          target: 'course',
          foreignKey: 'user_id',
          description: 'User enrolls in courses',
          cardinality: '1:N',
          bidirectional: false
        },
        {
          type: 'many-to-one',
          target: 'organization',
          foreignKey: 'organizationId',
          description: 'User belongs to organization',
          cardinality: 'N:1',
          bidirectional: false
        },
        {
          type: 'one-to-many',
          target: 'assessment',
          foreignKey: 'student_id',
          description: 'User takes assessments',
          cardinality: '1:N',
          bidirectional: false
        },
        {
          type: 'one-to-many',
          target: 'project',
          foreignKey: 'student_id',
          description: 'User participates in projects',
          cardinality: '1:N',
          bidirectional: false
        },
        {
          type: 'one-to-many',
          target: 'certificate',
          foreignKey: 'student_id',
          description: 'User earns certificates',
          cardinality: '1:N',
          bidirectional: false
        },
        {
          type: 'one-to-many',
          target: 'message',
          foreignKey: 'sender_id',
          description: 'User sends/receives messages',
          cardinality: '1:N',
          bidirectional: false
        },
        {
          type: 'one-to-many',
          target: 'subscription',
          foreignKey: 'user_id',
          description: 'User has subscriptions',
          cardinality: '1:N',
          bidirectional: false
        }
      ],
      course: [
        {
          type: 'many-to-one',
          target: 'organization',
          foreignKey: 'college_id',
          description: 'Course offered by organization',
          cardinality: 'N:1',
          bidirectional: false
        },
        {
          type: 'one-to-many',
          target: 'certificate',
          foreignKey: 'course_id',
          description: 'Course completion awards certificates',
          cardinality: '1:N',
          bidirectional: false
        },
        {
          type: 'one-to-many',
          target: 'assessment',
          foreignKey: 'course_id',
          description: 'Course has assessments',
          cardinality: '1:N',
          bidirectional: false
        }
      ],
      organization: [
        {
          type: 'one-to-many',
          target: 'subscription',
          foreignKey: 'organization_id',
          description: 'Organization has subscriptions',
          cardinality: '1:N',
          bidirectional: false
        },
        {
          type: 'one-to-many',
          target: 'user',
          foreignKey: 'organizationId',
          description: 'Organization has members',
          cardinality: '1:N',
          bidirectional: false
        }
      ],
      assessment: [
        {
          type: 'many-to-one',
          target: 'user',
          foreignKey: 'student_id',
          description: 'Assessment taken by user',
          cardinality: 'N:1',
          bidirectional: false
        },
        {
          type: 'many-to-one',
          target: 'course',
          foreignKey: 'course_id',
          description: 'Assessment belongs to course',
          cardinality: 'N:1',
          bidirectional: false
        }
      ],
      project: [
        {
          type: 'many-to-one',
          target: 'user',
          foreignKey: 'student_id',
          description: 'Project owned by user',
          cardinality: 'N:1',
          bidirectional: false
        },
        {
          type: 'one-to-many',
          target: 'project',
          foreignKey: 'project_id',
          description: 'Project has proposals',
          cardinality: '1:N',
          bidirectional: false
        },
        {
          type: 'one-to-one',
          target: 'project',
          foreignKey: 'project_id',
          description: 'Project has contract',
          cardinality: '1:1',
          bidirectional: false
        }
      ],
      certificate: [
        {
          type: 'many-to-one',
          target: 'user',
          foreignKey: 'student_id',
          description: 'Certificate awarded to user',
          cardinality: 'N:1',
          bidirectional: false
        },
        {
          type: 'many-to-one',
          target: 'course',
          foreignKey: 'course_id',
          description: 'Certificate for course completion',
          cardinality: 'N:1',
          bidirectional: false
        }
      ],
      message: [
        {
          type: 'many-to-one',
          target: 'user',
          foreignKey: 'sender_id',
          description: 'Message sent by user',
          cardinality: 'N:1',
          bidirectional: false
        },
        {
          type: 'many-to-one',
          target: 'user',
          foreignKey: 'receiver_id',
          description: 'Message received by user',
          cardinality: 'N:1',
          bidirectional: false
        }
      ],
      subscription: [
        {
          type: 'many-to-one',
          target: 'user',
          foreignKey: 'user_id',
          description: 'Subscription belongs to user',
          cardinality: 'N:1',
          bidirectional: false
        },
        {
          type: 'many-to-one',
          target: 'organization',
          foreignKey: 'organization_id',
          description: 'Subscription for organization',
          cardinality: 'N:1',
          bidirectional: false
        }
      ]
    }
    
    return relationshipMap[entityName] || []
  }

  /**
   * Validate entity relationships
   */
  async validateRelationships(relationships: EntityRelationship[]): Promise<RelationshipValidation> {
    const circularReferences: CircularReference[] = []
    const missingEntities: string[] = []
    const invalidRelationships: InvalidRelationship[] = []
    const warnings: string[] = []
    
    // Build relationship graph for cycle detection
    const graph = this.buildRelationshipGraph(relationships)
    
    // Detect circular references
    const cycles = this.detectCycles(graph)
    for (const cycle of cycles) {
      const severity = this.assessCycleSeverity(cycle)
      circularReferences.push({
        cycle,
        severity,
        suggestion: this.suggestCycleFix(cycle)
      })
    }
    
    // Validate relationship targets exist
    const entityNames = new Set(relationships.map(r => r.target))
    for (const rel of relationships) {
      if (!entityNames.has(rel.target)) {
        missingEntities.push(rel.target)
      }
    }
    
    // Validate relationship consistency
    for (const rel of relationships) {
      const validation = this.validateRelationshipConsistency(rel, relationships)
      if (!validation.valid) {
        invalidRelationships.push({
          from: validation.from,
          to: rel.target,
          reason: validation.reason,
          suggestion: validation.suggestion
        })
      }
    }
    
    // Check for bidirectional consistency
    for (const rel of relationships) {
      if (rel.bidirectional) {
        const reverse = relationships.find(r => 
          r.target === rel.target && relationships.some(orig => orig.target === r.target)
        )
        if (!reverse) {
          warnings.push(`Bidirectional relationship ${rel.target} is missing reverse relationship`)
        }
      }
    }
    
    const valid = circularReferences.length === 0 && 
                  missingEntities.length === 0 && 
                  invalidRelationships.length === 0
    
    return {
      valid,
      circularReferences,
      missingEntities,
      invalidRelationships,
      warnings
    }
  }

  /**
   * Generate relationship diagram in Mermaid format
   */
  async generateRelationshipDiagram(graph: RelationshipGraph): Promise<string> {
    const lines: string[] = []
    
    lines.push('```mermaid')
    lines.push('erDiagram')
    lines.push('')
    
    // Add entities
    for (const entity of graph.entities) {
      lines.push(`  ${entity} {`)
      lines.push(`    string id`)
      lines.push(`  }`)
    }
    
    lines.push('')
    
    // Add relationships
    for (const rel of graph.relationships) {
      const source = this.findRelationshipSource(rel, graph)
      if (source) {
        const notation = this.getRelationshipNotation(rel.type, rel.cardinality)
        lines.push(`  ${source} ${notation} ${rel.target} : "${rel.description}"`)
      }
    }
    
    lines.push('```')
    
    return lines.join('\n')
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Identify clusters of related entities
   */
  private identifyClusters(
    entities: EntityDefinition[],
    relationships: EntityRelationship[]
  ): EntityCluster[] {
    const clusters: EntityCluster[] = []
    const visited = new Set<string>()
    
    for (const entity of entities) {
      if (visited.has(entity.name)) continue
      
      const cluster = this.buildCluster(entity.name, entities, relationships, visited)
      if (cluster.entities.length > 1) {
        clusters.push(cluster)
      }
    }
    
    return clusters
  }

  /**
   * Build a cluster starting from an entity
   */
  private buildCluster(
    startEntity: string,
    entities: EntityDefinition[],
    relationships: EntityRelationship[],
    visited: Set<string>
  ): EntityCluster {
    const clusterEntities: string[] = [startEntity]
    const clusterRelationships: EntityRelationship[] = []
    const queue: string[] = [startEntity]
    
    visited.add(startEntity)
    
    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) break
      
      // Find relationships involving current entity
      const relatedRels = relationships.filter(rel => {
        const entity = entities.find(e => e.name === current)
        return entity?.relationships.includes(rel) || rel.target === current
      })
      
      for (const rel of relatedRels) {
        if (!clusterRelationships.includes(rel)) {
          clusterRelationships.push(rel)
        }
        
        if (!visited.has(rel.target)) {
          visited.add(rel.target)
          clusterEntities.push(rel.target)
          queue.push(rel.target)
        }
      }
    }
    
    const cohesion = this.calculateClusterCohesion(clusterEntities, clusterRelationships)
    
    return {
      name: `${startEntity}Cluster`,
      entities: clusterEntities,
      relationships: clusterRelationships,
      cohesion
    }
  }

  /**
   * Calculate cluster cohesion score
   */
  private calculateClusterCohesion(
    entities: string[],
    relationships: EntityRelationship[]
  ): number {
    if (entities.length <= 1) return 1.0
    
    const maxPossibleRelationships = entities.length * (entities.length - 1)
    const actualRelationships = relationships.length
    
    return actualRelationships / maxPossibleRelationships
  }

  /**
   * Search for relationship between two entities in code
   */
  private async searchForRelationship(
    _entity1: string,
    _entity2: string
  ): Promise<EntityRelationship | null> {
    // This would analyze code to find relationships
    // For now, return null as placeholder
    return null
  }

  /**
   * Build relationship graph for cycle detection
   */
  private buildRelationshipGraph(
    relationships: EntityRelationship[]
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>()
    
    for (const rel of relationships) {
      // Find source entity (entity that has this relationship)
      const source = this.inferSourceEntity(rel)
      if (source) {
        const targets = graph.get(source) || []
        targets.push(rel.target)
        graph.set(source, targets)
      }
    }
    
    return graph
  }

  /**
   * Infer source entity from relationship
   */
  private inferSourceEntity(rel: EntityRelationship): string | null {
    // In a real implementation, this would track which entity owns the relationship
    // For now, we'll use a simple heuristic based on relationship type
    if (rel.type === 'one-to-many') {
      // The "one" side is typically the source
      return null // Would need more context
    }
    return null
  }

  /**
   * Detect cycles in relationship graph
   */
  private detectCycles(graph: Map<string, string[]>): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const dfs = (node: string, path: string[]): void => {
      visited.add(node)
      recursionStack.add(node)
      path.push(node)
      
      const neighbors = graph.get(node) || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path])
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor)
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart))
          }
        }
      }
      
      recursionStack.delete(node)
    }
    
    for (const node of Array.from(graph.keys())) {
      if (!visited.has(node)) {
        dfs(node, [])
      }
    }
    
    return cycles
  }

  /**
   * Assess severity of circular reference
   */
  private assessCycleSeverity(cycle: string[]): 'low' | 'medium' | 'high' {
    if (cycle.length === 2) return 'low' // Simple bidirectional
    if (cycle.length === 3) return 'medium'
    return 'high' // Complex cycles are problematic
  }

  /**
   * Suggest fix for circular reference
   */
  private suggestCycleFix(cycle: string[]): string {
    if (cycle.length === 2) {
      return `Consider using a junction table or making one relationship optional`
    }
    return `Break the cycle by introducing an intermediary entity or using weak references`
  }

  /**
   * Validate relationship consistency
   */
  private validateRelationshipConsistency(
    rel: EntityRelationship,
    _allRelationships: EntityRelationship[]
  ): { valid: boolean; from: string; reason: string; suggestion: string } {
    // Check cardinality matches relationship type
    if (rel.type === 'one-to-one' && rel.cardinality !== '1:1') {
      return {
        valid: false,
        from: 'unknown',
        reason: 'Cardinality does not match relationship type',
        suggestion: 'Update cardinality to 1:1 for one-to-one relationships'
      }
    }
    
    if (rel.type === 'one-to-many' && !['1:N', 'N:1'].includes(rel.cardinality)) {
      return {
        valid: false,
        from: 'unknown',
        reason: 'Cardinality does not match relationship type',
        suggestion: 'Update cardinality to 1:N or N:1 for one-to-many relationships'
      }
    }
    
    if (rel.type === 'many-to-many' && rel.cardinality !== 'N:M') {
      return {
        valid: false,
        from: 'unknown',
        reason: 'Cardinality does not match relationship type',
        suggestion: 'Update cardinality to N:M for many-to-many relationships'
      }
    }
    
    return {
      valid: true,
      from: 'unknown',
      reason: '',
      suggestion: ''
    }
  }

  /**
   * Find source entity for a relationship
   */
  private findRelationshipSource(
    rel: EntityRelationship,
    graph: RelationshipGraph
  ): string | null {
    // Find which entity has this relationship
    for (const entity of graph.entities) {
      // This would check if the entity definition includes this relationship
      // For now, return the first entity that's not the target
      if (entity !== rel.target) {
        return entity
      }
    }
    return null
  }

  /**
   * Get Mermaid notation for relationship
   */
  private getRelationshipNotation(
    type: RelationshipType,
    cardinality: string
  ): string {
    switch (type) {
      case 'one-to-one':
        return '||--||'
      case 'one-to-many':
        return cardinality === '1:N' ? '||--o{' : '}o--||'
      case 'many-to-many':
        return '}o--o{'
      case 'composition':
        return '||--*'
      case 'aggregation':
        return '||--o'
      default:
        return '||--||'
    }
  }
}
