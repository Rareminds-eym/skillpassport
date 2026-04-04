#!/usr/bin/env node

import { ComplianceOrchestrator } from '../compliance/ComplianceOrchestrator';
import { APIAnalyzer } from '../analysis/APIAnalyzer';
import { MigrationLogger } from '../logging/MigrationLogger';
import { FSDComplianceRules } from '@/features/student-profile/model';

interface ArchitectureValidationOptions {
  featuresOnly?: string[];
  priorityFilter?: 'high' | 'medium' | 'low';
  circularOnly?: boolean;
  generatePlan?: boolean;
  configPath?: string;
}

class ArchitectureValidator {
  private orchestrator: ComplianceOrchestrator;
  private analyzer: APIAnalyzer;
  private logger: MigrationLogger;

  constructor(options: ArchitectureValidationOptions = {}) {
    this.logger = new MigrationLogger();
    
    // Load compliance rules if config path provided
    const complianceRules = options.configPath ? 
      this.loadComplianceRules(options.configPath) : 
      undefined;

    this.orchestrator = new ComplianceOrchestrator(complianceRules, this.logger);
    this.analyzer = new APIAnalyzer();
  }

  async validateArchitecture(options: ArchitectureValidationOptions): Promise<void> {
    try {
      this.logger.info('Starting architectural compliance validation');

      // Analyze current codebase to build dependency graph
      const serviceFiles = await this.analyzer.scanServices();
      const functions = await Promise.all(
        serviceFiles.map(file => this.analyzer.extractFunctions(file))
      ).then(results => results.flat());

      const dependencyGraph = await this.analyzer.identifyDependencies(functions);

      if (options.circularOnly) {
        // Only check for circular dependencies
        const hasCircularDeps = await this.orchestrator.checkCircularDependenciesOnly(dependencyGraph);
        process.exit(hasCircularDeps ? 0 : 1);
        return;
      }

      let complianceResult;

      if (options.featuresOnly && options.featuresOnly.length > 0) {
        // Validate specific features only
        complianceResult = await this.orchestrator.validateSpecificFeatures(
          dependencyGraph,
          options.featuresOnly
        );
      } else {
        // Full compliance validation
        complianceResult = await this.orchestrator.validateArchitecturalCompliance(dependencyGraph);
      }

      // Output results
      this.outputComplianceResults(complianceResult);

      if (options.generatePlan) {
        // Generate refactoring plan
        const recommendations = await this.orchestrator.generateRefactoringPlan(
          dependencyGraph,
          options.priorityFilter
        );
        this.outputRefactoringPlan(recommendations);
      }

      // Exit with appropriate code
      const hasErrors = complianceResult.violations.some(v => v.severity === 'error');
      process.exit(hasErrors ? 1 : 0);

    } catch (error) {
      this.logger.error('Architecture validation failed', error);
      process.exit(1);
    }
  }

  private loadComplianceRules(configPath: string): FSDComplianceRules {
    try {
      // In a real implementation, this would load from a config file
      return {
        allowedCrossFeatureDependencies: [
          'shared/api',
          'shared/utils',
          'shared/types'
        ],
        sharedUtilityPatterns: [
          'shared/.*',
          '.*/utils/.*',
          '.*/constants/.*'
        ],
        architecturalDecisions: []
      };
    } catch (error) {
      this.logger.warn(`Could not load compliance rules from ${configPath}, using defaults`);
      return {
        allowedCrossFeatureDependencies: [],
        sharedUtilityPatterns: [],
        architecturalDecisions: []
      };
    }
  }

