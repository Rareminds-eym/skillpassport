/**
 * APITypeValidator - Validates API function type definitions
 * 
 * Ensures all API functions have proper request and response types
 * with explicit type annotations.
 */

import * as ts from 'typescript'
import * as path from 'path'
import * as fs from 'fs/promises'
import {
  APITypeValidation,
  APIMethodCheck,
  MissingAPIType,
  APITypeIssue,
  APITypeSummary,
  TypeQuality,
  ErrorSeverity
} from '../types/type-safety'

export class APITypeValidator {
  private projectRoot: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
  }

  /**
   * Validate all API function types
   */
  async validateAPITypes(): Promise<APITypeValidation> {
    const apiMethods: APIMethodCheck[] = []
    const missingTypes: MissingAPIType[] = []

    try {
      // Find all API files
      const apiFiles = await this.findAPIFiles()

      for (const apiFile of apiFiles) {
        const methods = await this.validateAPIFile(apiFile)
        apiMethods.push(...methods)

        // Collect methods with missing types
        for (const method of methods) {
          if (!method.hasRequestType || !method.hasResponseType) {
            missingTypes.push({
              methodName: method.methodName,
              filePath: method.filePath,
              missingRequest: !method.hasRequestType,
              missingResponse: !method.hasResponseType,
              suggestion: this.getMissingTypeSuggestion(method)
            })
          }
        }
      }

      const summary = this.createSummary(apiMethods)

      return {
        valid: missingTypes.length === 0,
        apiMethods,
        missingTypes,
        totalMethods: apiMethods.length,
        validMethods: apiMethods.filter(m => m.hasRequestType && m.hasResponseType).length,
        summary
      }
    } catch (error) {
      throw new Error(`API type validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate API file
   */
  private async validateAPIFile(filePath: string): Promise<APIMethodCheck[]> {
    const methods: APIMethodCheck[] = []

    try {
      const sourceFile = await this.parseTypeScriptFile(filePath)
      const functions = this.extractFunctions(sourceFile)

      for (const func of functions) {
        const check = this.validateAPIMethod(func, filePath)
        methods.push(check)
      }
    } catch (error) {
      // Skip files that can't be parsed
    }

    return methods
  }

  /**
   * Validate API method
   */
  private validateAPIMethod(
    func: ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration,
    filePath: string
  ): APIMethodCheck {
    const methodName = this.getFunctionName(func)
    const issues: APITypeIssue[] = []

    // Check parameters for request type
    const hasRequestType = this.hasRequestType(func)
    const requestTypeQuality = this.assessRequestTypeQuality(func)

    if (!hasRequestType) {
      issues.push({
        type: 'missing-request-type',
        message: `Method '${methodName}' has no request type`,
        severity: 'high',
        suggestion: 'Add explicit type annotations to function parameters'
      })
    } else if (requestTypeQuality === 'any') {
      issues.push({
        type: 'any-type',
        message: `Method '${methodName}' uses 'any' for request type`,
        severity: 'medium',
        suggestion: 'Replace any with specific request interface'
      })
    }

    // Check return type for response type
    const hasResponseType = this.hasResponseType(func)
    const responseTypeQuality = this.assessResponseTypeQuality(func)

    if (!hasResponseType) {
      issues.push({
        type: 'missing-response-type',
        message: `Method '${methodName}' has no response type`,
        severity: 'high',
        suggestion: 'Add explicit return type annotation'
      })
    } else if (responseTypeQuality === 'any') {
      issues.push({
        type: 'any-type',
        message: `Method '${methodName}' uses 'any' for response type`,
        severity: 'medium',
        suggestion: 'Replace any with specific response interface'
      })
    } else if (responseTypeQuality === 'inferred') {
      issues.push({
        type: 'implicit-return',
        message: `Method '${methodName}' has implicit return type`,
        severity: 'low',
        suggestion: 'Add explicit return type annotation for clarity'
      })
    }

    const isAsync = this.isAsyncFunction(func)

    return {
      methodName,
      filePath,
      hasRequestType,
      hasResponseType,
      requestTypeQuality,
      responseTypeQuality,
      isAsync,
      issues
    }
  }

  /**
   * Check if function has request type
   */
  private hasRequestType(func: ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration): boolean {
    if (!func.parameters || func.parameters.length === 0) return true // No parameters is valid

    return func.parameters.every(param => param.type !== undefined)
  }

  /**
   * Assess request type quality
   */
  private assessRequestTypeQuality(func: ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration): TypeQuality {
    if (!func.parameters || func.parameters.length === 0) return 'explicit'

    for (const param of func.parameters) {
      if (!param.type) return 'missing'
      if (param.type.kind === ts.SyntaxKind.AnyKeyword) return 'any'
      if (param.type.kind === ts.SyntaxKind.UnknownKeyword) return 'unknown'
    }

    return 'explicit'
  }

  /**
   * Check if function has response type
   */
  private hasResponseType(func: ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration): boolean {
    return func.type !== undefined
  }

  /**
   * Assess response type quality
   */
  private assessResponseTypeQuality(func: ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration): TypeQuality {
    if (!func.type) return 'inferred'
    if (func.type.kind === ts.SyntaxKind.AnyKeyword) return 'any'
    if (func.type.kind === ts.SyntaxKind.UnknownKeyword) return 'unknown'
    return 'explicit'
  }

  /**
   * Check if function is async
   */
  private isAsyncFunction(func: ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration): boolean {
    return func.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false
  }

  /**
   * Get function name
   */
  private getFunctionName(func: ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration): string {
    if (ts.isFunctionDeclaration(func) && func.name) {
      return func.name.text
    }
    if (ts.isMethodDeclaration(func) && func.name) {
      return func.name.getText()
    }
    return 'anonymous'
  }

  /**
   * Extract functions from source file
   */
  private extractFunctions(sourceFile: ts.SourceFile): (ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration)[] {
    const functions: (ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration)[] = []

    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        functions.push(node)
      } else if (ts.isVariableStatement(node)) {
        // Check for arrow functions in variable declarations
        for (const declaration of node.declarationList.declarations) {
          if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
            functions.push(declaration.initializer)
          }
        }
      }
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return functions
  }

  /**
   * Find all API files
   */
  private async findAPIFiles(): Promise<string[]> {
    const apiFiles: string[] = []

    // Search in entities
    const entitiesPath = path.join(this.projectRoot, 'src', 'entities')
    await this.findAPIFilesInDirectory(entitiesPath, apiFiles)

    // Search in features
    const featuresPath = path.join(this.projectRoot, 'src', 'features')
    await this.findAPIFilesInDirectory(featuresPath, apiFiles)

    // Search in shared
    const sharedPath = path.join(this.projectRoot, 'src', 'shared', 'api')
    await this.findAPIFilesInDirectory(sharedPath, apiFiles)

    return apiFiles
  }

  /**
   * Find API files in directory recursively
   */
  private async findAPIFilesInDirectory(dir: string, apiFiles: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          if (entry.name === 'api') {
            // Found API directory, add all .ts files
            const files = await fs.readdir(fullPath)
            for (const file of files) {
              if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
                apiFiles.push(path.join(fullPath, file))
              }
            }
          } else {
            // Recurse into subdirectory
            await this.findAPIFilesInDirectory(fullPath, apiFiles)
          }
        }
      }
    } catch {
      // Skip directories that can't be read
    }
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
  private getMissingTypeSuggestion(method: APIMethodCheck): string {
    const suggestions: string[] = []

    if (!method.hasRequestType) {
      suggestions.push('Add request type to parameters')
    }

    if (!method.hasResponseType) {
      suggestions.push('Add return type annotation')
    }

    return suggestions.join('; ')
  }

  /**
   * Create summary
   */
  private createSummary(methods: APIMethodCheck[]): APITypeSummary {
    const methodsWithTypes = methods.filter(m => m.hasRequestType && m.hasResponseType).length
    const methodsWithRequestTypes = methods.filter(m => m.hasRequestType).length
    const methodsWithResponseTypes = methods.filter(m => m.hasResponseType).length
    const totalIssues = methods.reduce((sum, m) => sum + m.issues.length, 0)
    const criticalIssues = methods.reduce(
      (sum, m) => sum + m.issues.filter(i => i.severity === 'critical').length,
      0
    )

    return {
      totalMethods: methods.length,
      methodsWithTypes,
      methodsWithRequestTypes,
      methodsWithResponseTypes,
      totalIssues,
      criticalIssues
    }
  }
}
