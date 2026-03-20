import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { MigrationLogger } from '../logging/MigrationLogger';
import {
  ImportStatement,
  ImportViolation,
  RefactoringResult,
  RefactoringChange
} from '../types/import-path';

export class ImportPathRefactorer {
  private logger: MigrationLogger;
  private sourceRoot: string;

  constructor(logger: MigrationLogger, sourceRoot: string = 'src') {
    this.logger = logger;
    this.sourceRoot = sourceRoot;
  }

  async refactorImportPaths(violations: ImportViolation[]): Promise<RefactoringResult> {
    this.logger.info('Starting import path refactoring', { violationCount: violations.length });

    const changes: RefactoringChange[] = [];
    const errors: string[] = [];
    const filesModified = new Set<string>();

    // Group violations by file for efficient processing
    const violationsByFile = this.groupViolationsByFile(violations);

    for (const [filePath, fileViolations] of Object.entries(violationsByFile)) {
      try {
        const fileChanges = await this.refactorFile(filePath, fileViolations);
        changes.push(...fileChanges);
        if (fileChanges.length > 0) {
          filesModified.add(filePath);
        }
      } catch (error) {
        const errorMsg = `Failed to refactor ${filePath}: ${error.message}`;
        this.logger.error(errorMsg, { error });
        errors.push(errorMsg);
      }
    }

    const result: RefactoringResult = {
      success: errors.length === 0,
      changes,
      filesModified: Array.from(filesModified),
      errors,
      statistics: {
        totalChanges: changes.length,
        filesModified: filesModified.size,
        changesByType: this.groupChangesByType(changes)
      }
    };

    this.logger.info('Import path refactoring completed', {
      totalChanges: result.changes.length,
      filesModified: result.filesModified.length,
      errors: errors.length
    });

    return result;
  }

  private async refactorFile(
    filePath: string,
    violations: ImportViolation[]
  ): Promise<RefactoringChange[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const changes: RefactoringChange[] = [];
    let modifiedContent = content;

    // Sort violations by line number in reverse order to avoid offset issues
    const sortedViolations = [...violations].sort((a, b) => b.line - a.line);

    for (const violation of sortedViolations) {
      if (!violation.suggestion) {
        continue;
      }

      const change = this.createChange(violation, sourceFile, modifiedContent);
      if (change) {
        modifiedContent = this.applyChange(modifiedContent, change);
        changes.push(change);
      }
    }

    // Write the modified content back to the file
    if (changes.length > 0) {
      fs.writeFileSync(filePath, modifiedContent, 'utf-8');
      this.logger.debug(`Refactored ${changes.length} imports in ${filePath}`);
    }

    return changes;
  }

  private createChange(
    violation: ImportViolation,
    sourceFile: ts.SourceFile,
    content: string
  ): RefactoringChange | null {
    // Find the import statement at the specified line
    const lines = content.split('\n');
    const lineIndex = violation.line - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      this.logger.warn(`Invalid line number ${violation.line} in ${violation.filePath}`);
      return null;
    }

    const originalLine = lines[lineIndex];
    const importPathRegex = new RegExp(`['"]${this.escapeRegex(violation.importPath)}['"]`);
    
    if (!importPathRegex.test(originalLine)) {
      this.logger.warn(`Import path not found on line ${violation.line} in ${violation.filePath}`);
      return null;
    }

    const newLine = originalLine.replace(
      importPathRegex,
      `'${violation.suggestion}'`
    );

    return {
      filePath: violation.filePath,
      line: violation.line,
      changeType: violation.type,
      oldImport: violation.importPath,
      newImport: violation.suggestion,
      oldLine: originalLine,
      newLine
    };
  }

  private applyChange(content: string, change: RefactoringChange): string {
    const lines = content.split('\n');
    const lineIndex = change.line - 1;

    if (lineIndex >= 0 && lineIndex < lines.length) {
      lines[lineIndex] = change.newLine;
    }

    return lines.join('\n');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private groupViolationsByFile(violations: ImportViolation[]): Record<string, ImportViolation[]> {
    const grouped: Record<string, ImportViolation[]> = {};

    for (const violation of violations) {
      if (!grouped[violation.filePath]) {
        grouped[violation.filePath] = [];
      }
      grouped[violation.filePath].push(violation);
    }

    return grouped;
  }

  private groupChangesByType(changes: RefactoringChange[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const change of changes) {
      grouped[change.changeType] = (grouped[change.changeType] || 0) + 1;
    }

    return grouped;
  }

  async refactorSpecificViolationType(
    violations: ImportViolation[],
    violationType: string
  ): Promise<RefactoringResult> {
    const filteredViolations = violations.filter(v => v.type === violationType);
    return this.refactorImportPaths(filteredViolations);
  }

  async convertRelativeToAbsolute(filePaths: string[]): Promise<RefactoringResult> {
    this.logger.info('Converting relative imports to absolute', { fileCount: filePaths.length });

    const changes: RefactoringChange[] = [];
    const errors: string[] = [];
    const filesModified = new Set<string>();

    for (const filePath of filePaths) {
      try {
        const fileChanges = await this.convertFileRelativeToAbsolute(filePath);
        changes.push(...fileChanges);
        if (fileChanges.length > 0) {
          filesModified.add(filePath);
        }
      } catch (error) {
        const errorMsg = `Failed to convert ${filePath}: ${error.message}`;
        this.logger.error(errorMsg, { error });
        errors.push(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      changes,
      filesModified: Array.from(filesModified),
      errors,
      statistics: {
        totalChanges: changes.length,
        filesModified: filesModified.size,
        changesByType: { 'relative-to-absolute': changes.length }
      }
    };
  }

  private async convertFileRelativeToAbsolute(filePath: string): Promise<RefactoringChange[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const changes: RefactoringChange[] = [];
    let modifiedContent = content;

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const importPath = moduleSpecifier.text;
          
          // Only convert relative imports to internal files
          if (importPath.startsWith('.') || importPath.startsWith('..')) {
            const absolutePath = this.convertToAbsolutePath(importPath, filePath);
            
            if (absolutePath !== importPath) {
              const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
              const lines = modifiedContent.split('\n');
              const lineIndex = line - 1;
              
              if (lineIndex >= 0 && lineIndex < lines.length) {
                const oldLine = lines[lineIndex];
                const newLine = oldLine.replace(
                  new RegExp(`['"]${this.escapeRegex(importPath)}['"]`),
                  `'${absolutePath}'`
                );
                
                lines[lineIndex] = newLine;
                modifiedContent = lines.join('\n');
                
                changes.push({
                  filePath,
                  line,
                  changeType: 'relative-to-absolute',
                  oldImport: importPath,
                  newImport: absolutePath,
                  oldLine,
                  newLine
                });
              }
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    if (changes.length > 0) {
      fs.writeFileSync(filePath, modifiedContent, 'utf-8');
    }

    return changes;
  }

  private convertToAbsolutePath(relativePath: string, fromFile: string): string {
    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(fromDir, relativePath);
    const relativeToCwd = path.relative(process.cwd(), resolvedPath);
    
    // Convert to @ alias format
    if (relativeToCwd.startsWith('src/') || relativeToCwd.startsWith('src\\')) {
      return '@/' + relativeToCwd.substring(4).replace(/\\/g, '/');
    }

    return relativePath;
  }
}
