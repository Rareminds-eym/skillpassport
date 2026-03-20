import * as fs from 'fs';
import * as path from 'path';

export interface TreeShakingOpportunity {
  file: string;
  issue: string;
  suggestion: string;
  estimatedSavings: number;
}

export class TreeShakingDetector {
  private srcPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.srcPath = path.join(projectRoot, 'src');
  }

  /**
   * Detects opportunities for tree shaking
   * Requirement 5.3: Bundle_Optimizer SHALL detect opportunities for tree shaking
   */
  async detectOpportunities(): Promise<TreeShakingOpportunity[]> {
    const opportunities: TreeShakingOpportunity[] = [];
    
    await this.scanDirectory(this.srcPath, opportunities);
    
    return opportunities;
  }

  /**
   * Recursively scans directory for tree-shaking opportunities
   */
  private async scanDirectory(dirPath: string, opportunities: TreeShakingOpportunity[]): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        // Skip node_modules and other non-source directories
        if (!['node_modules', 'dist', '.git', '.vscode'].includes(item)) {
          await this.scanDirectory(itemPath, opportunities);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
        await this.analyzeFile(itemPath, opportunities);
      }
    }
  }

  /**
   * Analyzes a single file for tree-shaking opportunities
   */
  private async analyzeFile(filePath: string, opportunities: TreeShakingOpportunity[]): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(this.srcPath, filePath);

    // Check for barrel imports that prevent tree-shaking
    const barrelImportRegex = /import\s+\*\s+as\s+\w+\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = barrelImportRegex.exec(content)) !== null) {
      opportunities.push({
        file: relativePath,
        issue: `Barrel import: import * as ... from '${match[1]}'`,
        suggestion: 'Import specific exports instead of using wildcard imports',
        estimatedSavings: 10 * 1024, // Estimated
      });
    }

    // Check for default imports from libraries that support named imports
    if (content.includes("import _ from 'lodash'") || content.includes('import _ from "lodash"')) {
      opportunities.push({
        file: relativePath,
        issue: "Default lodash import",
        suggestion: "Import specific functions: import debounce from 'lodash/debounce'",
        estimatedSavings: 400 * 1024,
      });
    }

    // Check for full library imports
    const fullLibraryImports = [
      { pattern: /import\s+.*\s+from\s+['"]@heroicons\/react['"]/, lib: '@heroicons/react', suggestion: "Import from specific path: '@heroicons/react/24/outline'" },
      { pattern: /import\s+.*\s+from\s+['"]@radix-ui\/react-icons['"]/, lib: '@radix-ui/react-icons', suggestion: 'Import specific icons only' },
    ];

    for (const { pattern, lib, suggestion } of fullLibraryImports) {
      if (pattern.test(content)) {
        opportunities.push({
          file: relativePath,
          issue: `Full library import from ${lib}`,
          suggestion,
          estimatedSavings: 50 * 1024,
        });
      }
    }

    // Check for unused imports (basic detection)
    const importRegex = /import\s+\{([^}]+)\}\s+from/g;
    while ((match = importRegex.exec(content)) !== null) {
      const imports = match[1].split(',').map(i => i.trim());
      for (const imp of imports) {
        const importName = imp.split(' as ')[1] || imp;
        // Simple check: if import appears only once (in the import statement), it might be unused
        const occurrences = (content.match(new RegExp(`\\b${importName}\\b`, 'g')) || []).length;
        if (occurrences === 1) {
          opportunities.push({
            file: relativePath,
            issue: `Potentially unused import: ${importName}`,
            suggestion: 'Remove unused imports to improve tree-shaking',
            estimatedSavings: 1 * 1024,
          });
        }
      }
    }
  }

  /**
   * Groups opportunities by type
   */
  groupByType(opportunities: TreeShakingOpportunity[]): Record<string, TreeShakingOpportunity[]> {
    const grouped: Record<string, TreeShakingOpportunity[]> = {
      'barrel-imports': [],
      'full-library-imports': [],
      'unused-imports': [],
      'other': [],
    };

    for (const opp of opportunities) {
      if (opp.issue.includes('Barrel import')) {
        grouped['barrel-imports'].push(opp);
      } else if (opp.issue.includes('Full library import')) {
        grouped['full-library-imports'].push(opp);
      } else if (opp.issue.includes('unused import')) {
        grouped['unused-imports'].push(opp);
      } else {
        grouped['other'].push(opp);
      }
    }

    return grouped;
  }
}
