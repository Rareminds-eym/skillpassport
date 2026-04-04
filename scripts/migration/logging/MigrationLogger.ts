/**
 * Migration Logger - Comprehensive logging system for FSD Phase 5 migration
 * 
 * Provides structured logging with different levels, context tracking,
 * and integration with backup and rollback systems.
 */

import { 
  MigrationLog, 
  LogEntry, 
  MigrationPhase, 
  MigrationSummary,
  MigrationConfig 
} from '@/shared/types/index.js'

export class MigrationLogger {
  private log: MigrationLog
  private config: MigrationConfig

  constructor(migrationId: string, config: MigrationConfig) {
    this.config = config
    this.log = {
      migrationId,
      startTime: new Date(),
      phase: 'analysis',
      entries: [],
      summary: {
        totalFiles: 0,
        migratedFiles: 0,
        totalFunctions: 0,
        migratedFunctions: 0,
        sharedFunctions: 0,
        storeIntegrations: 0,
        errors: 0,
        warnings: 0,
        duration: 0
      }
    }
  }

  /**
   * Set the current migration phase
   */
  setPhase(phase: MigrationPhase): void {
    this.log.phase = phase
    this.info(`Migration phase changed to: ${phase}`)
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>, file?: string, functionName?: string): void {
    if (this.config.logLevel === 'debug') {
      this.addEntry('debug', message, context, file, functionName)
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>, file?: string, functionName?: string): void {
    if (['debug', 'info'].includes(this.config.logLevel)) {
      this.addEntry('info', message, context, file, functionName)
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>, file?: string, functionName?: string): void {
    if (['debug', 'info', 'warn'].includes(this.config.logLevel)) {
      this.addEntry('warn', message, context, file, functionName)
      this.log.summary.warnings++
    }
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>, file?: string, functionName?: string): void {
    this.addEntry('error', message, context, file, functionName)
    this.log.summary.errors++
  }

  /**
   * Update migration summary statistics
   */
  updateSummary(updates: Partial<MigrationSummary>): void {
    this.log.summary = { ...this.log.summary, ...updates }
  }

  /**
   * Complete the migration log
   */
  complete(): MigrationLog {
    this.log.endTime = new Date()
    this.log.summary.duration = this.log.endTime.getTime() - this.log.startTime.getTime()
    
    this.info('Migration completed', {
      duration: this.log.summary.duration,
      totalFiles: this.log.summary.totalFiles,
      migratedFiles: this.log.summary.migratedFiles,
      errors: this.log.summary.errors,
      warnings: this.log.summary.warnings
    })

    return this.log
  }

  /**
   * Get current log state
   */
  getLog(): MigrationLog {
    return { ...this.log }
  }

  /**
   * Export log to JSON string
   */
  exportToJson(): string {
    return JSON.stringify(this.log, null, 2)
  }

  /**
   * Export log to formatted text
   */
  exportToText(): string {
    const lines: string[] = []
    
    lines.push(`Migration Log: ${this.log.migrationId}`)
    lines.push(`Start Time: ${this.log.startTime.toISOString()}`)
    lines.push(`End Time: ${this.log.endTime?.toISOString() || 'In Progress'}`)
    lines.push(`Phase: ${this.log.phase}`)
    lines.push('')
    
    lines.push('Summary:')
    lines.push(`  Total Files: ${this.log.summary.totalFiles}`)
    lines.push(`  Migrated Files: ${this.log.summary.migratedFiles}`)
    lines.push(`  Total Functions: ${this.log.summary.totalFunctions}`)
    lines.push(`  Migrated Functions: ${this.log.summary.migratedFunctions}`)
    lines.push(`  Shared Functions: ${this.log.summary.sharedFunctions}`)
    lines.push(`  Store Integrations: ${this.log.summary.storeIntegrations}`)
    lines.push(`  Errors: ${this.log.summary.errors}`)
    lines.push(`  Warnings: ${this.log.summary.warnings}`)
    lines.push(`  Duration: ${this.log.summary.duration}ms`)
    lines.push('')
    
    lines.push('Log Entries:')
    for (const entry of this.log.entries) {
      const timestamp = entry.timestamp.toISOString()
      const level = entry.level.toUpperCase().padEnd(5)
      const file = entry.file ? ` [${entry.file}]` : ''
      const func = entry.function ? ` ${entry.function}()` : ''
      const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
      
      lines.push(`${timestamp} ${level}${file}${func} ${entry.message}${context}`)
    }
    
    return lines.join('\n')
  }

  /**
   * Filter log entries by level
   */
  getEntriesByLevel(level: LogEntry['level']): LogEntry[] {
    return this.log.entries.filter(entry => entry.level === level)
  }

  /**
   * Filter log entries by file
   */
  getEntriesByFile(file: string): LogEntry[] {
    return this.log.entries.filter(entry => entry.file === file)
  }

  /**
   * Get recent entries (last N entries)
   */
  getRecentEntries(count: number = 10): LogEntry[] {
    return this.log.entries.slice(-count)
  }

  /**
   * Add a log entry
   */
  private addEntry(
    level: LogEntry['level'], 
    message: string, 
    context?: Record<string, any>, 
    file?: string, 
    functionName?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      file,
      function: functionName
    }
    
    this.log.entries.push(entry)
    
    // Also output to console for immediate feedback
    this.outputToConsole(entry)
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const file = entry.file ? ` [${entry.file}]` : ''
    const func = entry.function ? ` ${entry.function}()` : ''
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    
    const message = `${timestamp}${file}${func} ${entry.message}${context}`
    
    switch (entry.level) {
      case 'debug':
        console.debug(`🔍 ${message}`)
        break
      case 'info':
        console.info(`ℹ️  ${message}`)
        break
      case 'warn':
        console.warn(`⚠️  ${message}`)
        break
      case 'error':
        console.error(`❌ ${message}`)
        break
    }
  }
}

/**
 * Create a new migration logger instance
 */
export function createMigrationLogger(migrationId: string, config: MigrationConfig): MigrationLogger {
  return new MigrationLogger(migrationId, config)
}

/**
 * Generate a unique migration ID
 */
export function generateMigrationId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const random = Math.random().toString(36).substring(2, 8)
  return `migration-${timestamp}-${random}`
}