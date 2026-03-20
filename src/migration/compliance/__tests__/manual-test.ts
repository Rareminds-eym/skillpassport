/**
 * Manual test for FSD Compliance Validator
 * Run with: npx tsx src/migration/compliance/__tests__/manual-test.ts
 */

import { FSDComplianceValidatorImpl } from '../FSDComplianceValidator';

async function runManualTest() {
  console.log('🧪 Running FSD Compliance Validator Manual Test\n');

  const validator = new FSDComplianceValidatorImpl(process.cwd());

  try {
    console.log('1️⃣ Testing Layer Hierarchy Validation...');
    const hierarchyResult = await validator.validateLayerHierarchy();
    console.log(`   ✓ Found ${hierarchyResult.layerStructure.length} layers`);
    console.log(`   ✓ Detected ${hierarchyResult.upwardDependencies.length} upward dependencies`);

    console.log('\n2️⃣ Testing Dependency Validation...');
    const dependencyResult = await validator.validateDependencies();
    console.log(`   ✓ Total dependencies: ${dependencyResult.totalDependencies}`);
    console.log(`   ✓ Valid dependencies: ${dependencyResult.validDependencies}`);
    console.log(`   ✓ Invalid dependencies: ${dependencyResult.invalidDependencies}`);

    console.log('\n3️⃣ Testing Public API Validation...');
    const apiResult = await validator.validatePublicAPIs();
    console.log(`   ✓ Total slices: ${apiResult.totalSlices}`);
    console.log(`   ✓ Slices with public API: ${apiResult.slicesWithPublicAPI}`);
    console.log(`   ✓ Slices without public API: ${apiResult.slicesWithoutPublicAPI.length}`);

    console.log('\n4️⃣ Generating Comprehensive Report...');
    const report = await validator.generateComplianceReport();
    console.log(`   ✓ Compliance Score: ${report.complianceScore}/100`);
    console.log(`   ✓ Overall Compliance: ${report.overallCompliance ? 'PASS' : 'FAIL'}`);
    console.log(`   ✓ Total Violations: ${report.summary.totalViolations}`);
    console.log(`   ✓ Errors: ${report.summary.errorCount}`);
    console.log(`   ✓ Warnings: ${report.summary.warningCount}`);
    console.log(`   ✓ Files Scanned: ${report.summary.filesScanned}`);
    console.log(`   ✓ Remediation Recommendations: ${report.remediationRecommendations.length}`);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Sample Violations:');
    if (report.dependencyValidation.upwardDependencies.length > 0) {
      const sample = report.dependencyValidation.upwardDependencies[0];
      console.log(`   - ${sample.fromLayer} → ${sample.toLayer}: ${sample.fromFile}`);
    }

    console.log('\n💡 Sample Recommendations:');
    if (report.remediationRecommendations.length > 0) {
      const rec = report.remediationRecommendations[0];
      console.log(`   Priority: ${rec.priority}`);
      console.log(`   Title: ${rec.title}`);
      console.log(`   Category: ${rec.category}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runManualTest();
