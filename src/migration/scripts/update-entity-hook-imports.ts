import * as fs from 'fs';
import * as path from 'path';
import hookClassificationReport from '../analysis/hook-classification-report.json';

interface HookInfo {
  hookFile: string;
  hookName: string;
  classification: string;
  targetLocation: string;
  confidence: string;
  reasoning: string;
  imports: string[];
  usageCount: number;
  usageLocations: string[];
}

interface ImportUpdateResult {
  file: string;
  success: boolean;
  updatedImports: number;
  error?: string;
}

class EntityHookImportUpdater {
  private results: ImportUpdateResult[] = [];
  private entityHooks: HookInfo[];
  private hookPathMap: Map<string, string> = new Map();

  constructor() {
    this.entityHooks = hookClassificationReport.entityHooks as HookInfo[];
    this.buildHookPathMap();
  }

  /**
   * Build a map of hook names to their new entity paths
   */
  private buildHookPathMap(): void {
    for (const hook of this.entityHooks) {
      // Extract entity from target location
      const entity = this.getEntityFromTarget(hook.targetLocation);
      if (entity) {
        this.hookPathMap.set(hook.hookName, `@/entities/${entity}`);
      }
    }
  }

  /**
   * Extract entity name from target location
   */
  private getEntityFromTarget(targetLocation: string): string {
    const match = targetLocation.match(/entities\/([^/]+)\//);
    return match ? match[1] : '';
  }

  /**
   * Update all imports across the codebase
   */
  async updateAll(): Promise<void> {
    console.log(`\n🔄 Updating imports for ${this.entityHooks.length} entity hooks...\n`);

    // Collect all unique usage locations
    const allUsageLocations = new Set<string>();
    for (const hook of this.entityHooks) {
      for (const location of hook.usageLocations) {
        // Convert backslashes to forward slashes and prepend src/
        const normalizedPath = 'src/' + location.replace(/\\/g, '/');
        allUsageLocations.add(normalizedPath);
      }
    }

    console.log(`📁 Found ${allUsageLocations.size} files with entity hook imports\n`);

    // Update each file
    for (const filePath of allUsageLocations) {
      await this.updateFileImports(filePath);
    }

    this.printSummary();
  }

  /**
   * Update imports in a single file
   */
  private async updateFileImports(filePath: string): Promise<void> {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        this.results.push({
          file: filePath,
          success: false,
          updatedImports: 0,
          error: 'File not found'
        });
        return;
      }

      let content = fs.readFileSync(filePath, 'utf-8');
      let updatedImports = 0;
      const originalContent = content;

      // Update imports for each entity hook
      for (const hook of this.entityHooks) {
        const newPath = this.hookPathMap.get(hook.hookName);
        if (!newPath) continue;

        // Pattern 1: import { hookName } from '@/hooks/...'
        const pattern1 = new RegExp(
          `import\\s*{([^}]*\\b${hook.hookName}\\b[^}]*)}\\s*from\\s*['"]@/hooks/[^'"]*['"]`,
          'g'
        );

        // Pattern 2: import hookName from '@/hooks/...'
        const pattern2 = new RegExp(
          `import\\s+${hook.hookName}\\s+from\\s*['"]@/hooks/[^'"]*['"]`,
          'g'
        );

        // Pattern 3: Relative imports from hooks directory
        const pattern3 = new RegExp(
          `import\\s*{([^}]*\\b${hook.hookName}\\b[^}]*)}\\s*from\\s*['"]\\.\\.?/hooks/[^'"]*['"]`,
          'g'
        );

        // Pattern 4: Direct hook file imports
        const hookFileName = path.basename(hook.hookFile, path.extname(hook.hookFile));
        const pattern4 = new RegExp(
          `import\\s*{([^}]*)}\\s*from\\s*['"]@/hooks/${hookFileName.replace(/\\/g, '/')}['"]`,
          'g'
        );

        // Replace pattern 1
        if (pattern1.test(content)) {
          content = content.replace(pattern1, (match, imports) => {
            updatedImports++;
            return `import {${imports}} from '${newPath}'`;
          });
        }

        // Replace pattern 2
        if (pattern2.test(content)) {
          content = content.replace(pattern2, (match) => {
            updatedImports++;
            return `import { ${hook.hookName} } from '${newPath}'`;
          });
        }

        // Replace pattern 3
        if (pattern3.test(content)) {
          content = content.replace(pattern3, (match, imports) => {
            updatedImports++;
            return `import {${imports}} from '${newPath}'`;
          });
        }

        // Replace pattern 4
        if (pattern4.test(content)) {
          content = content.replace(pattern4, (match, imports) => {
            updatedImports++;
            return `import {${imports}} from '${newPath}'`;
          });
        }
      }

      // Only write if content changed
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✓ Updated ${filePath} (${updatedImports} imports)`);
        this.results.push({
          file: filePath,
          success: true,
          updatedImports
        });
      } else {
        console.log(`⊘ No changes needed: ${filePath}`);
        this.results.push({
          file: filePath,
          success: true,
          updatedImports: 0
        });
      }

    } catch (error) {
      console.error(`✗ Failed to update ${filePath}:`, error);
      this.results.push({
        file: filePath,
        success: false,
        updatedImports: 0,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Print update summary
   */
  private printSummary(): void {
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalUpdates = this.results.reduce((sum, r) => sum + r.updatedImports, 0);

    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Update Summary');
    console.log('='.repeat(60));
    console.log(`✓ Files processed: ${successful}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`🔄 Total imports updated: ${totalUpdates}`);
    console.log('='.repeat(60) + '\n');

    if (failed > 0) {
      console.log('Failed updates:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  ✗ ${r.file}: ${r.error}`);
        });
    }
  }
}

// Run import updater
const updater = new EntityHookImportUpdater();
updater.updateAll().catch(console.error);
