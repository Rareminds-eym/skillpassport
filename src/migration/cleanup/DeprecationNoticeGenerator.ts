import { promises as fs } from 'fs';
import * as path from 'path';
import { MigrationLogger } from '../logging/MigrationLogger';
import { ServiceFile } from '../types';

/**
 * Generates deprecation notices for legacy service files
 */
export class DeprecationNoticeGenerator {
  private logger: MigrationLogger;
  private projectRoot: string;

  constructor(projectRoot: string, logger: MigrationLogger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
  }

  /**
   * Creates deprecation notices for all preserved service files
   */
  async createDeprecationNotices(preservedFiles: string[]): Promise<string[]> {
    const notices: string[] = [];
    const servicesPath = path.join(this.projectRoot, 'src', 'services');

    for (const fileName of preservedFiles) {
      try {
        const filePath = path.join(servicesPath, fileName);
        const noticePath = await this.addDeprecationNotice(filePath);
        notices.push(noticePath);
        this.logger.info(`Added deprecation notice to ${fileName}`);
      } catch (error) {
        this.logger.error(`Failed to add deprecation notice to ${fileName}: ${error.message}`);
      }
    }

    return notices;
  }

  /**
   * Adds a deprecation notice to a specific file
   */
  private async addDeprecationNotice(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    // Check if file already has deprecation notice
    if (this.hasDeprecationNotice(content)) {
      this.logger.debug(`File ${fileName} already has deprecation notice`);
      return filePath;
    }

    // Analyze file to generate appropriate notice
    const analysis = this.analyzeFile(fileName, content);
    const deprecationNotice = this.generateDeprecationNotice(fileName, analysis);

    // Add notice to the beginning of the file
    const updatedContent = deprecationNotice + '\n\n' + content;
    await fs.writeFile(filePath, updatedContent, 'utf-8');

    return filePath;
  }

  /**
   * Analyzes a file to understand its purpose and content
   */
  private analyzeFile(fileName: string, content: string): FileAnalysis {
    return {
      fileName,
      functions: this.extractFunctionNames(content),
      isSharedUtility: this.isSharedUtility(fileName, content),
      hasFeatureSpecificCode: this.hasFeatureSpecificCode(fileName, content),
      dependencies: this.extractDependencies(content),
      exports: this.extractExports(content),
      purpose: this.determinePurpose(fileName, content)
    };
  }

  /**
   * Generates a deprecation notice based on file analysis
   */
  private generateDeprecationNotice(fileName: string, analysis: FileAnalysis): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    let notice = `/**
 * DEPRECATED: This file is deprecated as part of FSD Phase 5 migration
 * 
 * File: ${fileName}
 * Deprecated: ${timestamp}
 * Migration Phase: FSD Phase 5 - Service API Migration
 * 
 * ${this.getDeprecationReason(analysis)}
 * 
 * ${this.getMigrationGuidance(analysis)}
 * 
 * Functions in this file: ${analysis.functions.join(', ') || 'None'}
 * 
 * For new development, use the feature-specific API directories:
 * - Authentication: /src/features/authentication/api/
 * - Subscription: /src/features/subscription/api/
 * - Search: /src/features/search/api/
 * - Portfolio: /src/features/portfolio/api/
 * - Shared utilities: /src/shared/api/
 * 
 * @deprecated Since FSD Phase 5 migration
 * @see https://feature-sliced.design/ for FSD methodology
 */`;

    // Add console warning for runtime deprecation notice
    if (analysis.functions.length > 0) {
      notice += `\n\n// Runtime deprecation warning
if (typeof console !== 'undefined' && console.warn) {
  console.warn(
    '⚠️  DEPRECATED: ${fileName} is deprecated. ' +
    'Use feature-specific API directories instead. ' +
    'See migration guide for details.'
  );
}`;
    }

