import { promises as fs } from 'fs';
import path from 'path';
import { 
  PathChange, 
  UpdateResult, 
  ImportUpdate, 
  FailedUpdate
} from '@/features/student-profile/model';

/**
 * Updates import paths throughout the codebase to reference new FSD locations
 */
export class ImportPathUpdater {
  constructor(
    private logger: { info: (msg: string, data?: any) => void; warn: (msg: string, data?: any) => void; error: (msg: string, data?: any) => void; debug: (msg: string, data?: any) => void },
    private projectRoot: string
  ) {}

  /**
   * Updates import paths for all provided changes
   */
  async updateImportPaths(changes: PathChange[]): Promise<UpdateResult> {
    const startTime = Date.now();
    const updatedFiles: string[] = [];
    const failedUpdates: FailedUpdate[] = [];
    const importUpdates: ImportUpdate[] = [];

    try {
      // Scan codebase for files that might contain imports
      const sourceFiles = await this.scanForSourceFiles();
      this.logger.info(`Found ${sourceFiles.length} source files to scan for imports`);
      
      // Process each source file
      for (const sourceFile of sourceFiles) {
        const fileUpdates = await this.updateFileImports(sourceFile, changes);
        if (fileUpdates.length > 0) {
          updatedFiles.push(sourceFile);
          importUpdates.push(...fileUpdates);
        }
      }

      const success = failedUpdates.length === 0;
      
      // Validate all updated imports
      if (success && importUpdates.length > 0) {
        this.logger.info('Validating updated import paths...');
        const validationSuccess = await this.validateImportPaths(importUpdates);
        if (!validationSuccess) {
          this.logger.warn('Some import paths may not resolve correctly');
        }
      }
      
      const duration = Date.now() - startTime;
      this.logger.info(`Import path update completed`, {
        updatedFiles: updatedFiles.length,
        totalUpdates: importUpdates.length,
        failedUpdates: failedUpdates.length,
        duration
      });

      return {
        success,
        updatedFiles,
        failedUpdates,
        totalUpdates: importUpdates.length,
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error('Import path update failed', { error: errorMessage });
      
      const duration = Date.now() - startTime;
      failedUpdates.push({
        filePath: '',
        import: '',
        reason: `Global update failed: ${errorMessage}`,
        suggestion: 'Check the error logs and try again'
      });

      return {
        success: false,
        updatedFiles,
        failedUpdates,
        totalUpdates: 0,
        duration
      };
    }
  }

  /**
   * Scans the codebase for source files that might contain imports
   */
  private async scanForSourceFiles(): Promise<string[]> {
    const sourceFiles: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    await this.scanDirectory(this.projectRoot, sourceFiles, extensions);
    
    // Filter out node_modules and other excluded directories
    return sourceFiles.filter(file => 
      !file.includes('node_modules') &&
      !file.includes('.git') &&
      !file.includes('dist') &&
      !file.includes('build')
    );
  }

  /**
   * Recursively scans a directory for source files
   */
  private async scanDirectory(
    dirPath: string, 
    sourceFiles: string[], 
    extensions: string[]
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, sourceFiles, extensions);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            sourceFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Could not scan directory ${dirPath}`, { error });
    }
  }

  /**
   * Updates imports in a single file
   */
  private async updateFileImports(
    filePath: string, 
    changes: PathChange[]
  ): Promise<ImportUpdate[]> {
    const importUpdates: ImportUpdate[] = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      let updatedContent = content;
      let hasChanges = false;

      // Process each path change
      for (const change of changes) {
        const updates = this.findAndUpdateImports(updatedContent, change, filePath);
        
        for (const update of updates) {
          updatedContent = updatedContent.replace(update.originalImport, update.newImport);
          hasChanges = true;
          
          importUpdates.push({
            filePath,
            oldImport: update.originalImport,
            newImport: update.newImport,
            lineNumber: this.findLineNumber(content, update.originalImport),
            success: true
          });
        }
      }

      // Write updated content if changes were made
      if (hasChanges) {
        await fs.writeFile(filePath, updatedContent, 'utf8');
        this.logger.debug(`Updated imports in ${filePath}`);
      }

      return importUpdates;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update imports in ${filePath}`, { error: errorMessage });
      
