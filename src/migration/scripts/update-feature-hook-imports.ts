/**
 * Update Feature Hook Imports
 * 
 * This script updates imports from @/hooks/ to use feature public APIs
 * for hooks that have been migrated to features/{feature}/model/
 */

import * as fs from 'fs';
import * as path from 'path';
import hookReport from '../analysis/hook-classification-report.json';

interface HookMapping {
  hookName: string;
  oldImport: string;
  newImport: string;
  featureName: string;
}

class FeatureHookImportUpdater {
  private projectRoot = path.resolve(__dirname, '../../..');
  private srcRoot = path.join(this.projectRoot, 'src');
  private mappings: HookMapping[] = [];
  private updatedFiles: Set<string> = new Set();

  async update(): Promise<void> {
    console.log('🔄 Updating feature hook imports...\n');

    // Build hook mappings
    this.buildMappings();

    console.log(`Found ${this.mappings.length} hook mappings\n`);

    // Find all TypeScript/JavaScript files
    const files = this.findSourceFiles(this.srcRoot);
    console.log(`Scanning ${files.length} files...\n`);

    // Update imports in each file
    for (const file of files) {
      this.updateFileImports(file);
    }

    console.log(`\n✅ Updated ${this.updatedFiles.size} files`);
  }

  private buildMappings(): void {
    for (const hook of hookReport.featureHooks) {
      const featureMatch = hook.targetLocation.match(/features\/([^/]+)\//);
      if (!featureMatch) continue;

      const featureName = featureMatch[1];
      const hookFileName = hook.hookFile.replace(/\\/g, '/').replace(/\.(ts|js|tsx|jsx)$/, '');

      this.mappings.push({
        hookName: hook.hookName,
        oldImport: `@/hooks/${hookFileName}`,
        newImport: `@/features/${featureName}`,
        featureName
      });
    }
  }

  private findSourceFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules, .git, etc.
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...this.findSourceFiles(fullPath));
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private updateFileImports(filePath: string): void {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let updated = false;

    for (const mapping of this.mappings) {
      // Match: import { hookName } from '@/hooks/...'
      const importRegex = new RegExp(
        `from\\s+['"]${mapping.oldImport.replace(/\//g, '\\/')}['"]`,
        'g'
      );

      if (importRegex.test(content)) {
        content = content.replace(importRegex, `from '${mapping.newImport}'`);
        updated = true;
      }
    }

    if (updated && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      const relativePath = path.relative(this.projectRoot, filePath);
      this.updatedFiles.add(relativePath);
      console.log(`   ✅ ${relativePath}`);
    }
  }
}

// Execute
const updater = new FeatureHookImportUpdater();
updater.update().catch(console.error);
