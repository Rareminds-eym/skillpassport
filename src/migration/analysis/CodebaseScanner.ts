import { promises as fs } from 'fs';
import path from 'path';
import { 
  APIFunction, 
  MigrationConfig, 
  MigrationLogger,
  PathChange 
} from '../types';

/**
 * Represents an import reference found in the codebase
 */
export interface ImportReference {
  /** File path containing the import */
  filePath: string;
  /** Line number where import is found */
  lineNumber: number;
  /** Column number where import starts */
  columnNumber: number;
  /** The complete import statement */
  importStatement: string;
  /** The import path being referenced */
  importPath: string;
  /** Type of import (named, default, namespace) */
  importType: 'named' | 'default' | 'namespace' | 'side-effect';
  /** Imported identifiers (function names, etc.) */
  importedIdentifiers: string[];
  /** Whether this is a relative or absolute import */
  pathType: 'relative' | 'absolute';
  /** The API function being referenced (if identified) */
  referencedFunction?: APIFunction;
}

/**
 * Results from scanning the codebase for import references
 */
export interface ScanResult {
  /** All import references found */
  references: ImportReference[];
  /** Files that were scanned */
  scannedFiles: string[];
  /** Files that couldn't be scanned due to errors */
  errorFiles: Array<{ filePath: string; error: string }>;
  /** Summary statistics */
  summary: {
    totalFiles: number;
    totalReferences: number;
    relativeImports: number;
    absoluteImports: number;
    namedImports: number;
    defaultImports: number;
    namespaceImports: number;
  };
}

/**
 * Scans the entire codebase for import references to migrated functions
 */