      return [{
        filePath,
        oldImport: '',
        newImport: '',
        lineNumber: 0,
        success: false
      }];
    }
  }

  /**
   * Finds the line number of an import statement in content
   */
  private findLineNumber(content: string, importStatement: string): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(importStatement)) {
        return i + 1;
      }
    }
    return 0;
  }

  /**
   * Finds and generates import updates for a specific path change
   */
  private findAndUpdateImports(
    content: string, 
    change: PathChange, 
    currentFile: string
  ): Array<{ originalImport: string; newImport: string }> {
    const updates: Array<{ originalImport: string; newImport: string }> = [];
    
    // Enhanced import patterns to match various import styles
    const importPatterns = [
      // Named imports with potential aliases: import { functionName, other as alias } from 'path'
      new RegExp(`import\\s*{([^}]*\\b${change.functionName}\\b[^}]*)}\\s*from\\s*(['"][^'"]+['"])`, 'g'),
      // Default imports: import functionName from 'path'
      new RegExp(`import\\s+${change.functionName}\\s+from\\s*(['"][^'"]+['"])`, 'g'),
      // Namespace imports: import * as name from 'path'
      new RegExp(`import\\s*\\*\\s*as\\s+(\\w+)\\s*from\\s*(['"][^'"]+['"])`, 'g'),
      // Mixed imports: import defaultName, { named } from 'path'
      new RegExp(`import\\s+(\\w+)\\s*,\\s*{([^}]*\\b${change.functionName}\\b[^}]*)}\\s*from\\s*(['"][^'"]+['"])`, 'g'),
      // Re-exports: export { functionName } from 'path'
      new RegExp(`export\\s*{([^}]*\\b${change.functionName}\\b[^}]*)}\\s*from\\s*(['"][^'"]+['"])`, 'g')
    ];

    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const fullMatch = match[0];
        const importPath = this.extractQuotedPath(fullMatch);
        
        // Check if this import path matches the old path
        if (this.isMatchingImportPath(importPath, change.oldPath)) {
          const newImportPath = this.generateNewImportPath(currentFile, change.newPath);
          const newImport = this.updateImportStatement(fullMatch, importPath, newImportPath);
          
          updates.push({ 
            originalImport: fullMatch, 
            newImport 
          });
        }
      }
    }

    return updates;
  }

  /**
   * Extracts the quoted path from an import statement
   */
  private extractQuotedPath(importStatement: string): string {
    const match = importStatement.match(/(['"])[^'"]+\1/);
    return match ? match[0].slice(1, -1) : '';
  }

  /**
   * Checks if an import path matches the old path being changed
   */
  private isMatchingImportPath(importPath: string, oldPath: string): boolean {
    // Normalize paths for comparison
    const normalizedImportPath = path.normalize(importPath);
    const normalizedOldPath = path.normalize(oldPath);
    
    // Handle relative paths
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // Check if the relative path resolves to the old path
      const baseName = path.basename(oldPath, path.extname(oldPath));
      return normalizedImportPath.includes(baseName) || 
             normalizedImportPath.endsWith(baseName);
    }
    
    // Handle absolute paths from project root
    if (importPath.startsWith('/') || !importPath.includes('./')) {
      // Remove file extensions for comparison
      const importWithoutExt = normalizedImportPath.replace(/\.(ts|tsx|js|jsx)$/, '');
      const oldWithoutExt = normalizedOldPath.replace(/\.(ts|tsx|js|jsx)$/, '');
      
      return importWithoutExt === oldWithoutExt || 
             importWithoutExt.endsWith(oldWithoutExt) ||
             oldWithoutExt.endsWith(importWithoutExt);
    }
    
    return false;
  }

  /**
   * Generates the new import path relative to the current file
   */
  private generateNewImportPath(currentFile: string, newPath: string): string {
    const currentDir = path.dirname(currentFile);
    
    // Remove file extension from newPath if it exists
    const newPathWithoutExt = newPath.replace(/\.(ts|tsx|js|jsx)$/, '');
    
    // Calculate relative path
    let relativePath = path.relative(currentDir, newPathWithoutExt);
    
    // Normalize path separators for cross-platform compatibility
    relativePath = relativePath.replace(/\\/g, '/');
    
    // Ensure the path starts with ./ for relative imports
    if (!relativePath.startsWith('.')) {
      relativePath = `./${relativePath}`;
    }
    
    return relativePath;
  }

  /**
   * Updates a specific import statement with preserved formatting
   */
  private updateImportStatement(
    importStatement: string, 
    oldPath: string, 
    newPath: string
  ): string {
    // Preserve the original quote style (single or double quotes)
    const quoteMatch = importStatement.match(/(['"])[^'"]+\1/);
    if (!quoteMatch) {
      return importStatement;
    }
    
    const quote = quoteMatch[1];
    const quotedOldPath = `${quote}${oldPath}${quote}`;
    const quotedNewPath = `${quote}${newPath}${quote}`;
    
    // Replace the path while preserving everything else
    return importStatement.replace(quotedOldPath, quotedNewPath);
  }

  /**
   * Validates that updated import paths resolve correctly
   */
  async validateImportPaths(updates: ImportUpdate[]): Promise<boolean> {
    let allValid = true;
    const validationResults: Array<{ file: string; import: string; valid: boolean; reason?: string }> = [];
    
    for (const update of updates) {
      try {
        const importPath = this.extractImportPath(update.newImport);
        if (!importPath) {
          validationResults.push({
            file: update.filePath,
            import: update.newImport,
            valid: false,
            reason: 'Could not extract import path'
          });
          allValid = false;
          continue;
        }

        const isValid = await this.validateSingleImportPath(update.filePath, importPath);
        validationResults.push({
          file: update.filePath,
          import: importPath,
          valid: isValid,
          reason: isValid ? undefined : 'File not found'
        });
        
        if (!isValid) {
          allValid = false;
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Could not validate import path for ${update.filePath}`, { error: errorMessage });
        validationResults.push({
          file: update.filePath,
          import: update.newImport,
          valid: false,
          reason: `Validation error: ${errorMessage}`
        });
        allValid = false;
      }
    }
    
    // Log validation summary
    const invalidCount = validationResults.filter(r => !r.valid).length;
    if (invalidCount > 0) {
      this.logger.warn(`${invalidCount} import paths failed validation`, {
        invalidPaths: validationResults.filter(r => !r.valid)
      });
    } else {
      this.logger.info(`All ${validationResults.length} import paths validated successfully`);
    }
    
    return allValid;
  }

  /**
   * Validates a single import path
   */
  private async validateSingleImportPath(importingFile: string, importPath: string): Promise<boolean> {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const resolvedPath = path.resolve(path.dirname(importingFile), importPath);
      return await this.fileExistsWithExtensions(resolvedPath);
    }
    
    // Handle absolute imports from project root
    const resolvedPath = path.resolve(this.projectRoot, importPath);
    return await this.fileExistsWithExtensions(resolvedPath);
  }

  /**
   * Checks if a file exists with common extensions or as a directory with index file
   */
  private async fileExistsWithExtensions(basePath: string): Promise<boolean> {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', ''];
    
    // Try direct file access with extensions
    for (const ext of extensions) {
      try {
        await fs.access(basePath + ext);
        return true;
      } catch {
        // Continue to next extension
      }
    }
    
    // Try as directory with index file
    const indexExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of indexExtensions) {
      try {
        await fs.access(path.join(basePath, `index${ext}`));
        return true;
      } catch {
        // Continue to next extension
      }
    }
    
    return false;
  }

  /**
   * Extracts the import path from an import statement
   */
  private extractImportPath(importStatement: string): string {
    const match = importStatement.match(/from\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  }
}