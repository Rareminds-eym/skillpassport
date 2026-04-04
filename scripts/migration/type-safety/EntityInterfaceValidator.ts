/**
 * EntityInterfaceValidator - Validates entity TypeScript interfaces
 * 
 * Ensures all entities have complete TypeScript interfaces with proper
 * type definitions for all properties.
 */

import * as ts from 'typescript'
import * as path from 'path'
import * as fs from 'fs/promises'
import {
  EntityInterfaceValidation,
  EntityInterfaceCheck,
  PropertyCheck,
  IncompleteInterface,
  InterfaceIssue,
  EntityInterfaceSummary,
  ErrorSeverity
} from '@/shared/types/type-safety'

export class EntityInterfaceValidator {
  private projectRoot: string
  private entitiesPath: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.entitiesPath = path.join(projectRoot, 'src', 'entities')
  }

  /**
   * Validate all entity interfaces
   */
  async validateEntityInterfaces(): Promise<EntityInterfaceValidation> {
    const entities: EntityInterfaceCheck[] = []
    const missingInterfaces: string[] = []
    const incompleteInterfaces: IncompleteInterface[] = []

    try {
      // Get all entity directories
      const entityDirs = await this.getEntityDirectories()

      for (const entityDir of entityDirs) {
        const check = await this.validateEntityInterface(entityDir)
        entities.push(check)

        if (!check.hasInterface) {
          missingInterfaces.push(check.entityName)
        }

        if (check.hasInterface && !check.interfaceComplete) {
          const missingProps = check.properties
            .filter(p => !p.isValid)
            .map(p => p.name)

          incompleteInterfaces.push({
            entityName: check.entityName,
            interfaceName: this.getInterfaceName(check.entityName),
            missingProperties: missingProps,
            suggestion: `Add type definitions for: ${missingProps.join(', ')}`
          })
        }
      }

      const summary = this.createSummary(entities)

      return {
        valid: missingInterfaces.length === 0 && incompleteInterfaces.length === 0,
        entities,
        missingInterfaces,
        incompleteInterfaces,
        totalEntities: entities.length,
        validEntities: entities.filter(e => e.hasInterface && e.interfaceComplete).length,
        summary
      }
    } catch (error) {
      throw new Error(`Entity interface validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate single entity interface
   */
  private async validateEntityInterface(entityName: string): Promise<EntityInterfaceCheck> {
    const typesPath = path.join(this.entitiesPath, entityName, 'model', 'types.ts')
    const issues: InterfaceIssue[] = []

    try {
      const exists = await this.fileExists(typesPath)

      if (!exists) {
        issues.push({
          type: 'missing-property',
          message: 'types.ts file not found',
          severity: 'critical',
          suggestion: `Create ${entityName}/model/types.ts with entity interface`
        })

        return {
          entityName,
          entityType: this.capitalizeFirst(entityName),
          hasInterface: false,
          interfaceComplete: false,
          interfacePath: typesPath,
          properties: [],
          issues
        }
      }

      // Parse TypeScript file
      const sourceFile = await this.parseTypeScriptFile(typesPath)
      const interfaceName = this.getInterfaceName(entityName)
      const interfaceNode = this.findInterface(sourceFile, interfaceName)

      if (!interfaceNode) {
        issues.push({
          type: 'missing-property',
          message: `Interface ${interfaceName} not found`,
          severity: 'critical',
          suggestion: `Create interface ${interfaceName} in types.ts`
        })

        return {
          entityName,
          entityType: this.capitalizeFirst(entityName),
          hasInterface: false,
          interfaceComplete: false,
          interfacePath: typesPath,
          properties: [],
          issues
        }
      }

      // Validate interface properties
      const properties = this.validateInterfaceProperties(interfaceNode, issues)
      const interfaceComplete = properties.every(p => p.isValid) && issues.length === 0

      return {
        entityName,
        entityType: this.capitalizeFirst(entityName),
        hasInterface: true,
        interfaceComplete,
        interfacePath: typesPath,
        properties,
        issues
      }
    } catch (error) {
      issues.push({
        type: 'missing-property',
        message: `Failed to validate interface: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        suggestion: 'Check file syntax and structure'
      })

      return {
        entityName,
        entityType: this.capitalizeFirst(entityName),
        hasInterface: false,
        interfaceComplete: false,
        interfacePath: typesPath,
        properties: [],
        issues
      }
    }
  }

  /**
   * Validate interface properties
   */
  private validateInterfaceProperties(
    interfaceNode: ts.InterfaceDeclaration,
    issues: InterfaceIssue[]
  ): PropertyCheck[] {
    const properties: PropertyCheck[] = []

    for (const member of interfaceNode.members) {
      if (ts.isPropertySignature(member) && member.name) {
        const propertyName = member.name.getText()
        const hasType = member.type !== undefined
        const typeQuality = this.assessTypeQuality(member.type)
        const isOptional = member.questionToken !== undefined

        // Check for 'any' type
        if (typeQuality === 'any') {
          issues.push({
            type: 'any-type',
            property: propertyName,
            message: `Property '${propertyName}' has 'any' type`,
            severity: 'medium',
            suggestion: `Replace 'any' with specific type for ${propertyName}`
          })
        }

        // Check for missing type
        if (!hasType) {
          issues.push({
            type: 'implicit-type',
            property: propertyName,
            message: `Property '${propertyName}' has no explicit type`,
            severity: 'high',
            suggestion: `Add explicit type annotation for ${propertyName}`
          })
        }

        properties.push({
          name: propertyName,
          hasType,
          typeQuality,
          isOptional,
          isValid: hasType && typeQuality !== 'any'
        })
      }
    }

    return properties
  }

  /**
   * Assess type quality
   */
  private assessTypeQuality(typeNode: ts.TypeNode | undefined): 'explicit' | 'inferred' | 'any' | 'unknown' {
    if (!typeNode) return 'inferred'

    if (ts.isTypeReferenceNode(typeNode)) {
      const typeName = typeNode.typeName.getText()
      if (typeName === 'any') return 'any'
      if (typeName === 'unknown') return 'unknown'
      return 'explicit'
    }

    if (typeNode.kind === ts.SyntaxKind.AnyKeyword) return 'any'
    if (typeNode.kind === ts.SyntaxKind.UnknownKeyword) return 'unknown'

    return 'explicit'
  }

  /**
   * Parse TypeScript file
   */
  private async parseTypeScriptFile(filePath: string): Promise<ts.SourceFile> {
    const content = await fs.readFile(filePath, 'utf-8')
    return ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    )
  }

  /**
   * Find interface in source file
   */
  private findInterface(
    sourceFile: ts.SourceFile,
    interfaceName: string
  ): ts.InterfaceDeclaration | undefined {
    let foundInterface: ts.InterfaceDeclaration | undefined

    const visit = (node: ts.Node) => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
        foundInterface = node
        return
      }
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return foundInterface
  }

  /**
   * Get entity directories
   */
  private async getEntityDirectories(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.entitiesPath, { withFileTypes: true })
      return entries
        .filter(e => e.isDirectory() && e.name !== '.gitkeep')
        .map(e => e.name)
    } catch {
      return []
    }
  }

  /**
   * Get interface name for entity
   */
  private getInterfaceName(entityName: string): string {
    return this.capitalizeFirst(entityName)
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Create summary
   */
  private createSummary(entities: EntityInterfaceCheck[]): EntityInterfaceSummary {
    const entitiesWithInterfaces = entities.filter(e => e.hasInterface).length
    const completeInterfaces = entities.filter(e => e.hasInterface && e.interfaceComplete).length
    const totalIssues = entities.reduce((sum, e) => sum + e.issues.length, 0)
    const criticalIssues = entities.reduce(
      (sum, e) => sum + e.issues.filter(i => i.severity === 'critical').length,
      0
    )

    return {
      totalEntities: entities.length,
      entitiesWithInterfaces,
      completeInterfaces,
      incompleteInterfaces: entitiesWithInterfaces - completeInterfaces,
      totalIssues,
      criticalIssues
    }
  }
}
