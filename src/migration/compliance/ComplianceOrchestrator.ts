import {
  ArchitecturalComplianceValidator,
  ComplianceResult,
  DependencyGraph,
  RefactoringRecommendation,
  FSDComplianceRules
} from '../types';
import { FSDArchitecturalComplianceValidator } from './ArchitecturalComplianceValidator';
import { RefactoringRecommendationGenerator } from './RefactoringRecommendationGenerator';
import { ArchitecturalDecisionTracker } from './ArchitecturalDecisionTracker';
import { TightCouplingAnalyzer } from './TightCouplingAnalyzer';
import { MigrationLogger } from '../logging/MigrationLogger';

export class ComplianceOrchestrator {
  private validator: ArchitecturalComplianceValidator;
  private recommendationGenerator: RefactoringRecommendationGenerator;
  private decisionTracker: ArchitecturalDecisionTracker;
  private couplingAnalyzer: TightCouplingAnalyzer;
  private logger: MigrationLogger;

  constructor(
    complianceRules?: FSDComplianceRules,
    logger?: MigrationLogger
  ) {
    this.validator = new FSDArchitecturalComplianceValidator(complianceRules);
    this.recommendationGenerator = new RefactoringRecommendationGenerator();
    this.decisionTracker = new ArchitecturalDecisionTracker(logger);
    this.couplingAnalyzer = new TightCouplingAnalyzer();
    this.logger = logger || new MigrationLogger();
  }

  async validateArchitecturalCompliance(dependencyGraph: DependencyGraph): Promise<ComplianceResult> {
    this.logger.info('Starting architectural compliance validation');

    try {
      // Perform comprehensive compliance validation
      const complianceResult = await this.validator.validateFSDCompliance(dependencyGraph);

      // Log compliance summary
      this.logComplianceSummary(complianceResult);

      // Generate additional recommendations if needed
      if (complianceResult.violations.length > 0) {
        const additionalRecommendations = this.recommendationGenerator.generateRecommendations(
          complianceResult.violations,
          dependencyGraph
        );

        // Merge and deduplicate recommendations
        complianceResult.recommendations = this.mergeRecommendations(
          complianceResult.recommendations,
          additionalRecommendations
        );
      }

      this.logger.info(`Compliance validation completed. Score: ${complianceResult.summary.complianceScore}/100`);
      
      return complianceResult;
    } catch (error) {
      this.logger.error('Architectural compliance validation failed', error);
      throw error;
    }
  }

  async generateRefactoringPlan(
    dependencyGraph: DependencyGraph,
    priorityFilter?: 'high' | 'medium' | 'low'
  ): Promise<RefactoringRecommendation[]> {
    this.logger.info('Generating refactoring plan');

    const complianceResult = await this.validateArchitecturalCompliance(dependencyGraph);
    
    let recommendations = complianceResult.recommendations;

    // Filter by priority if specified
    if (priorityFilter) {
      recommendations = recommendations.filter(rec => rec.priority === priorityFilter);
    }

    this.logger.info(`Generated ${recommendations.length} refactoring recommendations`);
    
    return recommendations;
  }

  async validateSpecificFeatures(
    dependencyGraph: DependencyGraph,
    featureNames: string[]
  ): Promise<ComplianceResult> {
    this.logger.info(`Validating compliance for specific features: ${featureNames.join(', ')}`);

    // Filter dependency graph to only include specified features
    const filteredGraph = this.filterDependencyGraphByFeatures(dependencyGraph, featureNames);
    
    return this.validateArchitecturalCompliance(filteredGraph);
  }

  async checkCircularDependenciesOnly(dependencyGraph: DependencyGraph): Promise<boolean> {
    this.logger.info('Checking for circular dependencies');

    const circularResult = this.validator.checkCircularDependencies(dependencyGraph);
    
    if (circularResult.hasCircularDependencies) {
      this.logger.warn(`Found ${circularResult.cycles.length} circular dependencies affecting features: ${circularResult.affectedFeatures.join(', ')}`);
    } else {
      this.logger.info('No circular dependencies found');
    }

    return !circularResult.hasCircularDependencies;
  }

