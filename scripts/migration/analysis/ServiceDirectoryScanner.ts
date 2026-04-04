/**
 * Service Directory Scanner - Implements recursive scanning of /services/ directory
 * 
 * This component scans the /services/ directory and catalogs all service files
 * and their metadata as required by Requirements 1.1.
 */

import { promises as fs } from 'fs'
import path from 'path'
import { ServiceFile, ExportDeclaration } from '@/shared/types/index.js'

export class ServiceDirectoryScanner {
  private servicesPath: string
  private excludePatterns: string[]

  constructor(servicesPath: string = 'src/services', excludePatterns: string[] = []) {
    this.servicesPath = servicesPath
    this.excludePatterns = [
      '__tests__',
      '*.test.ts',
      '*.test.js',
      '*.spec.ts', 
      '*.spec.js',
      'README.md',
      ...excludePatterns
    ]
  }

  /**
   * Scan the services directory and return all service files with metadata
   */
  async scanServices(): Promise<ServiceFile[]> {
    const serviceFiles: ServiceFile[] = []
    
    try {
      const exists = await this.directoryExists(this.servicesPath)
      if (!exists) {
        throw new Error(`Services directory not found: ${this.servicesPath}`)
      }

      await this.scanDirectory(this.servicesPath, serviceFiles)
      
      return serviceFiles.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      throw new Error(`Failed to scan services directory: ${error.message}`)
    }
  }

  /**
   * Recursively scan a directory for service files
   */
  private async scanDirectory(dirPath: string, serviceFiles: ServiceFile[]): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        // Skip excluded directories
        if (this.shouldExclude(entry.name)) {
          continue
        }
        
        // Recursively scan subdirectories
        await this.scanDirectory(fullPath, serviceFiles)
      } else if (entry.isFile()) {
        // Process service files
        if (this.isServiceFile(entry.name) && !this.shouldExclude(entry.name)) {
          const serviceFile = await this.processServiceFile(fullPath)
          if (serviceFile) {
            serviceFiles.push(serviceFile)
          }
        }
      }
    }
  }

  /**
   * Process a single service file and extract metadata
   */
  private async processServiceFile(filePath: string): Promise<ServiceFile | null> {
    try {
      const stats = await fs.stat(filePath)
      const content = await fs.readFile(filePath, 'utf-8')
      
      const relativePath = path.relative(process.cwd(), filePath)
      const fileName = path.basename(filePath, path.extname(filePath))
      
      const dependencies = this.extractDependencies(content)
      const exports = this.extractExports(content)

      return {
        path: relativePath,
        name: fileName,
        functions: [], // Will be populated by APIFunctionExtractor
        dependencies,
        exports,
        size: stats.size,
        lastModified: stats.mtime
      }
    } catch (error) {
      console.warn(`Failed to process service file ${filePath}: ${error.message}`)
      return null
    }
  }

  /**
   * Extract import dependencies from file content
   */
  private extractDependencies(content: string): string[] {
    const dependencies: string[] = []
    
    // Match ES6 imports
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"`]([^'"`]+)['"`]/g
    let match
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1]
      if (importPath && !importPath.startsWith('.') && !importPath.startsWith('/')) {
        dependencies.push(importPath)
      }
    }

    // Match CommonJS requires
    const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
    while ((match = requireRegex.exec(content)) !== null) {
      const requirePath = match[1]
      if (requirePath && !requirePath.startsWith('.') && !requirePath.startsWith('/')) {
        dependencies.push(requirePath)
      }
    }

    return [...new Set(dependencies)] // Remove duplicates
  }

  /**
   * Extract export declarations from file content
   */
  private extractExports(content: string): ExportDeclaration[] {
    const exports: ExportDeclaration[] = []
    
    // Match named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g
    let match
    
    while ((match = namedExportRegex.exec(content)) !== null) {
      const name = match[1]
      const type = this.determineExportType(content, name)
      
      exports.push({
        name,
        type,
        isDefault: false
      })
    }

    // Match export { ... } statements
    const exportBlockRegex = /export\s*\{\s*([^}]+)\s*\}/g
    while ((match = exportBlockRegex.exec(content)) !== null) {
      const exportList = match[1]
      const exportNames = exportList.split(',').map(name => name.trim().split(/\s+as\s+/)[0])
      
      for (const name of exportNames) {
        if (name && !exports.some(exp => exp.name === name)) {
          exports.push({
            name,
            type: this.determineExportType(content, name),
            isDefault: false
          })
        }
      }
    }

    // Match default exports
    const defaultExportRegex = /export\s+default\s+(?:(?:function|class)\s+(\w+)|(\w+))/g
    while ((match = defaultExportRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || 'default'
      
      exports.push({
        name,
        type: this.determineExportType(content, name),
        isDefault: true
      })
    }

    return exports
  }

  /**
   * Determine the type of an exported symbol
   */
  private determineExportType(content: string, name: string): ExportDeclaration['type'] {
    // Check for function declarations
    if (content.includes(`function ${name}`) || content.includes(`const ${name} = async`) || 
        content.includes(`const ${name} = (`) || content.includes(`${name}: async`)) {
      return 'function'
    }
    
    // Check for class declarations
    if (content.includes(`class ${name}`)) {
      return 'class'
    }
    
    // Check for interface declarations
    if (content.includes(`interface ${name}`)) {
      return 'interface'
    }
    
    // Check for type declarations
    if (content.includes(`type ${name}`)) {
      return 'type'
    }
    
    // Default to const for other cases
    return 'const'
  }

  /**
   * Check if a file is a service file based on extension
   */
  private isServiceFile(fileName: string): boolean {
    const serviceExtensions = ['.js', '.ts', '.jsx', '.tsx']
    const ext = path.extname(fileName).toLowerCase()
    return serviceExtensions.includes(ext)
  }

  /**
   * Check if a file or directory should be excluded
   */
  private shouldExclude(name: string): boolean {
    return this.excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
        return regex.test(name)
      }
      return name === pattern
    })
  }

  /**
   * Check if a directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath)
      return stats.isDirectory()
    } catch {
      return false
    }
  }

  /**
   * Get statistics about the scanned services
   */
  async getServiceStatistics(): Promise<{
    totalFiles: number
    totalSize: number
    fileTypes: Record<string, number>
    lastModified: Date | null
  }> {
    const serviceFiles = await this.scanServices()
    
    const stats = {
      totalFiles: serviceFiles.length,
      totalSize: serviceFiles.reduce((sum, file) => sum + file.size, 0),
      fileTypes: {} as Record<string, number>,
      lastModified: null as Date | null
    }

    // Count file types
    for (const file of serviceFiles) {
      const ext = path.extname(file.path)
      stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1
    }

    // Find most recent modification
    if (serviceFiles.length > 0) {
      stats.lastModified = serviceFiles.reduce((latest, file) => 
        file.lastModified > latest ? file.lastModified : latest, 
        serviceFiles[0].lastModified
      )
    }

    return stats
  }
}

/**
 * Create a new service directory scanner
 */
export function createServiceDirectoryScanner(
  servicesPath?: string, 
  excludePatterns?: string[]
): ServiceDirectoryScanner {
  return new ServiceDirectoryScanner(servicesPath, excludePatterns)
}