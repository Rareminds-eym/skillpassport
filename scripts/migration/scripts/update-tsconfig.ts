import { MigrationLogger } from '../logging/MigrationLogger';
import { TypeScriptConfigUpdater } from '../import-path/TypeScriptConfigUpdater';

async function main() {
  const logger = new MigrationLogger();
  const updater = new TypeScriptConfigUpdater(logger);

  try {
    logger.info('Updating TypeScript configuration');

    // Ensure FSD path mappings exist
    const result = await updater.ensureFSDPathMappings();

    console.log('\n=== TypeScript Configuration Update ===');
    console.log(`Config File: ${result.configPath}`);
    console.log(`Success: ${result.success ? 'Yes' : 'No'}`);
    
    if (result.addedMappings.length > 0) {
      console.log('\nAdded Path Mappings:');
      result.addedMappings.forEach(mapping => {
        console.log(`  ${mapping.alias} -> ${mapping.paths.join(', ')}`);
      });
    }

    if (result.modifiedMappings.length > 0) {
      console.log('\nModified Path Mappings:');
      result.modifiedMappings.forEach(mapping => {
        console.log(`  ${mapping.alias} -> ${mapping.paths.join(', ')}`);
      });
    }

    // Validate the configuration
    const validation = await updater.validatePathMappings();
    console.log('\n=== Validation Results ===');
    console.log(`Valid: ${validation.valid ? 'Yes' : 'No'}`);
    
    if (validation.issues.length > 0) {
      console.log('\nIssues Found:');
      validation.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }

    // Generate report
    const report = await updater.generatePathMappingReport();
    console.log('\n' + report);

    if (result.success && validation.valid) {
      console.log('\n✓ TypeScript configuration updated successfully!');
      process.exit(0);
    } else {
      console.log('\n✗ TypeScript configuration update completed with issues');
      process.exit(1);
    }
  } catch (error) {
    logger.error('TypeScript configuration update failed', { error });
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
