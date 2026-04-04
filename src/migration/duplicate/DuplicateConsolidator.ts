/**
 * Duplicate Code Consolidator
 * Main system for consolidating duplicate code
 */

import * as fs from 'fs';
import * as path from 'path';
import { DuplicateScanner } from './DuplicateScanner';
import { SemanticAnalyzer } from './SemanticAnalyzer';
import { ConsolidationStrategy } from './ConsolidationStrategy';
import type {
  DuplicateGroup,
  ConsolidationResult,
  ConsolidationReport,
  ImportPathUpdate,
} from '@/features/student-profile/model';

export class DuplicateConsolidator {
  private scanner: DuplicateScanner;
  private analyzer: SemanticAnalyzer;
  private strategy: ConsolidationStrategy;

  constructor() {
    this.scanner = new DuplicateScanner();
    this.analyzer = new SemanticAnalyzer();
    this.strategy = new ConsolidationStrategy();
  }

  /**
   * Scan for duplicates in specified directories
   */
  async scanForDuplicates(directories: string[]) {
    return this.scanner.scanForDuplicates(directories);
  }

  /**
   * Consolidate all duplicate groups
   */
  async consolidateAll(
    duplicateGroups: DuplicateGroup[]
  ): Promise<ConsolidationReport> {
    const results: ConsolidationResult[] = [];
    const errors: Array<{ duplicateGroupId: string; error: string }> = [];

    for (const group of duplicateGroups) {
      try {
        // Analyze semantic equivalence
        const analysis = await this.analyzer.analyzeSemantic(group.codeBlocks);

        // Only consolidate if safe
        if (!this.analyzer.isSafeToConsolidate(analysis)) {
          errors.push({
            duplicateGroupId: group.id,
            error: `Not safe to consolidate (confidence: ${analysis.confidence})`,
          });
          continue;
        }

        // Determine canonical location
        const canonicalLocation = this.strategy.determineCanonicalLocation(group);
        group.canonicalLocation = canonicalLocation;

        // Determine strategy
        group.consolidationStrategy = this.strategy.determineStrategy(group);

        // Perform consolidation
        const result = await this.consolidateDuplicates(group);
        results.push(result);
      } catch (error) {
        errors.push({
          duplicateGroupId: group.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return this.generateReport(results, errors);
  }

  /**
   * Consolidate a single duplicate group
   */
  async consolidateDuplicates(group: DuplicateGroup): Promise<ConsolidationResult> {
    const errors: string[] = [];
    const updatedFiles: string[] = [];
    const importPathUpdates: ImportPathUpdate[] = [];

    try {
      // Ensure canonical location directory exists
      const canonicalDir = path.dirname(group.canonicalLocation);
      if (!fs.existsSync(canonicalDir)) {
        fs.mkdirSync(canonicalDir, { recursive: true });
      }

      // Extract the canonical code (use first block as reference)
      const canonicalCode = group.codeBlocks[0].code;

      // Write to canonical location
      await this.writeToCanonicalLocation(
        group.canonicalLocation,
        canonicalCode,
        group
      );

      // Update all files that had duplicates
      for (const block of group.codeBlocks) {
        try {
          const updates = await this.updateFileReferences(
            block.file,
            block,
            group.canonicalLocation
          );
          importPathUpdates.push(...updates);
          updatedFiles.push(block.file);
        } catch (error) {
          errors.push(
            `Failed to update ${block.file}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      // Calculate code reduction
      const linesRemoved = group.codeBlocks
        .slice(1)
        .reduce((sum, block) => sum + (block.endLine - block.startLine + 1), 0);

      return {
        success: errors.length === 0,
        duplicateGroup: group,
        canonicalFile: group.canonicalLocation,
        updatedFiles,
        importPathUpdates,
        codeReduction: {
          linesRemoved,
          filesAffected: updatedFiles.length,
          percentageReduction: this.calculateReductionPercentage(
            linesRemoved,
            updatedFiles
          ),
        },
        errors,
      };
    } catch (error) {
      return {
        success: false,
        duplicateGroup: group,
        canonicalFile: group.canonicalLocation,
        updatedFiles: [],
        importPathUpdates: [],
        codeReduction: {
          linesRemoved: 0,
          filesAffected: 0,
          percentageReduction: 0,
        },
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Write code to canonical location
   */
  private async writeToCanonicalLocation(
    location: string,
    code: string,
    group: DuplicateGroup
  ): Promise<void> {
    let content = '';

    // Check if file exists
    if (fs.existsSync(location)) {
      content = fs.readFileSync(location, 'utf-8');
    } else {
      // Create new file with header
      content = `/**\n * Shared Utilities\n * Consolidated from duplicate code\n */\n\n`;
    }

    // Extract function name
    const functionName = this.extractFunctionName(code);

    // Check if function already exists
    if (content.includes(`export const ${functionName}`) || 
        content.includes(`export function ${functionName}`)) {
      return; // Already exists, skip
    }

    // Append the code
    content += '\n' + code + '\n';

    fs.writeFileSync(location, content, 'utf-8');
  }

  /**
   * Update file references to use canonical location
   */
  private async updateFileReferences(
    file: string,
    block: { startLine: number; endLine: number; code: string },
    canonicalLocation: string
  ): Promise<ImportPathUpdate[]> {
    const updates: ImportPathUpdate[] = [];

    if (!fs.existsSync(file)) {
      return updates;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // Extract function name
    const functionName = this.extractFunctionName(block.code);

    // Remove the duplicate function
    const newLines = [
      ...lines.slice(0, block.startLine),
      ...lines.slice(block.endLine + 1),
    ];

    // Add import if not already present
    const importPath = this.strategy.generateImportPath(canonicalLocation, file);
    const importStatement = `import { ${functionName} } from '${importPath}';`;

    // Check if import already exists
    const hasImport = newLines.some(line => 
      line.includes(`import`) && line.includes(functionName)
    );

    if (!hasImport) {
      // Find where to insert import (after existing imports)
      let insertIndex = 0;
      for (let i = 0; i < newLines.length; i++) {
        if (newLines[i].trim().startsWith('import')) {
          insertIndex = i + 1;
        } else if (insertIndex > 0 && newLines[i].trim() !== '') {
          break;
        }
      }

      newLines.splice(insertIndex, 0, importStatement);

      updates.push({
        file,
        oldImport: '',
        newImport: importStatement,
        line: insertIndex,
      });
    }

    // Write updated content
    fs.writeFileSync(file, newLines.join('\n'), 'utf-8');

    return updates;
  }

  /**
   * Extract function name from code
   */
  private extractFunctionName(code: string): string {
    const match = code.match(/(?:export\s+)?(?:const|function)\s+(\w+)/);
    return match ? match[1] : '';
  }

  /**
   * Calculate reduction percentage
   */
  private calculateReductionPercentage(
    linesRemoved: number,
    files: string[]
  ): number {
    const totalLines = files.reduce((sum, file) => {
      if (!fs.existsSync(file)) return sum;
      const content = fs.readFileSync(file, 'utf-8');
      return sum + content.split('\n').length;
    }, 0);

    return totalLines > 0 ? (linesRemoved / totalLines) * 100 : 0;
  }

  /**
   * Generate consolidation report
   */
  private generateReport(
    results: ConsolidationResult[],
    errors: Array<{ duplicateGroupId: string; error: string }>
  ): ConsolidationReport {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const totalLinesRemoved = successful.reduce(
      (sum, r) => sum + r.codeReduction.linesRemoved,
      0
    );

    const totalFilesAffected = new Set(
      successful.flatMap(r => r.updatedFiles)
    ).size;

    const avgPercentage =
      successful.length > 0
        ? successful.reduce((sum, r) => sum + r.codeReduction.percentageReduction, 0) /
          successful.length
        : 0;

    return {
      totalConsolidations: results.length,
      successfulConsolidations: successful.length,
      failedConsolidations: failed.length + errors.length,
      codeReduction: {
        totalLinesRemoved,
        totalFilesAffected,
        percentageReduction: avgPercentage,
      },
      consolidations: results,
      errors,
    };
  }
}
