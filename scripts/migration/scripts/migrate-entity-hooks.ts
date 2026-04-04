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

interface MigrationResult {
  success: boolean;
  hookFile: string;
  targetLocation: string;
  error?: string;
}

class EntityHookMigrator {
  private results: MigrationResult[] = [];
  private entityHooks: HookInfo[];

  constructor() {
    this.entityHooks = hookClassificationReport.entityHooks as HookInfo[];
  }

  /**
   * Migrate all entity-specific hooks
   */
  async migrateAll(): Promise<void> {
    console.log(`\n🚀 Starting migration of ${this.entityHooks.length} entity hooks...\n`);

    for (const hook of this.entityHooks) {
      await this.migrateHook(hook);
    }

    this.printSummary();
  }

  /**
   * Migrate a single hook
   */
  private async migrateHook(hook: HookInfo): Promise<void> {
    const sourcePath = path.join('src/hooks', hook.hookFile);
    const targetPath = path.join('src', hook.targetLocation);

    try {
      // Check if source file exists
      if (!fs.existsSync(sourcePath)) {
        console.log(`⚠️  Source not found: ${sourcePath}`);
        this.results.push({
          success: false,
          hookFile: hook.hookFile,
          targetLocation: hook.targetLocation,
          error: 'Source file not found'
        });
        return;
      }

      // Check if target already exists
      if (fs.existsSync(targetPath)) {
        console.log(`✓ Already exists: ${targetPath}`);
        this.results.push({
          success: true,
          hookFile: hook.hookFile,
          targetLocation: hook.targetLocation
        });
        return;
      }

      // Create target directory
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Read source file
      let content = fs.readFileSync(sourcePath, 'utf-8');

      // Update imports in the hook file
      content = this.updateImports(content, hook);

      // Write to target location
      fs.writeFileSync(targetPath, content, 'utf-8');

      console.log(`✓ Migrated: ${hook.hookFile} -> ${hook.targetLocation}`);

      this.results.push({
        success: true,
        hookFile: hook.hookFile,
        targetLocation: hook.targetLocation
      });

      // Update entity index.ts
      await this.updateEntityIndex(hook);

    } catch (error) {
      console.error(`✗ Failed to migrate ${hook.hookFile}:`, error);
      this.results.push({
        success: false,
        hookFile: hook.hookFile,
        targetLocation: hook.targetLocation,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update imports within the hook file
   */
  private updateImports(content: string, hook: HookInfo): string {
    let updated = content;

    // Update relative imports from services
    updated = updated.replace(
      /from ['"]\.\.\/\.\.\/services\/([^'"]+)['"]/g,
      "from '@/shared/api/$1'"
    );

    // Update relative imports from types
    updated = updated.replace(
      /from ['"]\.\.\/\.\.\/types\/([^'"]+)['"]/g,
      "from '@/shared/types/$1'"
    );

    // Update relative imports from stores
    updated = updated.replace(
      /from ['"]\.\.\/stores['"]/g,
      "from '@/stores'"
    );

    // Update relative imports from other hooks
    updated = updated.replace(
      /from ['"]\.\/([^'"]+)['"]/g,
      (match, hookName) => {
        // Check if this is another entity hook in the same entity
        const sameEntityHook = this.entityHooks.find(h => 
          h.hookFile === hookName || h.hookFile === `${hookName}.ts` || h.hookFile === `${hookName}.js`
        );
        
        if (sameEntityHook && this.getEntityFromTarget(sameEntityHook.targetLocation) === this.getEntityFromTarget(hook.targetLocation)) {
          return `from './${hookName}'`;
        }
        
        return match;
      }
    );

    return updated;
  }

  /**
   * Extract entity name from target location
   */
  private getEntityFromTarget(targetLocation: string): string {
    const match = targetLocation.match(/entities\/([^/]+)\//);
    return match ? match[1] : '';
  }

  /**
   * Update entity index.ts to export the hook
   */
  private async updateEntityIndex(hook: HookInfo): Promise<void> {
    const entity = this.getEntityFromTarget(hook.targetLocation);
    if (!entity) return;

    const indexPath = path.join('src/entities', entity, 'index.ts');

    // Create index.ts if it doesn't exist
    if (!fs.existsSync(indexPath)) {
      const indexDir = path.dirname(indexPath);
      if (!fs.existsSync(indexDir)) {
        fs.mkdirSync(indexDir, { recursive: true });
      }
      fs.writeFileSync(indexPath, '', 'utf-8');
    }

    let indexContent = fs.readFileSync(indexPath, 'utf-8');

    // Check if export already exists
    const exportStatement = `export { ${hook.hookName} } from './model/${path.basename(hook.targetLocation, path.extname(hook.targetLocation))}';`;
    
    if (!indexContent.includes(hook.hookName)) {
      // Add export to model section
      if (indexContent.includes('// Model exports')) {
        indexContent = indexContent.replace(
          '// Model exports',
          `// Model exports\n${exportStatement}`
        );
      } else {
        // Add model section if it doesn't exist
        indexContent += `\n// Model exports\n${exportStatement}\n`;
      }

      fs.writeFileSync(indexPath, indexContent, 'utf-8');
      console.log(`  ✓ Updated ${indexPath}`);
    }
  }

  /**
   * Print migration summary
   */
  private printSummary(): void {
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`📁 Total: ${this.results.length}`);
    console.log('='.repeat(60) + '\n');

    if (failed > 0) {
      console.log('Failed migrations:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  ✗ ${r.hookFile}: ${r.error}`);
        });
    }
  }
}

// Run migration
const migrator = new EntityHookMigrator();
migrator.migrateAll().catch(console.error);