  async analyzeTightCoupling(dependencyGraph: DependencyGraph): Promise<RefactoringRecommendation[]> {
    this.logger.info('Analyzing tight coupling between functions');

    const tightCouplingAnalysis = this.couplingAnalyzer.analyzeTightCoupling(dependencyGraph);
    
    this.logger.info(`Found ${tightCouplingAnalysis.coupledFunctions.length} tightly coupled function pairs`);
    this.logger.info(`Overall coupling score: ${tightCouplingAnalysis.couplingScore.toFixed(2)}`);

    const recommendations = this.decisionTracker.identifyTightlyCoupledFunctions(tightCouplingAnalysis);
    
    return recommendations;
  }

  documentArchitecturalDecision(
    fromFeature: string,
    toFeature: string,
    justification: string,
    affectedFunctions: string[]
  ): void {
    this.decisionTracker.documentCrossFeatureUsage(
      fromFeature,
      toFeature,
      justification,
      affectedFunctions
    );
  }

  getArchitecturalDecisions() {
    return this.decisionTracker.getArchitecturalDecisions();
  }

  private logComplianceSummary(result: ComplianceResult): void {
    const { summary } = result;
    
    this.logger.info('=== Compliance Summary ===');
    this.logger.info(`Overall Score: ${summary.complianceScore}/100`);
    this.logger.info(`Total Violations: ${summary.totalViolations}`);
    this.logger.info(`  - Errors: ${summary.errorCount}`);
    this.logger.info(`  - Warnings: ${summary.warningCount}`);
    this.logger.info(`  - Info: ${summary.infoCount}`);
    this.logger.info(`Features Affected: ${summary.featuresAffected.join(', ')}`);
    this.logger.info(`Improvement Areas: ${summary.improvementAreas.join(', ')}`);

    if (result.circularDependencies.length > 0) {
      this.logger.warn(`Circular Dependencies: ${result.circularDependencies.length}`);
    }

    if (result.crossFeatureDependencies.length > 0) {
      this.logger.warn(`Cross-Feature Violations: ${result.crossFeatureDependencies.length}`);
    }

    this.logger.info(`Refactoring Recommendations: ${result.recommendations.length}`);
  }

  private mergeRecommendations(
    existing: RefactoringRecommendation[],
    additional: RefactoringRecommendation[]
  ): RefactoringRecommendation[] {
    const merged = [...existing];
    
    for (const newRec of additional) {
      // Check if a similar recommendation already exists
      const existingSimilar = merged.find(rec => 
        rec.type === newRec.type && 
        rec.description === newRec.description
      );

      if (!existingSimilar) {
        merged.push(newRec);
      }
    }

    // Sort by priority and effort
    return merged.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const effortOrder = { small: 0, medium: 1, large: 2 };

      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return effortOrder[a.estimatedEffort] - effortOrder[b.estimatedEffort];
    });
  }

  private filterDependencyGraphByFeatures(
    dependencyGraph: DependencyGraph,
    featureNames: string[]
  ): DependencyGraph {
    const featureSet = new Set(featureNames);
    
    // Filter nodes to only include specified features
    const filteredNodes = dependencyGraph.nodes.filter(node => {
      const feature = this.extractFeatureFromPath(node.id);
      return feature && featureSet.has(feature);
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

    // Filter edges to only include connections between filtered nodes
    const filteredEdges = dependencyGraph.edges.filter(edge =>
      filteredNodeIds.has(edge.from) && filteredNodeIds.has(edge.to)
    );

    return {
      nodes: filteredNodes,
      edges: filteredEdges
    };
  }

  private extractFeatureFromPath(path: string): string | null {
    const match = path.match(/features\/([^\/]+)/);
    return match ? match[1] : null;
  }
}