/**
 * Error Handling System - Comprehensive error handling and recovery for migration operations
 * 
 * Provides structured error handling, recovery mechanisms, and detailed error reporting
 * for all migration operations including backup, rollback, and validation.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { MigrationLogger } from '../logging/MigrationLogger.js'
import { RollbackData, MigrationConfig } from '../types/index.js'

export interface ErrorContext {
  operation: string
  phase: string
  filePath?: string
  migrationId: string
  timestamp: Date
  additionalData?: Record<string, any>
}

export interface RecoveryAction {
  type: 'retry' | 'skip' | 'rollback' | 'manual'
  description: string
  autoExecute: boolean
  maxRetries?: number
}

export interface MigrationError {
  code: string
  message: string
  context: ErrorContext
  recoveryAction: RecoveryAction
  severity: 'low' | 'medium' | 'high' | 'critical'
  stack?: string
}

export class ErrorHandlingSystem {
  private logger: MigrationLogger
  private config: MigrationConfig
  private errorLog: MigrationError[] = []
  private recoveryAttempts: Map<string, number> = new Map()

  constructor(config: MigrationConfig, logger: MigrationLogger) {
    this.config = config
    this.logger = logger
  }

  /**
   * Handle and categorize migration errors
   */
  async handleError(
    error: Error, 
    context: ErrorContext, 
    recoveryAction?: RecoveryAction
  ): Promise<MigrationError> {
    const migrationError: MigrationError = {
      code: this.categorizeError(error),
      message: error.message,
      context,
      recoveryAction: recoveryAction || this.determineRecoveryAction(error, context),
      severity: this.determineSeverity(error, context),
      stack: error.stack
    }

    this.errorLog.push(migrationError)
    
    this.logger.error(`Migration error occurred`, {
      code: migrationError.code,
      message: migrationError.message,
      severity: migrationError.severity,
      operation: context.operation,
      phase: context.phase
    })

    // Auto-execute recovery if configured
    if (migrationError.recoveryAction.autoExecute) {
      await this.executeRecoveryAction(migrationError)
    }

    return migrationError
  }

  /**
   * Execute recovery action for a migration error
   */
  async executeRecoveryAction(migrationError: MigrationError): Promise<boolean> {
    const { recoveryAction, context } = migrationError
    const attemptKey = `${context.operation}-${context.filePath || 'global'}`
    const currentAttempts = this.recoveryAttempts.get(attemptKey) || 0

    this.logger.info(`Executing recovery action: ${recoveryAction.type}`, {
      operation: context.operation,
      attempts: currentAttempts + 1,
      maxRetries: recoveryAction.maxRetries
    })

    switch (recoveryAction.type) {
      case 'retry':
        if (currentAttempts < (recoveryAction.maxRetries || 3)) {
          this.recoveryAttempts.set(attemptKey, currentAttempts + 1)
          return true // Signal to retry the operation
        }
        this.logger.warn(`Max retry attempts reached for ${context.operation}`)
        return false

      case 'skip':
        this.logger.info(`Skipping failed operation: ${context.operation}`)
        return true

      case 'rollback':
        this.logger.warn(`Recovery requires rollback for: ${context.operation}`)
        return false // Signal that rollback is needed

      case 'manual':
        this.logger.warn(`Manual intervention required for: ${context.operation}`)
        return false

      default:
        return false
    }
  }

  /**
   * Categorize error based on error type and context
   */
  private categorizeError(error: Error): string {
    if (error.message.includes('ENOENT')) return 'FILE_NOT_FOUND'
    if (error.message.includes('EACCES')) return 'PERMISSION_DENIED'
    if (error.message.includes('ENOSPC')) return 'DISK_SPACE_FULL'
    if (error.message.includes('EMFILE')) return 'TOO_MANY_FILES'
    if (error.message.includes('EISDIR')) return 'IS_DIRECTORY'
    if (error.message.includes('ENOTDIR')) return 'NOT_DIRECTORY'
    if (error.message.includes('EEXIST')) return 'FILE_EXISTS'
    if (error.message.includes('parse')) return 'PARSE_ERROR'
    if (error.message.includes('syntax')) return 'SYNTAX_ERROR'
    if (error.message.includes('import')) return 'IMPORT_ERROR'
    if (error.message.includes('circular')) return 'CIRCULAR_DEPENDENCY'
    return 'UNKNOWN_ERROR'
  }

  /**
   * Determine appropriate recovery action based on error and context
   */
  private determineRecoveryAction(error: Error, context: ErrorContext): RecoveryAction {
    const errorCode = this.categorizeError(error)

    switch (errorCode) {
      case 'FILE_NOT_FOUND':
        return {
          type: 'skip',
          description: 'Skip missing file and continue with migration',
          autoExecute: true
        }

      case 'PERMISSION_DENIED':
        return {
          type: 'manual',
          description: 'Fix file permissions and retry manually',
          autoExecute: false
        }

      case 'DISK_SPACE_FULL':
        return {
          type: 'rollback',
          description: 'Insufficient disk space, rollback required',
          autoExecute: false
        }

      case 'PARSE_ERROR':
      case 'SYNTAX_ERROR':
        return {
          type: 'skip',
          description: 'Skip malformed file and continue',
          autoExecute: true
        }

      case 'IMPORT_ERROR':
        return {
          type: 'retry',
          description: 'Retry import resolution',
          autoExecute: true,
          maxRetries: 2
        }

      case 'CIRCULAR_DEPENDENCY':
        return {
          type: 'manual',
          description: 'Manual intervention required to resolve circular dependency',
          autoExecute: false
        }

      default:
        return {
          type: 'retry',
          description: 'Retry operation with exponential backoff',
          autoExecute: true,
          maxRetries: 3
        }
    }
  }

  /**
   * Determine error severity based on error type and context
   */
  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const errorCode = this.categorizeError(error)

    // Critical errors that require immediate rollback
    if (['DISK_SPACE_FULL', 'PERMISSION_DENIED'].includes(errorCode)) {
      return 'critical'
    }

    // High severity errors that may require manual intervention
    if (['CIRCULAR_DEPENDENCY', 'PARSE_ERROR'].includes(errorCode)) {
      return 'high'
    }

    // Medium severity errors that can be retried
    if (['IMPORT_ERROR', 'SYNTAX_ERROR'].includes(errorCode)) {
      return 'medium'
    }

    // Low severity errors that can be skipped
    return 'low'
  }

  /**
   * Generate comprehensive error report
   */
  async generateErrorReport(migrationId: string): Promise<string> {
    const report = {
      migrationId,
      timestamp: new Date(),
      totalErrors: this.errorLog.length,
      errorsBySeverity: {
        critical: this.errorLog.filter(e => e.severity === 'critical').length,
        high: this.errorLog.filter(e => e.severity === 'high').length,
        medium: this.errorLog.filter(e => e.severity === 'medium').length,
        low: this.errorLog.filter(e => e.severity === 'low').length
      },
      errorsByCategory: this.groupErrorsByCategory(),
      recoveryActions: this.summarizeRecoveryActions(),
      detailedErrors: this.errorLog.map(error => ({
        code: error.code,
        message: error.message,
        severity: error.severity,
        operation: error.context.operation,
        phase: error.context.phase,
        filePath: error.context.filePath,
        recoveryAction: error.recoveryAction.type,
        timestamp: error.context.timestamp
      }))
    }

    return JSON.stringify(report, null, 2)
  }

  /**
   * Group errors by category for reporting
   */
  private groupErrorsByCategory(): Record<string, number> {
    const categories: Record<string, number> = {}
    
    for (const error of this.errorLog) {
      categories[error.code] = (categories[error.code] || 0) + 1
    }

    return categories
  }

  /**
   * Summarize recovery actions taken
   */
  private summarizeRecoveryActions(): Record<string, number> {
    const actions: Record<string, number> = {}
    
    for (const error of this.errorLog) {
      const actionType = error.recoveryAction.type
      actions[actionType] = (actions[actionType] || 0) + 1
    }

    return actions
  }

  /**
   * Check if migration should be aborted based on error severity
   */
  shouldAbortMigration(): boolean {
    const criticalErrors = this.errorLog.filter(e => e.severity === 'critical').length
    const highErrors = this.errorLog.filter(e => e.severity === 'high').length
    
    // Abort if any critical errors or too many high severity errors
    return criticalErrors > 0 || highErrors > 5
  }

  /**
   * Get all errors for a specific operation
   */
  getErrorsForOperation(operation: string): MigrationError[] {
    return this.errorLog.filter(error => error.context.operation === operation)
  }

  /**
   * Clear error log (useful for testing or new migration attempts)
   */
  clearErrorLog(): void {
    this.errorLog = []
    this.recoveryAttempts.clear()
  }

  /**
   * Save error log to file for persistence
   */
  async saveErrorLog(migrationId: string): Promise<void> {
    const errorLogPath = path.join(process.cwd(), '.migration-backups', migrationId, 'error-log.json')
    const errorReport = await this.generateErrorReport(migrationId)
    
    await fs.mkdir(path.dirname(errorLogPath), { recursive: true })
    await fs.writeFile(errorLogPath, errorReport, 'utf-8')
    
    this.logger.info(`Error log saved to: ${errorLogPath}`)
  }
}

/**
 * Create error handling system instance
 */
export function createErrorHandlingSystem(
  config: MigrationConfig, 
  logger: MigrationLogger
): ErrorHandlingSystem {
  return new ErrorHandlingSystem(config, logger)
}