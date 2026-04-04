/**
 * Migration Script: Migrate Feature-Specific Hooks
 * 
 * This script migrates feature-specific hooks from src/hooks/ to their
 * respective features/{feature}/model/ directories.
 */

import * as fs from 'fs';
import * as path from 'path';
import hookReport from '../analysis/hook-classification-report.json';

interface HookMigration {
  hookFile: string;
  hookName: string;
  targetLocation: string;
  usageLocations: string[];
  usageCount: number;
}

interface MigrationResult {
  success: boolean;
  hook: string;
  target: string;
  error?: string;
  updatedFiles?: string[];
}

class FeatureHookMigrator {
  private results: MigrationResult[] = [];
  private projectRoot = path.resolve(__dirname, '../../..');
  private srcRoot = path.join(this.projectRoot, 'src');

  /**
   * Main migration execution
   */
  async migrate(): Promise<void> {
    console.log('🚀 Starting feature hook migration...\n');

    console.log(`Total feature hooks in report: ${hookReport.featureHooks.length}`);

    const featureHooks = hookReport.featureHooks.filter(
      (hook: HookMigration) => {
        // Only migrate hooks that are still in src/hooks/
        // Normalize path separators
        const normalizedPath = hook.hookFile.replace(/\\/g, '/');
        const sourcePath = path.join(this.srcRoot, 'hooks', normalizedPath);
        const exists = fs.existsSync(sourcePath);
        if (!exists) {
          console.log(`   Skipping ${hook.hookName}: source not found at ${sourcePath}`);
        }
        return exists;
      }
    );

    console.log(`Found ${featureHooks.length} feature hooks to migrate\n`);

    for (const hook of featureHooks) {
      await this.migrateHook(hook);
    }

    this.printSummary();
  }

  /**
   * Migrate a single hook
   */
  private async migrateHook(hook: HookMigration): Promise<void> {
    // Normalize path separators
    const normalizedHookFile = hook.hookFile.replace(/\\/g, '/');
    const sourcePath = path.join(this.srcRoot, 'hooks', normalizedHookFile);
    const targetPath = path.join(this.srcRoot, hook.targetLocation);

    console.log(`📦 Migrating ${hook.hookName}...`);
    console.log(`   From: hooks/${normalizedHookFile}`);
    console.log(`   To: ${hook.targetLocation}`);

    try {
      // Check if target already exists
      if (fs.existsSync(targetPath)) {
        console.log(`   ⚠️  Target already exists, skipping migration`);
        this.results.push({
          success: true,
          hook: hook.hookFile,
          target: hook.targetLocation,
          error: 'Target already exists (duplicate)'
        });
        return;
      }

      // Create target directory
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`   ✅ Created directory: ${path.relative(this.srcRoot, targetDir)}`);
      }

      // Read source file
      const content = fs.readFileSync(sourcePath, 'utf-8');

      // Write to target
      fs.writeFileSync(targetPath, content, 'utf-8');
      console.log(`   ✅ Copied to target location`);

      // Update imports in usage locations
      const updatedFiles = await this.updateImports(hook);

      // Delete source file
      fs.unlinkSync(sourcePath);
      console.log(`   ✅ Deleted source file`);

      // Update feature index.ts to export the hook
      await this.updateFeatureIndex(hook);

      this.results.push({
        success: true,
        hook: hook.hookFile,
        target: hook.targetLocation,
        updatedFiles
      });

      console.log(`   ✅ Migration complete\n`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      this.results.push({
        success: false,
        hook: hook.hookFile,
        target: hook.targetLocation,
        error: error.message
      });
    }
  }

  /**
   * Update imports in all usage locations
   */
  private async updateImports(hook: HookMigration): Promise<string[]> {
    const updatedFiles: string[] = [];

    // Determine the feature name from target location
    const featureMatch = hook.targetLocation.match(/features\/([^/]+)\//);
    if (!featureMatch) {
      console.log(`   ⚠️  Could not determine feature name, skipping import updates`);
      return updatedFiles;
    }

    const featureName = featureMatch[1];
    const oldImportPattern = new RegExp(
      `from ['"]@/hooks/${hook.hookFile.replace(/\\/g, '/').replace(/\.(ts|js|tsx|jsx)$/, '')}['"]`,
      'g'
    );
    const newImport = `from '@/features/${featureName}'`;

    for (const usageFile of hook.usageLocations) {
      const usagePath = path.join(this.srcRoot, '..', usageFile);
      
      if (!fs.existsSync(usagePath)) {
        continue;
      }

      try {
        let content = fs.readFileSync(usagePath, 'utf-8');
        const originalContent = content;

        // Update the import
        content = content.replace(oldImportPattern, newImport);

        if (content !== originalContent) {
          fs.writeFileSync(usagePath, content, 'utf-8');
          updatedFiles.push(usageFile);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not update imports in ${usageFile}: ${error.message}`);
      }
    }

    if (updatedFiles.length > 0) {
      console.log(`   ✅ Updated imports in ${updatedFiles.length} files`);
    }

    return updatedFiles;
  }

  /**
   * Update feature index.ts to export the hook
   */
  private async updateFeatureIndex(hook: HookMigration): Promise<void> {
    const featureMatch = hook.targetLocation.match(/features\/([^/]+)\//);
    if (!featureMatch) {
      return;
    }

    const featureName = featureMatch[1];
    const indexPath = path.join(this.srcRoot, 'features', featureName, 'index.ts');

    if (!fs.existsSync(indexPath)) {
      console.log(`   ⚠️  Feature index.ts not found, skipping export update`);
      return;
    }

    try {
      let content = fs.readFileSync(indexPath, 'utf-8');

      // Check if model exports already exist
      if (!content.includes("from './model'")) {
        // Add model export
        content += `\nexport * from './model';\n`;
        fs.writeFileSync(indexPath, content, 'utf-8');
        console.log(`   ✅ Added model export to feature index`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not update feature index: ${error.message}`);
    }
  }

  /**
   * Print migration summary
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));

    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const skipped = successful.filter(r => r.error?.includes('already exists'));

    console.log(`\n✅ Successful: ${successful.length - skipped.length}`);
    console.log(`⚠️  Skipped (duplicates): ${skipped.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (failed.length > 0) {
      console.log('\n❌ Failed migrations:');
      failed.forEach(r => {
        console.log(`   - ${r.hook}: ${r.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Execute migration
const migrator = new FeatureHookMigrator();
migrator.migrate().catch(console.error);
