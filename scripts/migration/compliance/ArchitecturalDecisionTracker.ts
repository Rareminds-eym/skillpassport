import {
  ArchitecturalDecision,
  ComplianceViolation,
  RefactoringRecommendation,
  CrossFeatureDependencyViolation,
  TightCouplingAnalysis
} from '../types';
import { MigrationLogger } from '../logging/MigrationLogger';

export class ArchitecturalDecisionTracker {
  private decisions: ArchitecturalDecision[] = [];
  private logger: MigrationLogger;

  constructor(logger?: MigrationLogger) {
    this.logger = logger || new MigrationLogger();
  }

  documentCrossFeatureUsage(
    fromFeature: string,
    toFeature: string,
    justification: string,
    affectedFunctions: string[]
  ): ArchitecturalDecision {
    const decision: ArchitecturalDecision = {
      id: `cross-feature-${fromFeature}-${toFeature}-${Date.now()}`,
      title: `Cross-feature dependency: ${fromFeature} → ${toFeature}`,
      description: `Documented architectural decision for cross-feature dependency`,
      fromFeature,
      toFeature,
      justification,
      dateDecided: new Date().toISOString(),
      reviewer: 'migration-system'
    };

    this.decisions.push(decision);
    this.logger.info(`Documented architectural decision: ${decision.title}`);
    
    return decision;
  }

  identifyTightlyCoupledFunctions(
    tightCouplingAnalysis: TightCouplingAnalysis
  ): RefactoringRecommendation[] {
    const recommendations: RefactoringRecommendation[] = [];

    for (const coupledPair of tightCouplingAnalysis.coupledFunctions) {
      if (coupledPair.couplingStrength > 0.8) {
        recommendations.push({
          type: 'decouple_features',
          priority: 'high',
          description: `Refactor tightly coupled functions: ${coupledPair.function1} ↔ ${coupledPair.function2}`,
          affectedFiles: [],
          affectedFunctions: [coupledPair.function1, coupledPair.function2],
          estimatedEffort: 'medium',
          benefits: [
            'Reduces tight coupling',
            'Improves maintainability',
            'Enables independent testing'
          ],
          implementation: {
            steps: [
              {
                order: 1,
                description: 'Extract shared dependencies to common utilities',
                action: 'create_file',
                details: { sharedDependencies: coupledPair.sharedDependencies }
              },
              {
                order: 2,
                description: 'Introduce interface or facade pattern',
                action: 'create_file',
                details: { pattern: 'facade', features: [coupledPair.feature1, coupledPair.feature2] }
              }
            ],
            newFiles: [`src/shared/interfaces/${coupledPair.feature1}-${coupledPair.feature2}-interface.ts`],
            modifiedFiles: [coupledPair.function1, coupledPair.function2],
            deletedFiles: []
          }
        });
      }
    }

    return recommendations;
  }

  getArchitecturalDecisions(): ArchitecturalDecision[] {
    return [...this.decisions];
  }

  isLegitimateArchitecturalDecision(fromFeature: string, toFeature: string): boolean {
    return this.decisions.some(decision =>
      decision.fromFeature === fromFeature && decision.toFeature === toFeature
    );
  }
}