    return notice;
  }

  /**
   * Determines the reason for deprecation based on file analysis
   */
  private getDeprecationReason(analysis: FileAnalysis): string {
    if (analysis.isSharedUtility) {
      return `This file contains shared utilities that should be moved to /src/shared/api/ 
 * for better organization and discoverability. The current location in /services/ 
 * does not follow FSD (Feature-Sliced Design) methodology.`;
    }

    if (analysis.hasFeatureSpecificCode) {
      return `This file contains feature-specific code that should be moved to the 
 * appropriate feature directory under /src/features/{feature}/api/. Keeping 
 * feature-specific code in the centralized /services/ directory violates 
 * FSD principles of feature isolation.`;
    }

    return `This file remains in the legacy /services/ directory and should be 
 * evaluated for migration to the appropriate FSD-compliant location.`;
  }

  /**
   * Provides migration guidance based on file analysis
   */
  private getMigrationGuidance(analysis: FileAnalysis): string {
    const guidance = ['MIGRATION GUIDANCE:'];

    if (analysis.isSharedUtility) {
      guidance.push(' * 1. Move this file to /src/shared/api/');
      guidance.push(' * 2. Update all import statements across the codebase');
      guidance.push(' * 3. Add to /src/shared/api/index.ts barrel export');
    } else if (analysis.hasFeatureSpecificCode) {
      guidance.push(` * 1. Identify the primary feature for this code (${analysis.purpose})`);
      guidance.push(' * 2. Move to /src/features/{feature}/api/');
      guidance.push(' * 3. Update import statements in consuming components');
      guidance.push(' * 4. Integrate with appropriate Zustand store if needed');
    } else {
      guidance.push(' * 1. Analyze the functions to determine if they are shared utilities');
      guidance.push(' * 2. If shared, move to /src/shared/api/');
      guidance.push(' * 3. If feature-specific, move to appropriate feature directory');
      guidance.push(' * 4. Update all import references');
    }

    guidance.push(' * 5. Remove this file once migration is complete');
    guidance.push(' * 6. Update tests to use new import paths');

    return guidance.join('\n');
  }

  /**
   * Determines the primary purpose/feature of a file
   */
  private determinePurpose(fileName: string, content: string): string {
    const purposePatterns = [
      { pattern: /auth/i, purpose: 'authentication' },
      { pattern: /subscription/i, purpose: 'subscription' },
      { pattern: /search/i, purpose: 'search' },
      { pattern: /portfolio/i, purpose: 'portfolio' },
      { pattern: /assessment/i, purpose: 'assessment' },
      { pattern: /student/i, purpose: 'student management' },
      { pattern: /educator/i, purpose: 'educator features' },
      { pattern: /recruiter/i, purpose: 'recruiter features' },
      { pattern: /message/i, purpose: 'messaging' },
      { pattern: /notification/i, purpose: 'notifications' },
      { pattern: /course/i, purpose: 'courses' },
      { pattern: /util|helper|common/i, purpose: 'shared utilities' }
    ];

    for (const { pattern, purpose } of purposePatterns) {
      if (pattern.test(fileName) || pattern.test(content)) {
        return purpose;
      }
    }

    return 'unknown - requires manual analysis';
  }

  /**
   * Checks if file already has deprecation notice
   */
  private hasDeprecationNotice(content: string): boolean {
    const deprecationPatterns = [
      /\/\*\*[\s\S]*?DEPRECATED[\s\S]*?\*\//,
      /\/\/ DEPRECATED:/,
      /@deprecated/i
    ];

    return deprecationPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Checks if file is a shared utility
   */
  private isSharedUtility(fileName: string, content: string): boolean {
    const sharedPatterns = [
      /client/i,
      /utils/i,
      /helper/i,
      /config/i,
      /constant/i,
      /interceptor/i,
      /middleware/i,
      /common/i
    ];

    return sharedPatterns.some(pattern => 
      pattern.test(fileName) || pattern.test(content)
    );
  }

  /**
   * Checks if file has feature-specific code
   */
  private hasFeatureSpecificCode(fileName: string, content: string): boolean {
    const featurePatterns = [
      /auth(?!Utils|Client)/i,
      /subscription/i,
      /search/i,
      /portfolio/i,
      /assessment/i,
      /student/i,
      /educator/i,
      /recruiter/i
    ];

    return featurePatterns.some(pattern => 
      pattern.test(fileName) || pattern.test(content)
    );
  }

  /**
   * Extracts function names from content
   */
  private extractFunctionNames(content: string): string[] {
    const functionPatterns = [
      /export\s+(?:async\s+)?function\s+(\w+)/g,
      /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(/g,
      /(\w+)\s*:\s*(?:async\s+)?function/g
    ];

    const functions: string[] = [];
    
    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push(match[1]);
      }
    }

    return [...new Set(functions)];
  }

  /**
   * Extracts dependencies from content
   */
  private extractDependencies(content: string): string[] {
    const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const dependencies: string[] = [];
    
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }

  /**
   * Extracts exports from content
   */
  private extractExports(content: string): string[] {
    const exportPatterns = [
      /export\s+\{\s*([^}]+)\s*\}/g,
      /export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g
    ];

    const exports: string[] = [];
    
    for (const pattern of exportPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1].includes(',')) {
          const multipleExports = match[1].split(',').map(e => e.trim());
          exports.push(...multipleExports);
        } else {
          exports.push(match[1]);
        }
      }
    }

    return [...new Set(exports)];
  }
}

/**
 * File analysis result
 */
interface FileAnalysis {
  fileName: string;
  functions: string[];
  isSharedUtility: boolean;
  hasFeatureSpecificCode: boolean;
  dependencies: string[];
  exports: string[];
  purpose: string;
}