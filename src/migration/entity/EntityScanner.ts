/**
 * EntityScanner - Scans codebase for entity-related code
 * 
 * Identifies business entities in the codebase by analyzing interfaces,
 * types, components, and API functions.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import {
  EntityScanner as IEntityScanner,
  EntityCandidate,
  UsageAnalysis,
  SourceLocation,
  TypeInterface,
  EntityIndicator,
  EntityType
} from '../types/entity-migration'

export class EntityScanner implements IEntityScanner {
  private srcPath: string

  constructor(projectRoot: string = process.cwd()) {
    this.srcPath = path.join(projectRoot, 'src')
  }

  /**
   * Scan codebase for potential entities
   */
  async scanForEntities(): Promise<EntityCandidate[]> {
    const candidates: EntityCandidate[] = []
    
    const entityTypes: EntityType[] = [
      'User', 'Student', 'Educator', 'Recruiter', 'Admin',
      'Course', 'Organization', 'Subscription', 'Message',
      'Assessment', 'Project', 'Certificate'
    ]

    for (const entityType of entityTypes) {
      const indicators = await this.findEntityIndicators(entityType)
      
      if (indicators.length > 0) {
        candidates.push({
          name: entityType,
          confidence: this.calculateConfidence(indicators),
          sourceFiles: [...new Set(indicators.map(i => i.filePath))],
          indicators,
          suggestedType: entityType
        })
      }
    }

    return candidates
  }

  async analyzeEntityUsage(entity: string): Promise<UsageAnalysis> {
    const referencesByFile = new Map<string, number>()
    const referencesByFeature = new Map<string, number>()
    const criticalPaths: string[] = []

    try {
      const files = await this.getAllSourceFiles()
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const references = this.countEntityReferences(content, entity)
        
        if (references > 0) {
          referencesByFile.set(file, references)
          
          const feature = this.extractFeatureFromPath(file)
          if (feature) {
            const currentCount = referencesByFeature.get(feature) || 0
            referencesByFeature.set(feature, currentCount + references)
          }
          
          if (this.isCriticalPath(file)) {
            criticalPaths.push(file)
          }
        }
      }
    } catch (error) {
      console.error(`Error analyzing entity usage for ${entity}:`, error)
    }

    const totalReferences = Array.from(referencesByFile.values()).reduce((sum, count) => sum + count, 0)
    const migrationImpact = this.calculateMigrationImpact(totalReferences, criticalPaths.length)

    return {
      entity,
      totalReferences,
      referencesByFile,
      referencesByFeature,
      criticalPaths,
      migrationImpact
    }
  }

  async identifyEntityFiles(entity: string): Promise<SourceLocation[]> {
    const locations: SourceLocation[] = []

    try {
      const files = await this.getAllSourceFiles()
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        
        if (this.containsEntityCode(content, entity)) {
          const category = this.categorizeFile(file, content)
          const lineCount = content.split('\n').length
          const complexity = this.calculateFileComplexity(content)
          
          locations.push({
            filePath: file,
            category,
            lineCount,
            complexity
          })
        }
      }
    } catch (error) {
      console.error(`Error identifying entity files for ${entity}:`, error)
    }

    return locations
  }

  async extractEntityInterfaces(files: string[]): Promise<TypeInterface[]> {
    const interfaces: TypeInterface[] = []

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8')
        const fileInterfaces = this.parseInterfaces(content)
        interfaces.push(...fileInterfaces)
      } catch (error) {
        console.error(`Error extracting interfaces from ${file}:`, error)
      }
    }

    return interfaces
  }

  private async findEntityIndicators(entity: string): Promise<EntityIndicator[]> {
    const indicators: EntityIndicator[] = []

    try {
      const files = await this.getAllSourceFiles()
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        
        if (this.hasEntityInterface(content, entity)) {
          indicators.push({
            type: 'interface',
            name: `${entity}Interface`,
            filePath: file,
            confidence: 0.9
          })
        }
        
        if (this.hasEntityType(content, entity)) {
          indicators.push({
            type: 'type',
            name: `${entity}Type`,
            filePath: file,
            confidence: 0.85
          })
        }
        
        if (this.hasEntityComponent(content, entity)) {
          indicators.push({
            type: 'component',
            name: `${entity}Component`,
            filePath: file,
            confidence: 0.8
          })
        }
        
        if (this.hasEntityAPI(content, entity)) {
          indicators.push({
            type: 'api',
            name: `${entity}API`,
            filePath: file,
            confidence: 0.85
          })
        }
        
        if (this.hasEntityStore(content, entity)) {
          indicators.push({
            type: 'store',
            name: `${entity}Store`,
            filePath: file,
            confidence: 0.9
          })
        }
      }
    } catch (error) {
      console.error(`Error finding entity indicators for ${entity}:`, error)
    }

    return indicators
  }

  private calculateConfidence(indicators: EntityIndicator[]): number {
    if (indicators.length === 0) return 0
    
    const totalConfidence = indicators.reduce((sum, indicator) => sum + indicator.confidence, 0)
    return Math.min(totalConfidence / indicators.length, 1.0)
  }

  private async getAllSourceFiles(): Promise<string[]> {
    const files: string[] = []
    
    const extensions = ['.ts', '.tsx', '.js', '.jsx']
    const excludeDirs = ['node_modules', 'dist', 'build', '.git', '.wrangler']
    
    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) {
              await scanDirectory(fullPath)
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name)
            if (extensions.includes(ext)) {
              files.push(fullPath)
            }
          }
        }
      } catch (error) {
        // Silently skip directories we can't read
      }
    }
    
    await scanDirectory(this.srcPath)
    return files
  }

  private countEntityReferences(content: string, entity: string): number {
    const patterns = [
      new RegExp(`\\b${entity}\\b`, 'g'),
      new RegExp(`\\b${entity.toLowerCase()}\\b`, 'g'),
      new RegExp(`I${entity}`, 'g'),
      new RegExp(`${entity}Type`, 'g'),
      new RegExp(`${entity}Props`, 'g')
    ]
    
    let count = 0
    for (const pattern of patterns) {
      const matches = content.match(pattern)
      if (matches) {
        count += matches.length
      }
    }
    
    return count
  }

  private extractFeatureFromPath(filePath: string): string | null {
    const featureMatch = filePath.match(/\/features\/([^\/]+)/)
    if (featureMatch) return featureMatch[1]
    
    const componentMatch = filePath.match(/\/components\/([^\/]+)/)
    if (componentMatch) return componentMatch[1]
    
    return null
  }

  private isCriticalPath(filePath: string): boolean {
    const criticalPatterns = [
      '/stores/',
      '/services/',
      '/lib/',
      '/shared/',
      'authStore',
      'authService'
    ]
    
    return criticalPatterns.some(pattern => filePath.includes(pattern))
  }

  private calculateMigrationImpact(
    totalReferences: number,
    criticalPathCount: number
  ): 'low' | 'medium' | 'high' {
    let impactScore = 0
    
    if (totalReferences > 100) impactScore += 3
    else if (totalReferences > 50) impactScore += 2
    else if (totalReferences > 20) impactScore += 1
    
    if (criticalPathCount > 5) impactScore += 3
    else if (criticalPathCount > 2) impactScore += 2
    else if (criticalPathCount > 0) impactScore += 1
    
    if (impactScore <= 2) return 'low'
    if (impactScore <= 5) return 'medium'
    return 'high'
  }

  private containsEntityCode(content: string, entity: string): boolean {
    const patterns = [
      `interface ${entity}`,
      `interface I${entity}`,
      `type ${entity}`,
      `class ${entity}`,
      `const ${entity}`,
      `function ${entity}`,
      `export.*${entity}`
    ]
    
    return patterns.some(pattern => new RegExp(pattern).test(content))
  }

  private categorizeFile(
    filePath: string,
    content: string
  ): 'model' | 'ui' | 'api' | 'utility' {
    if (filePath.includes('/types/') || filePath.includes('/models/')) {
      return 'model'
    }
    if (filePath.includes('/components/') || filePath.includes('/ui/')) {
      return 'ui'
    }
    if (filePath.includes('/services/') || filePath.includes('/api/')) {
      return 'api'
    }
    if (filePath.includes('/utils/') || filePath.includes('/helpers/')) {
      return 'utility'
    }
    
    if (/interface|type|class/.test(content)) {
      return 'model'
    }
    if (/React|Component|jsx|tsx/.test(content)) {
      return 'ui'
    }
    if (/fetch|axios|api|query|mutation/.test(content)) {
      return 'api'
    }
    
    return 'utility'
  }

  private calculateFileComplexity(content: string): number {
    let complexity = 0
    
    const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g)
    complexity += (functionMatches?.length || 0) * 2
    
    const conditionalMatches = content.match(/if\s*\(|switch\s*\(|case\s+/g)
    complexity += (conditionalMatches?.length || 0)
    
    const loopMatches = content.match(/for\s*\(|while\s*\(|\.map\(|\.forEach\(/g)
    complexity += (loopMatches?.length || 0)
    
    const asyncMatches = content.match(/async|await|Promise/g)
    complexity += (asyncMatches?.length || 0)
    
    return complexity
  }

  private parseInterfaces(content: string): TypeInterface[] {
    const interfaces: TypeInterface[] = []
    const interfaceRegex = /interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*\{([^}]+)\}/g
    
    let match
    while ((match = interfaceRegex.exec(content)) !== null) {
      const name = match[1]
      const extendsClause = match[2]
      const body = match[3]
      
      const properties = this.parseInterfaceProperties(body)
      const extendsTypes = extendsClause ? extendsClause.split(',').map(t => t.trim()) : []
      
      const lineNumber = content.substring(0, match.index).split('\n').length
      
      interfaces.push({
        name,
        properties,
        extends: extendsTypes,
        exported: content.includes(`export interface ${name}`),
        lineNumber
      })
    }
    
    return interfaces
  }

  private parseInterfaceProperties(body: string): Array<{
    name: string
    type: string
    optional: boolean
    description?: string
  }> {
    const properties: Array<{
      name: string
      type: string
      optional: boolean
      description?: string
    }> = []
    
    const lines = body.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('//')) continue
      
      const propMatch = trimmed.match(/(\w+)(\??):\s*([^;]+)/)
      if (propMatch) {
        properties.push({
          name: propMatch[1],
          type: propMatch[3].trim(),
          optional: propMatch[2] === '?'
        })
      }
    }
    
    return properties
  }

  private hasEntityInterface(content: string, entity: string): boolean {
    const patterns = [
      `interface ${entity}`,
      `interface I${entity}`,
      `export interface ${entity}`,
      `export interface I${entity}`
    ]
    return patterns.some(pattern => content.includes(pattern))
  }

  private hasEntityType(content: string, entity: string): boolean {
    const patterns = [
      `type ${entity} =`,
      `type ${entity}Type =`,
      `export type ${entity}`,
      `export type ${entity}Type`
    ]
    return patterns.some(pattern => content.includes(pattern))
  }

  private hasEntityComponent(content: string, entity: string): boolean {
    const patterns = [
      `${entity}Card`,
      `${entity}Form`,
      `${entity}List`,
      `${entity}Detail`,
      `${entity}Component`,
      `function ${entity}`,
      `const ${entity} =`
    ]
    return patterns.some(pattern => content.includes(pattern))
  }

  private hasEntityAPI(content: string, entity: string): boolean {
    const entityLower = entity.toLowerCase()
    const patterns = [
      `get${entity}`,
      `fetch${entity}`,
      `create${entity}`,
      `update${entity}`,
      `delete${entity}`,
      `/${entityLower}`,
      `${entityLower}Service`,
      `${entityLower}Api`
    ]
    return patterns.some(pattern => content.includes(pattern))
  }

  private hasEntityStore(content: string, entity: string): boolean {
    const entityLower = entity.toLowerCase()
    const patterns = [
      `${entityLower}Store`,
      `use${entity}Store`,
      `create.*${entity}.*Store`
    ]
    return patterns.some(pattern => new RegExp(pattern, 'i').test(content))
  }
}