  private outputComplianceResults(result: any): void {
    console.log('\n=== ARCHITECTURAL COMPLIANCE REPORT ===\n');
    
    console.log(`Overall Compliance Score: ${result.summary.complianceScore}/100`);
    console.log(`Status: ${result.isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}\n`);

    if (result.violations.length > 0) {
      console.log('VIOLATIONS:');
      result.violations.forEach((violation: any, index: number) => {
        const icon = violation.severity === 'error' ? '❌' : 
                    violation.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${index + 1}. ${icon} ${violation.description}`);
        console.log(`   Recommendation: ${violation.recommendation}`);
        if (violation.affectedFunctions.length > 0) {
          console.log(`   Affected Functions: ${violation.affectedFunctions.join(', ')}`);
        }
        console.log('');
      });
    }

    if (result.circularDependencies.length > 0) {
      console.log('CIRCULAR DEPENDENCIES:');
      result.circularDependencies.forEach((cycle: any, index: number) => {
        console.log(`${index + 1}. ${cycle.nodes.join(' → ')}`);
      });
      console.log('');
    }

    if (result.crossFeatureDependencies.length > 0) {
      console.log('CROSS-FEATURE VIOLATIONS:');
      result.crossFeatureDependencies.forEach((violation: any, index: number) => {
        console.log(`${index + 1}. ${violation.fromFeature} → ${violation.toFeature} (${violation.violationType})`);
        console.log(`   Functions: ${violation.affectedFunctions.join(', ')}`);
        console.log(`   Recommendation: ${violation.recommendation}`);
        console.log('');
      });
    }

    console.log('SUMMARY:');
    console.log(`- Total Violations: ${result.summary.totalViolations}`);
    console.log(`- Errors: ${result.summary.errorCount}`);
    console.log(`- Warnings: ${result.summary.warningCount}`);
    console.log(`- Features Affected: ${result.summary.featuresAffected.join(', ')}`);
    console.log(`- Improvement Areas: ${result.summary.improvementAreas.join(', ')}`);
  }

  private outputRefactoringPlan(recommendations: any[]): void {
    if (recommendations.length === 0) {
      console.log('\n✅ No refactoring recommendations needed.\n');
      return;
    }

    console.log('\n=== REFACTORING PLAN ===\n');

    recommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'high' ? '🔴' : 
                          rec.priority === 'medium' ? '🟡' : '🟢';
      const effortIcon = rec.estimatedEffort === 'large' ? '🔥' :
                        rec.estimatedEffort === 'medium' ? '⚡' : '✨';

      console.log(`${index + 1}. ${priorityIcon} ${effortIcon} ${rec.description}`);
      console.log(`   Type: ${rec.type}`);
      console.log(`   Priority: ${rec.priority} | Effort: ${rec.estimatedEffort}`);
      console.log(`   Benefits: ${rec.benefits.join(', ')}`);
      
      if (rec.affectedFunctions.length > 0) {
        console.log(`   Affected Functions: ${rec.affectedFunctions.join(', ')}`);
      }

      console.log(`   Implementation Steps:`);
      rec.implementation.steps.forEach((step: any, stepIndex: number) => {
        console.log(`     ${stepIndex + 1}. ${step.description}`);
      });

      console.log('');
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: ArchitectureValidationOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--features':
        options.featuresOnly = args[++i]?.split(',') || [];
        break;
      case '--priority':
        options.priorityFilter = args[++i] as 'high' | 'medium' | 'low';
        break;
      case '--circular-only':
        options.circularOnly = true;
        break;
      case '--generate-plan':
        options.generatePlan = true;
        break;
      case '--config':
        options.configPath = args[++i];
        break;
      case '--help':
        console.log(`
Usage: npm run validate:architecture [options]

Options:
  --features <list>     Validate specific features only (comma-separated)
  --priority <level>    Filter recommendations by priority (high|medium|low)
  --circular-only       Only check for circular dependencies
  --generate-plan       Generate refactoring plan
  --config <path>       Path to compliance rules config file
  --help               Show this help message

Examples:
  npm run validate:architecture
  npm run validate:architecture --features authentication,subscription
  npm run validate:architecture --generate-plan --priority high
  npm run validate:architecture --circular-only
        `);
        process.exit(0);
        break;
    }
  }

  const validator = new ArchitectureValidator(options);
  await validator.validateArchitecture(options);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Architecture validation failed:', error);
    process.exit(1);
  });
}

export { ArchitectureValidator };