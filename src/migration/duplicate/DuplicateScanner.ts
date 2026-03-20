/**
 * Duplicate Code Scanner
 * Scans codebase for duplicate or similar code blocks
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { DuplicateGroup, CodeBlock, DuplicateScanResult } from './types';

export class DuplicateScanner {
  private fileCache: Map<string, string> = new Map();
  private codeBlockCache: Map<string, CodeBlock[]> = new Map();

  /**
   * Scan for duplicate code in specified directories
   */
  async scanForDuplicates(
    directories: string[],
    options: {
      minSimilarity?: number;
      minLines?: number;
      filePattern?: RegExp;
    } = {}
  ): Promise<DuplicateScanResult> {
    const startTime = Date.now();
    const {
      minSimilarity = 0.8,
      minLines = 5,
      filePattern = /\.(ts|tsx)$/,
    } = options;

    const files = this.collectFiles(directories, filePattern);
    const codeBlocks = await this.extractCodeBlocks(files, minLines);
    const duplicateGroups = this.findDuplicates(codeBlocks, minSimilarity);

    const totalLines = duplicateGroups.reduce(
      (sum, group) => sum + this.calculateDuplicateLines(group),
      0
    );

    return {
      totalDuplicates: duplicateGroups.length,
      duplicateGroups,
      potentialSavings: {
        totalLines,
        estimatedPercentage: this.calculateSavingsPercentage(totalLines, files),
      },
      scanMetadata: {
        filesScanned: files.length,
        timeElapsed: Date.now() - startTime,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Collect all files matching pattern from directories
   */
  private collectFiles(directories: string[], pattern: RegExp): string[] {
    const files: string[] = [];

    const walkDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            walkDir(fullPath);
          }
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    };

    directories.forEach(walkDir);
    return files;
  }

  /**
   * Extract code blocks from files
   */
  private async extractCodeBlocks(
    files: string[],
    minLines: number
  ): Promise<CodeBlock[]> {
    const blocks: CodeBlock[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      this.fileCache.set(file, content);

      const lines = content.split('\n');
      const fileBlocks = this.extractFunctions(file, lines, minLines);
      blocks.push(...fileBlocks);
    }

    return blocks;
  }

  /**
   * Extract function-level code blocks
   */
  private extractFunctions(
    file: string,
    lines: string[],
    minLines: number
  ): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    let currentBlock: string[] = [];
    let startLine = 0;
    let braceCount = 0;
    let inFunction = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect function start
      if (
        !inFunction &&
        (trimmed.startsWith('export const') ||
          trimmed.startsWith('export function') ||
          trimmed.startsWith('const') ||
          trimmed.startsWith('function'))
      ) {
        inFunction = true;
        startLine = i;
        currentBlock = [line];
        braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        continue;
      }

      if (inFunction) {
        currentBlock.push(line);
        braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

        // Function complete
        if (braceCount === 0 && currentBlock.length >= minLines) {
          const code = currentBlock.join('\n');
          blocks.push({
            file,
            startLine,
            endLine: i,
            code,
            hash: this.hashCode(code),
          });
          inFunction = false;
          currentBlock = [];
        } else if (braceCount === 0) {
          inFunction = false;
          currentBlock = [];
        }
      }
    }

    return blocks;
  }

  /**
   * Find duplicate code blocks
   */
  private findDuplicates(
    blocks: CodeBlock[],
    minSimilarity: number
  ): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < blocks.length; i++) {
      if (processed.has(blocks[i].hash)) continue;

      const similar: CodeBlock[] = [blocks[i]];

      for (let j = i + 1; j < blocks.length; j++) {
        if (processed.has(blocks[j].hash)) continue;

        const similarity = this.calculateSimilarity(blocks[i], blocks[j]);
        if (similarity >= minSimilarity) {
          similar.push(blocks[j]);
          processed.add(blocks[j].hash);
        }
      }

      if (similar.length > 1) {
        processed.add(blocks[i].hash);
        groups.push({
          id: `dup-${groups.length + 1}`,
          files: [...new Set(similar.map(b => b.file))],
          similarity: this.calculateGroupSimilarity(similar),
          canonicalLocation: '', // Will be determined by consolidation strategy
          consolidationStrategy: 'extract',
          codeBlocks: similar,
        });
      }
    }

    return groups;
  }

  /**
   * Calculate similarity between two code blocks
   */
  private calculateSimilarity(block1: CodeBlock, block2: CodeBlock): number {
    // Exact match
    if (block1.hash === block2.hash) return 1.0;

    // Normalize code for comparison
    const norm1 = this.normalizeCode(block1.code);
    const norm2 = this.normalizeCode(block2.code);

    if (norm1 === norm2) return 0.95;

    // Calculate Levenshtein-based similarity
    const distance = this.levenshteinDistance(norm1, norm2);
    const maxLength = Math.max(norm1.length, norm2.length);
    return 1 - distance / maxLength;
  }

  /**
   * Normalize code for comparison (remove whitespace, comments)
   */
  private normalizeCode(code: string): string {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*/g, '') // Remove line comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate average similarity for a group
   */
  private calculateGroupSimilarity(blocks: CodeBlock[]): number {
    if (blocks.length < 2) return 1.0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        totalSimilarity += this.calculateSimilarity(blocks[i], blocks[j]);
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 1.0;
  }

  /**
   * Hash code for quick comparison
   */
  private hashCode(code: string): string {
    const normalized = this.normalizeCode(code);
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Calculate total duplicate lines in a group
   */
  private calculateDuplicateLines(group: DuplicateGroup): number {
    // Count lines in all but one instance (the canonical one)
    return group.codeBlocks
      .slice(1)
      .reduce((sum, block) => sum + (block.endLine - block.startLine + 1), 0);
  }

  /**
   * Calculate savings percentage
   */
  private calculateSavingsPercentage(duplicateLines: number, files: string[]): number {
    const totalLines = files.reduce((sum, file) => {
      const content = this.fileCache.get(file);
      return sum + (content ? content.split('\n').length : 0);
    }, 0);

    return totalLines > 0 ? (duplicateLines / totalLines) * 100 : 0;
  }
}
