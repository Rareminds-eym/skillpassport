/**
 * TypeScriptCompilerValidator - Validates TypeScript compilation in strict mode
 * 
 * Integrates with TypeScript compiler API to run strict mode compilation
 * and categorize errors by type and severity.
 */

import * as ts from 'typescript'
import * as path from 'path'
import * as fs from 'fs/promises'
import {
  TypeScriptValidationResult,
  TypeScriptError,
  TypeScriptWarning,
  ErrorCategory,
  ErrorSeverity
} from '../types/type-safety'

export class TypeScriptCompilerValidator {
  private projectRoot: string
  private configPath: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.configPath = path.join(projectRoot, 'tsconfig.json')
  }

  /**
   * Validate TypeScript compilation in strict mode
   */
  async validateTypeScript(): Promise<TypeScriptValidationResult> {
    const startTime = Date.now()

    try {
      // Load TypeScript configuration
      const config = await this.loadTsConfig()
      
      // Ensure strict mode is enabled
      const strictConfig = this.ensureStrictMode(config)

      // Create TypeScript program
      const program = ts.createProgram({
        rootNames: strictConfig.fileNames,
        options: strictConfig.options
      })

      // Get diagnostics
      const diagnostics = [
        ...program.getSemanticDiagnostics(),
        ...program.getSyntacticDiagnostics(),
        ...program.getDeclarationDiagnostics()
      ]

      // Process diagnostics
      const errors: TypeScriptError[] = []
      const warnings: TypeScriptWarning[] = []
      const filesWithErrors = new Set<string>()
      const errorsByCategory = new Map<ErrorCategory, number>()

      for (const diagnostic of diagnostics) {
        if (!diagnostic.file) continue

        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start || 0
        )

        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        const file = diagnostic.file.fileName

        if (diagnostic.category === ts.DiagnosticCategory.Error) {
          const category = this.categorizeError(diagnostic.code, message)
          const severity = this.determineSeverity(category, diagnostic.code)

          errors.push({
            code: diagnostic.code,
            message,
            file,
            line: line + 1,
            column: character + 1,
            category,
            severity,
            suggestion: this.getSuggestion(category, diagnostic.code)
          })

          filesWithErrors.add(file)
          errorsByCategory.set(category, (errorsByCategory.get(category) || 0) + 1)
        } else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
          warnings.push({
            code: diagnostic.code,
            message,
            file,
            line: line + 1,
            column: character + 1,
            suggestion: this.getSuggestion(this.categorizeError(diagnostic.code, message), diagnostic.code)
          })
        }
      }

      const duration = Date.now() - startTime

      return {
        success: errors.length === 0,
        errors,
        warnings,
        strictModeEnabled: strictConfig.options.strict === true,
        totalFiles: program.getSourceFiles().filter(f => !f.isDeclarationFile).length,
        filesWithErrors: filesWithErrors.size,
        errorsByCategory,
        duration
      }
    } catch (error) {
      throw new Error(`TypeScript validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load TypeScript configuration
   */
  private async loadTsConfig(): Promise<ts.ParsedCommandLine> {
    const configFile = ts.readConfigFile(this.configPath, ts.sys.readFile)
    
    if (configFile.error) {
      throw new Error(`Failed to read tsconfig.json: ${configFile.error.messageText}`)
    }

    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      this.projectRoot
    )

    if (parsedConfig.errors.length > 0) {
      const errorMessages = parsedConfig.errors.map(e => e.messageText).join(', ')
      throw new Error(`Failed to parse tsconfig.json: ${errorMessages}`)
    }

    return parsedConfig
  }

  /**
   * Ensure strict mode is enabled
   */
  private ensureStrictMode(config: ts.ParsedCommandLine): ts.ParsedCommandLine {
    return {
      ...config,
      options: {
        ...config.options,
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        strictBindCallApply: true,
        strictPropertyInitialization: true,
        noImplicitThis: true,
        alwaysStrict: true
      }
    }
  }

  /**
   * Categorize TypeScript error
   */
  private categorizeError(code: number, message: string): ErrorCategory {
    // Type mismatch errors
    if (code === 2322 || code === 2345 || code === 2339 || code === 2741) {
      return 'type-mismatch'
    }

    // Missing type errors
    if (code === 2304 || code === 2307 || code === 2305) {
      return 'missing-type'
    }

    // Any type errors
    if (code === 7006 || code === 7031 || message.includes("'any'")) {
      return 'any-type'
    }

    // Implicit any errors
    if (code === 7006 || code === 7019 || code === 7023) {
      return 'implicit-any'
    }

    // Null/undefined errors
    if (code === 2531 || code === 2532 || code === 2533 || code === 2454) {
      return 'null-undefined'
    }

    // Unused variable errors
    if (code === 6133 || code === 6192 || code === 6196) {
      return 'unused-variable'
    }

    // Import errors
    if (code === 2307 || code === 2305 || code === 2792) {
      return 'import-error'
    }

    // Syntax errors
    if (code >= 1000 && code < 2000) {
      return 'syntax-error'
    }

    return 'other'
  }

  /**
   * Determine error severity
   */
  private determineSeverity(category: ErrorCategory, code: number): ErrorSeverity {
    // Critical errors that break compilation
    if (category === 'syntax-error' || category === 'import-error') {
      return 'critical'
    }

    // High severity for type safety issues
    if (category === 'type-mismatch' || category === 'missing-type') {
      return 'high'
    }

    // Medium severity for implicit any and null/undefined
    if (category === 'implicit-any' || category === 'null-undefined') {
      return 'medium'
    }

    // Low severity for unused variables and any types
    if (category === 'unused-variable' || category === 'any-type') {
      return 'low'
    }

    return 'medium'
  }

  /**
   * Get suggestion for error
   */
  private getSuggestion(category: ErrorCategory, code: number): string | undefined {
    const suggestions: Record<ErrorCategory, string> = {
      'type-mismatch': 'Ensure types match between assignment and declaration. Check interface definitions.',
      'missing-type': 'Add explicit type annotations or import missing types.',
      'any-type': 'Replace "any" with specific types. Use unknown if type is truly unknown.',
      'implicit-any': 'Add explicit type annotations to parameters and variables.',
      'null-undefined': 'Add null checks or use optional chaining (?.) and nullish coalescing (??).',
      'unused-variable': 'Remove unused variables or prefix with underscore (_) if intentionally unused.',
      'import-error': 'Check import paths and ensure modules are installed.',
      'syntax-error': 'Fix syntax errors according to TypeScript grammar.',
      'other': 'Review TypeScript documentation for error code.'
    }

    return suggestions[category]
  }

  /**
   * Check if strict mode is enabled in tsconfig
   */
  async isStrictModeEnabled(): Promise<boolean> {
    try {
      const config = await this.loadTsConfig()
      return config.options.strict === true
    } catch {
      return false
    }
  }

  /**
   * Get TypeScript version
   */
  getTypeScriptVersion(): string {
    return ts.version
  }
}
