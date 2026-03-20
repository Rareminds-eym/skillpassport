/**
 * StoreTypeValidator - Validates Zustand store type definitions
 * 
 * Ensures all Zustand stores have proper state interfaces, typed selectors,
 * and typed actions.
 */

import * as ts from 'typescript'
import * as path from 'path'
import * as fs from 'fs/promises'
import {
  StoreTypeValidation,
  StoreCheck,
  StatePropertyCheck,
  SelectorCheck,
  ActionCheck,
  MissingStoreType,
  StoreTypeIssue,
  StoreTypeSummary,
  TypeQuality,
  ErrorSeverity
} from '../types/type-safety'

export class StoreTypeValidator {
  private projectRoot: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
  }

  /**
   * Validate all Zustand store types
   */
  async validateStoreTypes(): Promise<StoreTypeValidation> {
    const stores: StoreCheck[] = []
    const missingTypes: MissingStoreType[] = []

    try {
      // Find all store files
      const storeFiles = await this.findStoreFiles()

      for (const storeFile of storeFiles) {
        const check = await this.validateStoreFile(storeFile)
        if (check) {
          stores.push(check)

          // Collect stores with missing types
          if (!check.hasStateInterface || !check.hasTypedSelectors || !check.hasTypedActions) {
            missingTypes.push({
              storeName: check.storeName,
              filePath: check.filePath,
              missingStateInterface: !check.hasStateInterface,
              missingTypedSelectors: !check.hasTypedSelectors,
              missingTypedActions: !check.hasTypedActions,
              suggestion: this.getMissingTypeSuggestion(check)
            })
          }
        }
      }

      const summary = this.createSummary(stores)

      return {
        valid: missingTypes.length === 0,
        stores,
        missingTypes,
        totalStores: stores.length,
        validStores: stores.filter(s => s.hasStateInterface && s.hasTypedSelectors && s.hasTypedActions).length,
        summary
      }
    } catch (error) {
      throw new Error(`Store type validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate store file
   */
  private async validateStoreFile(filePath: string): Promise<StoreCheck | null> {
    try {
      const sourceFile = await this.parseTypeScriptFile(filePath)
      const storeName = this.extractStoreName(filePath)

      // Find state interface
      const stateInterface = this.findStateInterface(sourceFile)
      const hasStateInterface = stateInterface !== null

      // Find store creation call
      const storeCreation = this.findStoreCreation(sourceFile)
      if (!storeCreation) return null

      const issues: StoreTypeIssue[] = []

      // Validate state interface
      const stateProperties = hasStateInterface
        ? this.validateStateProperties(stateInterface!, issues)
        : []

      if (!hasStateInterface) {
        issues.push({
          type: 'missing-state-interface',
          message: 'Store has no state interface',
          severity: 'high',
          suggestion: 'Create a state interface for the store'
        })
      }

      // Validate selectors
      const selectors = this.validateSelectors(storeCreation, issues)
      const hasTypedSelectors = selectors.every(s => s.isValid)

      // Validate actions
      const actions = this.validateActions(storeCreation, issues)
      const hasTypedActions = actions.every(a => a.isValid)

      return {
        storeName,
        filePath,
        hasStateInterface,
        hasTypedSelectors,
        hasTypedActions,
        stateProperties,
        selectors,
        actions,
        issues
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Validate state properties
   */
  private validateStateProperties(
    interfaceNode: ts.InterfaceDeclaration,
    issues: StoreTypeIssue[]
  ): StatePropertyCheck[] {
    const properties: StatePropertyCheck[] = []

    for (const member of interfaceNode.members) {
      if (ts.isPropertySignature(member) && member.name) {
        const propertyName = member.name.getText()
        const hasType = member.type !== undefined
        const typeQuality = this.assessTypeQuality(member.type)

        if (typeQuality === 'any') {
          issues.push({
            type: 'any-type',
            element: propertyName,
            message: `State property '${propertyName}' has 'any' type`,
            severity: 'medium',
            suggestion: `Replace 'any' with specific type for ${propertyName}`
          })
        }

        properties.push({
          name: propertyName,
          hasType,
          typeQuality,
          isValid: hasType && typeQuality !== 'any'
        })
      }
    }

    return properties
  }

  /**
   * Validate selectors
   */
  private validateSelectors(
    storeCreation: ts.CallExpression,
    issues: StoreTypeIssue[]
  ): SelectorCheck[] {
    const selectors: SelectorCheck[] = []

    // Extract object literal from store creation
    const objectLiteral = this.extractObjectLiteral(storeCreation)
    if (!objectLiteral) return selectors

    for (const property of objectLiteral.properties) {
      if (ts.isPropertyAssignment(property) || ts.isMethodDeclaration(property)) {
        const name = property.name?.getText() || 'unknown'
        
        // Check if it's a selector (typically a function that returns state)
        if (this.isSelector(property)) {
          const hasReturnType = this.hasReturnType(property)
          const returnTypeQuality = this.assessReturnTypeQuality(property)

          if (!hasReturnType) {
            issues.push({
              type: 'untyped-selector',
              element: name,
              message: `Selector '${name}' has no return type`,
              severity: 'medium',
              suggestion: `Add explicit return type to selector ${name}`
            })
          }

          selectors.push({
            name,
            hasReturnType,
            returnTypeQuality,
            isValid: hasReturnType && returnTypeQuality !== 'any'
          })
        }
      }
    }

    return selectors
  }

  /**
   * Validate actions
   */
  private validateActions(
    storeCreation: ts.CallExpression,
    issues: StoreTypeIssue[]
  ): ActionCheck[] {
    const actions: ActionCheck[] = []

    // Extract object literal from store creation
    const objectLiteral = this.extractObjectLiteral(storeCreation)
    if (!objectLiteral) return actions

    for (const property of objectLiteral.properties) {
      if (ts.isPropertyAssignment(property) || ts.isMethodDeclaration(property)) {
        const name = property.name?.getText() || 'unknown'
        
        // Check if it's an action (typically a function that modifies state)
        if (this.isAction(property)) {
          const hasParameterTypes = this.hasParameterTypes(property)
          const hasReturnType = this.hasReturnType(property)
          const parameterTypeQuality = this.assessParameterTypeQuality(property)
          const returnTypeQuality = this.assessReturnTypeQuality(property)

          if (!hasParameterTypes) {
            issues.push({
              type: 'untyped-action',
              element: name,
              message: `Action '${name}' has no parameter types`,
              severity: 'medium',
              suggestion: `Add explicit parameter types to action ${name}`
            })
          }

          actions.push({
            name,
            hasParameterTypes,
            hasReturnType,
            parameterTypeQuality,
            returnTypeQuality,
            isValid: hasParameterTypes && parameterTypeQuality !== 'any'
          })
        }
      }
    }

    return actions
  }

  /**
   * Find state interface
   */
  private findStateInterface(sourceFile: ts.SourceFile): ts.InterfaceDeclaration | null {
    let stateInterface: ts.InterfaceDeclaration | null = null

    const visit = (node: ts.Node) => {
      if (ts.isInterfaceDeclaration(node)) {
        const name = node.name.text
        if (name.includes('State') || name.includes('Store')) {
          stateInterface = node
          return
        }
      }
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return stateInterface
  }

  /**
   * Find store creation call
   */
  private findStoreCreation(sourceFile: ts.SourceFile): ts.CallExpression | null {
    let storeCall: ts.CallExpression | null = null

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const text = node.expression.getText()
        if (text.includes('create') || text.includes('zustand')) {
          storeCall = node
          return
        }
      }
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return storeCall
  }

  /**
   * Extract object literal from call expression
   */
  private extractObjectLiteral(call: ts.CallExpression): ts.ObjectLiteralExpression | null {
    if (call.arguments.length === 0) return null

    const firstArg = call.arguments[0]
    
    if (ts.isObjectLiteralExpression(firstArg)) {
      return firstArg
    }

    if (ts.isArrowFunction(firstArg) && firstArg.body) {
      if (ts.isObjectLiteralExpression(firstArg.body)) {
        return firstArg.body
      }
    }

    return null
  }

  /**
   * Check if property is a selector
   */
  private isSelector(property: ts.PropertyAssignment | ts.MethodDeclaration): boolean {
    // Heuristic: selectors typically don't have parameters or have minimal parameters
    if (ts.isMethodDeclaration(property)) {
      return property.parameters.length <= 1
    }
    return false
  }

  /**
   * Check if property is an action
   */
  private isAction(property: ts.PropertyAssignment | ts.MethodDeclaration): boolean {
    // Heuristic: actions typically have parameters
    if (ts.isMethodDeclaration(property)) {
      return property.parameters.length > 0
    }
    if (ts.isPropertyAssignment(property) && property.initializer) {
      if (ts.isArrowFunction(property.initializer)) {
        return property.initializer.parameters.length > 0
      }
    }
    return false
  }

  /**
   * Check if has parameter types
   */
  private hasParameterTypes(property: ts.PropertyAssignment | ts.MethodDeclaration): boolean {
    if (ts.isMethodDeclaration(property)) {
      return property.parameters.every(p => p.type !== undefined)
    }
    if (ts.isPropertyAssignment(property) && property.initializer) {
      if (ts.isArrowFunction(property.initializer)) {
        return property.initializer.parameters.every(p => p.type !== undefined)
      }
    }
    return false
  }

  /**
   * Check if has return type
   */
  private hasReturnType(property: ts.PropertyAssignment | ts.MethodDeclaration): boolean {
    if (ts.isMethodDeclaration(property)) {
      return property.type !== undefined
    }
    if (ts.isPropertyAssignment(property) && property.initializer) {
      if (ts.isArrowFunction(property.initializer)) {
        return property.initializer.type !== undefined
      }
    }
    return false
  }

  /**
   * Assess parameter type quality
   */
  private assessParameterTypeQuality(property: ts.PropertyAssignment | ts.MethodDeclaration): TypeQuality {
    let parameters: ts.NodeArray<ts.ParameterDeclaration> | undefined

    if (ts.isMethodDeclaration(property)) {
      parameters = property.parameters
    } else if (ts.isPropertyAssignment(property) && property.initializer) {
      if (ts.isArrowFunction(property.initializer)) {
        parameters = property.initializer.parameters
      }
    }

    if (!parameters || parameters.length === 0) return 'explicit'

    for (const param of parameters) {
      if (!param.type) return 'missing'
      if (param.type.kind === ts.SyntaxKind.AnyKeyword) return 'any'
    }

    return 'explicit'
  }

  /**
   * Assess return type quality
   */
  private assessReturnTypeQuality(property: ts.PropertyAssignment | ts.MethodDeclaration): TypeQuality {
    let type: ts.TypeNode | undefined

    if (ts.isMethodDeclaration(property)) {
      type = property.type
    } else if (ts.isPropertyAssignment(property) && property.initializer) {
      if (ts.isArrowFunction(property.initializer)) {
        type = property.initializer.type
      }
    }

    if (!type) return 'inferred'
    if (type.kind === ts.SyntaxKind.AnyKeyword) return 'any'
    return 'explicit'
  }

  /**
   * Assess type quality
   */
  private assessTypeQuality(typeNode: ts.TypeNode | undefined): TypeQuality {
    if (!typeNode) return 'inferred'
    if (typeNode.kind === ts.SyntaxKind.AnyKeyword) return 'any'
    if (typeNode.kind === ts.SyntaxKind.UnknownKeyword) return 'unknown'
    return 'explicit'
  }

  /**
   * Find store files
   */
  private async findStoreFiles(): Promise<string[]> {
    const storeFiles: string[] = []

    // Search in features
    const featuresPath = path.join(this.projectRoot, 'src', 'features')
    await this.findStoreFilesInDirectory(featuresPath, storeFiles)

    // Search in widgets
    const widgetsPath = path.join(this.projectRoot, 'src', 'widgets')
    await this.findStoreFilesInDirectory(widgetsPath, storeFiles)

    // Search in shared
    const sharedPath = path.join(this.projectRoot, 'src', 'shared')
    await this.findStoreFilesInDirectory(sharedPath, storeFiles)

    return storeFiles
  }

  /**
   * Find store files in directory recursively
   */
  private async findStoreFilesInDirectory(dir: string, storeFiles: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          if (entry.name === 'model' || entry.name === 'store') {
            // Found model/store directory, add store files
            const files = await fs.readdir(fullPath)
            for (const file of files) {
              if ((file.includes('store') || file.includes('Store')) && 
                  file.endsWith('.ts') && !file.endsWith('.test.ts')) {
                storeFiles.push(path.join(fullPath, file))
              }
            }
          } else {
            // Recurse into subdirectory
            await this.findStoreFilesInDirectory(fullPath, storeFiles)
          }
        } else if (entry.isFile()) {
          // Check for store files in current directory
          if ((entry.name.includes('store') || entry.name.includes('Store')) && 
              entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
            storeFiles.push(fullPath)
          }
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  /**
   * Extract store name from file path
   */
  private extractStoreName(filePath: string): string {
    const fileName = path.basename(filePath, '.ts')
    return fileName.replace(/store|Store/gi, '').trim() || fileName
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
   * Get missing type suggestion
   */
  private getMissingTypeSuggestion(store: StoreCheck): string {
    const suggestions: string[] = []

    if (!store.hasStateInterface) {
      suggestions.push('Create state interface')
    }

    if (!store.hasTypedSelectors) {
      suggestions.push('Add return types to selectors')
    }

    if (!store.hasTypedActions) {
      suggestions.push('Add parameter types to actions')
    }

    return suggestions.join('; ')
  }

  /**
   * Create summary
   */
  private createSummary(stores: StoreCheck[]): StoreTypeSummary {
    const storesWithStateInterface = stores.filter(s => s.hasStateInterface).length
    const storesWithTypedSelectors = stores.filter(s => s.hasTypedSelectors).length
    const storesWithTypedActions = stores.filter(s => s.hasTypedActions).length
    const totalIssues = stores.reduce((sum, s) => sum + s.issues.length, 0)
    const criticalIssues = stores.reduce(
      (sum, s) => sum + s.issues.filter(i => i.severity === 'critical').length,
      0
    )

    return {
      totalStores: stores.length,
      storesWithStateInterface,
      storesWithTypedSelectors,
      storesWithTypedActions,
      totalIssues,
      criticalIssues
    }
  }
}
