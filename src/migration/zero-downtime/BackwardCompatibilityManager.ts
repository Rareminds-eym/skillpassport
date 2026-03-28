/**
 * Manages backward compatibility through re-exports and path mapping
 */

import * as fs from 'fs'
import * as path from 'path'
import { BackwardCompatibilityConfig, ReExportConfig } from '@/shared/types/zero-downtime'

export class BackwardCompatibilityManager {
  private reExports: ReExportConfig[] = []
  private config: BackwardCompatibilityConfig

  constructor(config: BackwardCompatibilityConfig) {
    this.config = config
  }

  /**
   * Register a re-export for backward compatibility
   */
  registerReExport(reExport: ReExportConfig): void {
    this.reExports.push(reExport)
  }

  /**
   * Create re-export files to maintain backward compatibility
   */
  async createReExports(baseDir: string): Promise<void> {
    if (!this.config.maintainReExports) {
      return
    }

    for (const reExport of this.reExports) {
      await this.createReExportFile(baseDir, reExport)
    }
  }

  /**
   * Create a single re-export file
   */
  private async createReExportFile(
    baseDir: string,
    reExport: ReExportConfig
  ): Promise<void> {
    const oldFilePath = path.join(baseDir, reExport.oldPath)
    const oldDir = path.dirname(oldFilePath)

    // Ensure directory exists
    if (!fs.existsSync(oldDir)) {
      fs.mkdirSync(oldDir, { recursive: true })
    }

    // Calculate relative path from old to new location
    const relativePath = path.relative(oldDir, path.join(baseDir, reExport.newPath))
    const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`

    // Generate re-export content
    let content = `/**
 * @deprecated This file has been moved to ${reExport.newPath}
 * This re-export maintains backward compatibility during migration.
 */\n\n`

    if (reExport.deprecationMessage) {
      content += `console.warn('${reExport.deprecationMessage}');\n\n`
    }

    content += `export * from '${importPath.replace(/\\/g, '/')}';\n`

    // Write re-export file
    fs.writeFileSync(oldFilePath, content, 'utf-8')
  }

  /**
   * Remove re-exports after migration is complete
   */
  async removeReExports(baseDir: string): Promise<void> {
    for (const reExport of this.reExports) {
      const oldFilePath = path.join(baseDir, reExport.oldPath)
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath)
      }
    }
  }

  /**
   * Check if re-exports can be safely removed
   */
  async canRemoveReExports(baseDir: string): Promise<boolean> {
    // Check if any re-exports have passed their removal date
    const now = new Date()
    const expiredReExports = this.reExports.filter(
      re => re.removeAfter && re.removeAfter < now
    )

    if (expiredReExports.length === 0) {
      return false
    }

    // Check if old paths are still being imported
    for (const reExport of expiredReExports) {
      const hasActiveImports = await this.checkActiveImports(baseDir, reExport.oldPath)
      if (hasActiveImports) {
        return false
      }
    }

    return true
  }

  /**
   * Check if a path still has active imports
   */
  private async checkActiveImports(baseDir: string, oldPath: string): Promise<boolean> {
    // This would integrate with import analysis
    // For now, return false to be safe
    return false
  }

  /**
   * Generate backward compatibility report
   */
  generateReport(): {
    totalReExports: number
    activeReExports: number
    expiredReExports: number
    reExports: ReExportConfig[]
  } {
    const now = new Date()
    const expired = this.reExports.filter(re => re.removeAfter && re.removeAfter < now)

    return {
      totalReExports: this.reExports.length,
      activeReExports: this.reExports.length - expired.length,
      expiredReExports: expired.length,
      reExports: this.reExports
    }
  }

  /**
   * Register entity re-exports
   */
  registerEntityReExports(): void {
    const entities = ['user', 'course', 'organization', 'assessment', 'project', 'certificate', 'message', 'subscription']
    
    entities.forEach(entity => {
      this.registerReExport({
        oldPath: `src/components/${entity}/index.ts`,
        newPath: `src/entities/${entity}/index.ts`,
        deprecationMessage: `Import from @/entities/${entity} instead of old path`
      })
    })
  }

  /**
   * Register widget re-exports
   */
  registerWidgetReExports(): void {
    const widgets = ['dashboard', 'navigation', 'forms', 'data-tables']
    
    widgets.forEach(widget => {
      this.registerReExport({
        oldPath: `src/components/${widget}/index.ts`,
        newPath: `src/widgets/${widget}/index.ts`,
        deprecationMessage: `Import from @/widgets/${widget} instead of old path`
      })
    })
  }
}