export class CodebaseScanner {
  private readonly sourceExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  private readonly excludedDirectories = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    '.nyc_output'
  ];

  constructor(
    private config: MigrationConfig,
    private logger: MigrationLogger
  ) {}

  /**
   * Scans the entire codebase for import references
   */
  async scanForImportReferences(
    migratedFunctions?: APIFunction[]
  ): Promise<ScanResult> {
    this.logger.info('Starting codebase scan for import references');
    
    const result: ScanResult = {
      references: [],
      scannedFiles: [],
      errorFiles: [],
      summary: {
        totalFiles: 0,
        totalReferences: 0,
        relativeImports: 0,
        absoluteImports: 0,
        namedImports: 0,
        defaultImports: 0,
        namespaceImports: 0
      }
    };

    try {
      // Find all source files
      const sourceFiles = await this.findSourceFiles();
      result.summary.totalFiles = sourceFiles.length;
      
      this.logger.info(`Found ${sourceFiles.length} source files to scan`);

      // Scan each file for import references
      for (const filePath of sourceFiles) {
        try {
          const references = await this.scanFileForImports(filePath, migratedFunctions);
          result.references.push(...references);
          result.scannedFiles.push(filePath);
          
          this.logger.debug(`Scanned ${filePath}: found ${references.length} imports`);
        } catch (error) {
          result.errorFiles.push({
            filePath,
            error: error.message
          });
          this.logger.warn(`Failed to scan ${filePath}`, { error });
        }
      }

      // Calculate summary statistics
      this.calculateSummaryStats(result);
      
      this.logger.info('Codebase scan completed', {
        totalFiles: result.summary.totalFiles,
        scannedFiles: result.scannedFiles.length,
        errorFiles: result.errorFiles.length,
        totalReferences: result.summary.totalReferences
      });

      return result;

    } catch (error) {
      this.logger.error('Codebase scan failed', { error });
      throw error;
    }
  }
  /**
   * Finds all source files in the project
   */
  private async findSourceFiles(): Promise<string[]> {
    const sourceFiles: string[] = [];
    await this.scanDirectory(this.config.projectRoot, sourceFiles);
    return sourceFiles;
  }

  /**
   * Recursively scans a directory for source files
   */
  private async scanDirectory(dirPath: string, sourceFiles: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip excluded directories
          if (!this.excludedDirectories.includes(entry.name)) {
            await this.scanDirectory(fullPath, sourceFiles);
          }
        } else if (entry.isFile()) {
          // Include files with source extensions
          const ext = path.extname(entry.name);
          if (this.sourceExtensions.includes(ext)) {
            sourceFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Could not scan directory ${dirPath}`, { error });
    }
  }

  /**
   * Scans a single file for import statements
   */
  private async scanFileForImports(
    filePath: string, 
    migratedFunctions?: APIFunction[]
  ): Promise<ImportReference[]> {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const references: ImportReference[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;
      
      // Find import statements in this line
      const importMatches = this.findImportStatements(line, lineNumber);
      
      for (const match of importMatches) {
        const reference = this.parseImportStatement(
          match, 
          filePath, 
          lineNumber, 
          migratedFunctions
        );
        
        if (reference) {
          references.push(reference);
        }
      }
    }

    return references;
  }

  /**
   * Finds import statements in a line of code
   */
  private findImportStatements(
    line: string, 
    lineNumber: number
  ): Array<{ statement: string; columnNumber: number }> {
    const matches: Array<{ statement: string; columnNumber: number }> = [];
    
    // Regular expressions for different import patterns
    const importPatterns = [
      // Named imports: import { name1, name2 } from 'path'
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]/g,
      // Default imports: import name from 'path'
      /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"]([^'"]+)['"]/g,
      // Namespace imports: import * as name from 'path'
      /import\s*\*\s*as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*from\s*['"]([^'"]+)['"]/g,
      // Side-effect imports: import 'path'
      /import\s*['"]([^'"]+)['"]/g,
      // Mixed imports: import name, { other } from 'path'
      /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]/g
    ];

    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        matches.push({
          statement: match[0],
          columnNumber: match.index + 1
        });
      }
    }

    return matches;
  }

  /**
   * Parses an import statement to extract detailed information
   */
  private parseImportStatement(
    match: { statement: string; columnNumber: number },
    filePath: string,
    lineNumber: number,
    migratedFunctions?: APIFunction[]
  ): ImportReference | null {
    const { statement, columnNumber } = match;
    
    // Extract import path
    const pathMatch = statement.match(/from\s*['"]([^'"]+)['"]/);
    if (!pathMatch) {
      // Handle side-effect imports
      const sideEffectMatch = statement.match(/import\s*['"]([^'"]+)['"]/);
      if (sideEffectMatch) {
        return {
          filePath,
          lineNumber,
          columnNumber,
          importStatement: statement,
          importPath: sideEffectMatch[1],
          importType: 'side-effect',
          importedIdentifiers: [],
          pathType: this.determinePathType(sideEffectMatch[1])
        };
      }
      return null;
    }

    const importPath = pathMatch[1];
    const pathType = this.determinePathType(importPath);
    
    // Determine import type and extract identifiers
    let importType: 'named' | 'default' | 'namespace' | 'side-effect';
    let importedIdentifiers: string[] = [];

    if (statement.includes('* as ')) {
      // Namespace import
      importType = 'namespace';
      const namespaceMatch = statement.match(/import\s*\*\s*as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (namespaceMatch) {
        importedIdentifiers = [namespaceMatch[1]];
      }
    } else if (statement.includes('{')) {
      // Named import (possibly with default)
      importType = 'named';
      
      // Extract default import if present
      const defaultMatch = statement.match(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,/);
      if (defaultMatch) {
        importedIdentifiers.push(defaultMatch[1]);
      }
      
      // Extract named imports
      const namedMatch = statement.match(/{\s*([^}]+)\s*}/);
      if (namedMatch) {
        const namedImports = namedMatch[1]
          .split(',')
          .map(item => item.trim())
          .map(item => {
            // Handle aliases: name as alias
            const aliasMatch = item.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
            return aliasMatch ? aliasMatch[1] : item;
          })
          .filter(item => item.length > 0);
        
        importedIdentifiers.push(...namedImports);
      }
    } else {
      // Default import
      importType = 'default';
      const defaultMatch = statement.match(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (defaultMatch) {
        importedIdentifiers = [defaultMatch[1]];
      }
    }

    // Try to match with migrated functions if provided
    let referencedFunction: APIFunction | undefined;
    if (migratedFunctions) {
      referencedFunction = this.findReferencedFunction(
        importPath, 
        importedIdentifiers, 
        migratedFunctions
      );
    }

    return {
      filePath,
      lineNumber,
      columnNumber,
      importStatement: statement,
      importPath,
      importType,
      importedIdentifiers,
      pathType,
      referencedFunction
    };
  }

  /**
   * Determines if an import path is relative or absolute
   */
  private determinePathType(importPath: string): 'relative' | 'absolute' {
    return importPath.startsWith('./') || importPath.startsWith('../') 
      ? 'relative' 
      : 'absolute';
  }

  /**
   * Attempts to find which migrated function is being referenced
   */
  private findReferencedFunction(
    importPath: string,
    importedIdentifiers: string[],
    migratedFunctions: APIFunction[]
  ): APIFunction | undefined {
    // Look for functions that match the imported identifiers
    for (const func of migratedFunctions) {
      if (importedIdentifiers.includes(func.name)) {
        // Additional validation could be added here to check if the import path
        // matches the original location of the function
        return func;
      }
    }
    
    return undefined;
  }

  /**
   * Calculates summary statistics for the scan result
   */
  private calculateSummaryStats(result: ScanResult): void {
    result.summary.totalReferences = result.references.length;
    
    for (const ref of result.references) {
      // Count by path type
      if (ref.pathType === 'relative') {
        result.summary.relativeImports++;
      } else {
        result.summary.absoluteImports++;
      }
      
      // Count by import type
      switch (ref.importType) {
        case 'named':
          result.summary.namedImports++;
          break;
        case 'default':
          result.summary.defaultImports++;
          break;
        case 'namespace':
          result.summary.namespaceImports++;
          break;
      }
    }
  }

  /**
   * Filters import references to only those referencing specific functions
   */
  filterReferencesByFunctions(
    references: ImportReference[],
    functionNames: string[]
  ): ImportReference[] {
    return references.filter(ref => 
      ref.importedIdentifiers.some(identifier => 
        functionNames.includes(identifier)
      )
    );
  }

  /**
   * Groups import references by file path
   */
  groupReferencesByFile(references: ImportReference[]): Map<string, ImportReference[]> {
    const grouped = new Map<string, ImportReference[]>();
    
    for (const ref of references) {
      const existing = grouped.get(ref.filePath) || [];
      existing.push(ref);
      grouped.set(ref.filePath, existing);
    }
    
    return grouped;
  }

  /**
   * Finds references to specific service files
   */
  async findServiceFileReferences(serviceFilePaths: string[]): Promise<ImportReference[]> {
    const scanResult = await this.scanForImportReferences();
    
    return scanResult.references.filter(ref => {
      // Check if the import path resolves to one of the service files
      return serviceFilePaths.some(servicePath => {
        const normalizedServicePath = path.normalize(servicePath);
        const resolvedImportPath = this.resolveImportPath(ref.filePath, ref.importPath);
        
        return resolvedImportPath && 
               path.normalize(resolvedImportPath).includes(normalizedServicePath);
      });
    });
  }

  /**
   * Resolves an import path relative to the importing file
   */
  private resolveImportPath(importingFile: string, importPath: string): string | null {
    try {
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        // Relative import
        const importingDir = path.dirname(importingFile);
        return path.resolve(importingDir, importPath);
      } else {
        // Absolute import - would need module resolution logic
        // For now, return the path as-is
        return importPath;
      }
    } catch {
      return null;
    }
  }
}