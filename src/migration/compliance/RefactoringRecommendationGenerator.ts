import {
  RefactoringRecommendation,
  RefactoringImplementation,
  RefactoringStep,
  ComplianceViolation,
  TightCouplingAnalysis,
  CoupledFunctionPair,
  DependencyGraph,
  CircularDependency
} from '../types';

export class RefactoringRecommendationGenerator {
  generateRecommendations(
    violations: ComplianceViolation[],
    dependencyGraph: DependencyGraph,
    tightCouplingAnalysis?: TightCouplingAnalysis
  ): RefactoringRecommendation[] {
    const recommendations: RefactoringRecommendation[] = [];

    // Group violations by type for better analysis
    const violationGroups = this.groupViolationsByType(violations);

    // Generate recommendations for each violation type
    for (const [type, typeViolations] of violationGroups.entries()) {
      switch (type) {
        case 'circular_dependency':
          recommendations.push(...this.generateCircularDependencyRecommendations(typeViolations, dependencyGraph));
          break;
        case 'cross_feature_violation':
          recommendations.push(...this.generateCrossFeatureRecommendations(typeViolations));
          break;
        case 'tight_coupling':
          recommendations.push(...this.generateTightCouplingRecommendations(typeViolations, tightCouplingAnalysis));
          break;
        case 'architectural_violation':
          recommendations.push(...this.generateArchitecturalRecommendations(typeViolations));
          break;
      }
    }

    // Add proactive recommendations based on analysis
    if (tightCouplingAnalysis) {
      recommendations.push(...this.generateProactiveRecommendations(tightCouplingAnalysis, dependencyGraph));
    }

    return this.prioritizeAndDeduplicateRecommendations(recommendations);
  }

  private generateCircularDependencyRecommendations(
    violations: ComplianceViolation[],
    dependencyGraph: DependencyGraph
  ): RefactoringRecommendation[] {
    const recommendations: RefactoringRecommendation[] = [];

    for (const violation of violations) {
      const cycle = this.extractCycleFromViolation(violation, dependencyGraph);
      
      if (cycle) {
        recommendations.push({
          type: 'decouple_features',
          priority: 'high',
          description: `Break circular dependency in cycle: ${cycle.nodes.join(' → ')}`,
          affectedFiles: violation.affectedFiles,
          affectedFunctions: violation.affectedFunctions,
          estimatedEffort: this.estimateCircularDependencyEffort(cycle),
          benefits: [
            'Eliminates circular dependency',
            'Improves code maintainability',
            'Enables better testing and modularity',
            'Reduces build complexity'
          ],
          implementation: this.createCircularDependencyImplementation(cycle, violation)
        });
      }
    }

    return recommendations;
  }

  private generateCrossFeatureRecommendations(violations: ComplianceViolation[]): RefactoringRecommendation[] {
    const recommendations: RefactoringRecommendation[] = [];

    // Group violations by feature pairs for better recommendations
    const featurePairs = this.groupViolationsByFeaturePairs(violations);

    for (const [pairKey, pairViolations] of featurePairs.entries()) {
      const [fromFeature, toFeature] = pairKey.split('->');
      const violationCount = pairViolations.length;

      if (violationCount === 1) {
        // Single violation - simple extraction
        recommendations.push(this.createSingleCrossFeatureRecommendation(pairViolations[0]));
      } else {
        // Multiple violations - comprehensive refactoring
        recommendations.push(this.createMultipleCrossFeatureRecommendation(fromFeature, toFeature, pairViolations));
      }
    }

    return recommendations;
  }

  private generateTightCouplingRecommendations(
    violations: ComplianceViolation[],
    tightCouplingAnalysis?: TightCouplingAnalysis
  ): RefactoringRecommendation[] {
    const recommendations: RefactoringRecommendation[] = [];

    if (!tightCouplingAnalysis) return recommendations;

    // Group coupled functions by coupling strength
    const highCoupling = tightCouplingAnalysis.coupledFunctions.filter(cf => cf.couplingStrength > 0.8);
    const mediumCoupling = tightCouplingAnalysis.coupledFunctions.filter(cf => cf.couplingStrength > 0.5 && cf.couplingStrength <= 0.8);

    // High coupling - immediate action needed
    for (const coupledPair of highCoupling) {
      recommendations.push({
        type: 'decouple_features',
        priority: 'high',
        description: `Reduce high coupling between ${coupledPair.function1} and ${coupledPair.function2} (strength: ${coupledPair.couplingStrength.toFixed(2)})`,
        affectedFiles: [],
        affectedFunctions: [coupledPair.function1, coupledPair.function2],
        estimatedEffort: this.estimateCouplingReductionEffort(coupledPair),
        benefits: this.getCouplingReductionBenefits(coupledPair.couplingType),
        implementation: this.createCouplingReductionImplementation(coupledPair)
      });
    }

    // Medium coupling - preventive measures
    if (mediumCoupling.length > 0) {
      recommendations.push({
        type: 'introduce_events',
        priority: 'medium',
        description: `Introduce event-driven communication to reduce medium coupling between ${mediumCoupling.length} function pairs`,
        affectedFiles: [],
        affectedFunctions: mediumCoupling.flatMap(cf => [cf.function1, cf.function2]),
        estimatedEffort: 'medium',
        benefits: [
          'Prevents coupling from increasing',
          'Improves system flexibility',
          'Enables better testing'
        ],
        implementation: this.createEventDrivenImplementation(mediumCoupling)
      });
    }

    return recommendations;
  }

  private generateArchitecturalRecommendations(violations: ComplianceViolation[]): RefactoringRecommendation[] {
    return violations.map(violation => ({
      type: 'create_facade' as const,
      priority: 'low' as const,
      description: `Address architectural violation: ${violation.description}`,
      affectedFiles: violation.affectedFiles,
      affectedFunctions: violation.affectedFunctions,
      estimatedEffort: 'small' as const,
      benefits: [
        'Improves architectural compliance',
        'Better separation of concerns',
        'Clearer interfaces'
      ],
      implementation: {
        steps: [
          {
            order: 1,
            description: 'Document architectural decision',
            action: 'create_file',
            details: {
              filePath: 'docs/architecture/decisions/adr-cross-feature-dependency.md',
              content: 'architectural_decision_template'
            }
          },
          {
            order: 2,
            description: 'Create facade interface if needed',
            action: 'create_file',
            details: {
              filePath: 'src/shared/interfaces/feature-facade.ts',
              content: 'facade_interface'
            }
          }
        ],
        newFiles: ['docs/architecture/decisions/adr-cross-feature-dependency.md'],
        modifiedFiles: violation.affectedFiles,
        deletedFiles: []
      }
    }));
  }

  private generateProactiveRecommendations(
    tightCouplingAnalysis: TightCouplingAnalysis,
    dependencyGraph: DependencyGraph
  ): RefactoringRecommendation[] {
    const recommendations: RefactoringRecommendation[] = [];

    // Recommend shared utility extraction for commonly used functions
    const commonlyUsedFunctions = this.identifyCommonlyUsedFunctions(dependencyGraph);
    if (commonlyUsedFunctions.length > 0) {
      recommendations.push({
        type: 'extract_shared',
        priority: 'medium',
        description: `Extract ${commonlyUsedFunctions.length} commonly used functions to shared utilities`,
        affectedFiles: [],
        affectedFunctions: commonlyUsedFunctions,
        estimatedEffort: 'small',
        benefits: [
          'Reduces code duplication',
          'Improves maintainability',
          'Creates reusable utilities'
        ],
        implementation: this.createSharedExtractionImplementation(commonlyUsedFunctions)
      });
    }

    // Recommend event system if many cross-feature communications exist
    const crossFeatureCommunications = this.countCrossFeatureCommunications(dependencyGraph);
    if (crossFeatureCommunications > 10) {
      recommendations.push({
        type: 'introduce_events',
        priority: 'medium',
        description: `Introduce event system to handle ${crossFeatureCommunications} cross-feature communications`,
        affectedFiles: [],
        affectedFunctions: [],
        estimatedEffort: 'large',
        benefits: [
          'Reduces direct coupling',
          'Improves system flexibility',
          'Enables better testing and mocking'
        ],
        implementation: this.createEventSystemImplementation()
      });
    }

    return recommendations;
  }

  private groupViolationsByType(violations: ComplianceViolation[]): Map<string, ComplianceViolation[]> {
    const groups = new Map<string, ComplianceViolation[]>();
    
    for (const violation of violations) {
      const existing = groups.get(violation.type) || [];
      existing.push(violation);
      groups.set(violation.type, existing);
    }

    return groups;
  }

  private groupViolationsByFeaturePairs(violations: ComplianceViolation[]): Map<string, ComplianceViolation[]> {
    const pairs = new Map<string, ComplianceViolation[]>();

    for (const violation of violations) {
      // Extract feature names from affected files
      const features = this.extractFeaturesFromViolation(violation);
      if (features.length >= 2) {
        const pairKey = `${features[0]}->${features[1]}`;
        const existing = pairs.get(pairKey) || [];
        existing.push(violation);
        pairs.set(pairKey, existing);
      }
    }

    return pairs;
  }

  private extractCycleFromViolation(violation: ComplianceViolation, dependencyGraph: DependencyGraph): CircularDependency | null {
    // This would need to be implemented based on how circular dependencies are stored
    // For now, return a mock cycle
    return {
      nodes: violation.affectedFiles,
      edges: [],
      severity: 'error'
    };
  }

  private estimateCircularDependencyEffort(cycle: CircularDependency): 'small' | 'medium' | 'large' {
    const nodeCount = cycle.nodes.length;
    if (nodeCount <= 2) return 'small';
    if (nodeCount <= 4) return 'medium';
    return 'large';
  }

  private createCircularDependencyImplementation(cycle: CircularDependency, violation: ComplianceViolation): RefactoringImplementation {
    return {
      steps: [
        {
          order: 1,
          description: 'Analyze the circular dependency to identify shared functionality',
          action: 'create_file',
          details: {
            analysisType: 'circular_dependency',
            cycle: cycle.nodes
          }
        },
        {
          order: 2,
          description: 'Extract shared functionality to /shared/api/',
          action: 'create_file',
          details: {
            targetPath: '/shared/api/extracted-common.ts',
            extractedFunctions: violation.affectedFunctions
          }
        },
        {
          order: 3,
          description: 'Update imports to use shared functionality',
          action: 'update_imports',
          details: {
            updateType: 'circular_dependency_resolution',
            affectedFiles: violation.affectedFiles
          }
        },
        {
          order: 4,
          description: 'Validate that circular dependency is resolved',
          action: 'modify_file',
          details: {
            validationType: 'circular_dependency_check'
          }
        }
      ],
      newFiles: ['/shared/api/extracted-common.ts'],
      modifiedFiles: violation.affectedFiles,
      deletedFiles: []
    };
  }

  private createSingleCrossFeatureRecommendation(violation: ComplianceViolation): RefactoringRecommendation {
    return {
      type: 'extract_shared',
      priority: violation.severity === 'error' ? 'high' : 'medium',
      description: `Move cross-feature dependency to shared utilities: ${violation.description}`,
      affectedFiles: violation.affectedFiles,
      affectedFunctions: violation.affectedFunctions,
      estimatedEffort: 'small',
      benefits: [
        'Improves feature isolation',
        'Follows FSD principles',
        'Reduces direct coupling'
      ],
      implementation: {
        steps: [
          {
            order: 1,
            description: 'Move shared functionality to /shared/api/',
            action: 'move_function',
            details: {
              functions: violation.affectedFunctions,
              targetPath: '/shared/api/'
            }
          },
          {
            order: 2,
            description: 'Update imports across affected features',
            action: 'update_imports',
            details: {
              updateType: 'shared_extraction',
              affectedFiles: violation.affectedFiles
            }
          }
        ],
        newFiles: ['/shared/api/extracted-utilities.ts'],
        modifiedFiles: violation.affectedFiles,
        deletedFiles: []
      }
    };
  }

  private createMultipleCrossFeatureRecommendation(
    fromFeature: string,
    toFeature: string,
    violations: ComplianceViolation[]
  ): RefactoringRecommendation {
    const allAffectedFiles = violations.flatMap(v => v.affectedFiles);
    const allAffectedFunctions = violations.flatMap(v => v.affectedFunctions);

    return {
      type: 'create_facade',
      priority: 'high',
      description: `Create facade to manage multiple dependencies between ${fromFeature} and ${toFeature}`,
      affectedFiles: allAffectedFiles,
      affectedFunctions: allAffectedFunctions,
      estimatedEffort: 'medium',
      benefits: [
        'Centralizes cross-feature communication',
        'Reduces coupling complexity',
        'Provides clear interface boundaries'
      ],
      implementation: {
        steps: [
          {
            order: 1,
            description: `Create facade interface for ${toFeature}`,
            action: 'create_file',
            details: {
              filePath: `src/shared/interfaces/${toFeature}-facade.ts`,
              interfaceType: 'feature_facade'
            }
          },
          {
            order: 2,
            description: 'Implement facade in target feature',
            action: 'create_file',
            details: {
              filePath: `src/features/${toFeature}/api/facade.ts`,
              implementationType: 'facade_implementation'
            }
          },
          {
            order: 3,
            description: 'Update calling feature to use facade',
            action: 'modify_file',
            details: {
              refactoringType: 'facade_integration',
              callingFeature: fromFeature
            }
          }
        ],
        newFiles: [
          `src/shared/interfaces/${toFeature}-facade.ts`,
          `src/features/${toFeature}/api/facade.ts`
        ],
        modifiedFiles: allAffectedFiles,
        deletedFiles: []
      }
    };
  }

  private estimateCouplingReductionEffort(coupledPair: CoupledFunctionPair): 'small' | 'medium' | 'large' {
    const sharedDependencyCount = coupledPair.sharedDependencies.length;
    const couplingStrength = coupledPair.couplingStrength;

    if (couplingStrength > 0.9 || sharedDependencyCount > 10) return 'large';
    if (couplingStrength > 0.7 || sharedDependencyCount > 5) return 'medium';
    return 'small';
  }

  private getCouplingReductionBenefits(couplingType: 'data_coupling' | 'control_coupling' | 'common_coupling' | 'content_coupling'): string[] {
    const baseBenefits = ['Reduces coupling', 'Improves maintainability', 'Enables independent development'];

    switch (couplingType) {
      case 'content_coupling':
        return [...baseBenefits, 'Improves encapsulation', 'Reduces fragility'];
      case 'common_coupling':
        return [...baseBenefits, 'Reduces shared state issues', 'Improves testability'];
      case 'control_coupling':
        return [...baseBenefits, 'Improves flexibility', 'Reduces control dependencies'];
      case 'data_coupling':
        return [...baseBenefits, 'Clarifies data flow', 'Improves interface design'];
    }
  }

  private createCouplingReductionImplementation(coupledPair: CoupledFunctionPair): RefactoringImplementation {
    const strategy = this.selectCouplingReductionStrategy(coupledPair);

    switch (strategy) {
      case 'extract_shared':
        return this.createSharedExtractionImplementation(coupledPair.sharedDependencies);
      case 'introduce_events':
        return this.createEventDrivenImplementation([coupledPair]);
      case 'create_facade':
        return this.createFacadeImplementation(coupledPair);
      default:
        return this.createGenericDecouplingImplementation(coupledPair);
    }
  }

  private selectCouplingReductionStrategy(coupledPair: CoupledFunctionPair): 'extract_shared' | 'introduce_events' | 'create_facade' | 'generic' {
    if (coupledPair.sharedDependencies.length > 5) return 'extract_shared';
    if (coupledPair.couplingType === 'control_coupling') return 'introduce_events';
    if (coupledPair.couplingStrength > 0.8) return 'create_facade';
    return 'generic';
  }

  private createEventDrivenImplementation(coupledPairs: CoupledFunctionPair[]): RefactoringImplementation {
    return {
      steps: [
        {
          order: 1,
          description: 'Create event system infrastructure',
          action: 'create_file',
          details: {
            filePath: 'src/shared/events/event-system.ts',
            systemType: 'event_driven'
          }
        },
        {
          order: 2,
          description: 'Define events for coupled communications',
          action: 'create_file',
          details: {
            filePath: 'src/shared/events/feature-events.ts',
            eventDefinitions: coupledPairs.map(cp => `${cp.feature1}To${cp.feature2}Event`)
          }
        },
        {
          order: 3,
          description: 'Refactor coupled functions to use events',
          action: 'modify_file',
          details: {
            refactoringType: 'event_driven_communication',
            coupledPairs
          }
        }
      ],
      newFiles: [
        'src/shared/events/event-system.ts',
        'src/shared/events/feature-events.ts'
      ],
      modifiedFiles: coupledPairs.flatMap(cp => [cp.function1, cp.function2]),
      deletedFiles: []
    };
  }

  private createSharedExtractionImplementation(sharedFunctions: string[]): RefactoringImplementation {
    return {
      steps: [
        {
          order: 1,
          description: 'Create shared utility module',
          action: 'create_file',
          details: {
            filePath: 'src/shared/api/common-utilities.ts',
            extractedFunctions: sharedFunctions
          }
        },
        {
          order: 2,
          description: 'Update imports to use shared utilities',
          action: 'update_imports',
          details: {
            updateType: 'shared_utility_extraction',
            sharedFunctions
          }
        }
      ],
      newFiles: ['src/shared/api/common-utilities.ts'],
      modifiedFiles: [], // Would be populated with actual affected files
      deletedFiles: []
    };
  }

  private createFacadeImplementation(coupledPair: CoupledFunctionPair): RefactoringImplementation {
    return {
      steps: [
        {
          order: 1,
          description: `Create facade for ${coupledPair.feature2}`,
          action: 'create_file',
          details: {
            filePath: `src/features/${coupledPair.feature2}/api/facade.ts`,
            facadeType: 'feature_facade'
          }
        },
        {
          order: 2,
          description: `Update ${coupledPair.feature1} to use facade`,
          action: 'modify_file',
          details: {
            refactoringType: 'facade_integration',
            targetFunction: coupledPair.function1
          }
        }
      ],
      newFiles: [`src/features/${coupledPair.feature2}/api/facade.ts`],
      modifiedFiles: [coupledPair.function1],
      deletedFiles: []
    };
  }

  private createGenericDecouplingImplementation(coupledPair: CoupledFunctionPair): RefactoringImplementation {
    return {
      steps: [
        {
          order: 1,
          description: 'Analyze coupling and create decoupling plan',
          action: 'create_file',
          details: {
            analysisType: 'coupling_analysis',
            coupledPair
          }
        },
        {
          order: 2,
          description: 'Implement decoupling strategy',
          action: 'modify_file',
          details: {
            refactoringType: 'generic_decoupling',
            strategy: 'dependency_injection'
          }
        }
      ],
      newFiles: [],
      modifiedFiles: [coupledPair.function1, coupledPair.function2],
      deletedFiles: []
    };
  }

  private createEventSystemImplementation(): RefactoringImplementation {
    return {
      steps: [
        {
          order: 1,
          description: 'Create comprehensive event system',
          action: 'create_file',
          details: {
            filePath: 'src/shared/events/event-bus.ts',
            systemType: 'comprehensive_event_system'
          }
        },
        {
          order: 2,
          description: 'Define feature event contracts',
          action: 'create_file',
          details: {
            filePath: 'src/shared/events/contracts.ts',
            contractType: 'feature_event_contracts'
          }
        },
        {
          order: 3,
          description: 'Integrate event system with features',
          action: 'modify_file',
          details: {
            integrationType: 'event_system_integration'
          }
        }
      ],
      newFiles: [
        'src/shared/events/event-bus.ts',
        'src/shared/events/contracts.ts'
      ],
      modifiedFiles: [], // Would be populated with feature files
      deletedFiles: []
    };
  }

  private identifyCommonlyUsedFunctions(dependencyGraph: DependencyGraph): string[] {
    const functionUsage = new Map<string, number>();

    // Count how many times each function is used
    for (const edge of dependencyGraph.edges) {
      const currentCount = functionUsage.get(edge.to) || 0;
      functionUsage.set(edge.to, currentCount + 1);
    }

    // Return functions used more than 3 times
    return Array.from(functionUsage.entries())
      .filter(([_, count]) => count > 3)
      .map(([func, _]) => func);
  }

  private countCrossFeatureCommunications(dependencyGraph: DependencyGraph): number {
    let count = 0;

    for (const edge of dependencyGraph.edges) {
      const fromFeature = this.extractFeatureFromPath(edge.from);
      const toFeature = this.extractFeatureFromPath(edge.to);

      if (fromFeature && toFeature && fromFeature !== toFeature) {
        count++;
      }
    }

    return count;
  }

  private extractFeaturesFromViolation(violation: ComplianceViolation): string[] {
    const features = new Set<string>();

    for (const file of violation.affectedFiles) {
      const feature = this.extractFeatureFromPath(file);
      if (feature) features.add(feature);
    }

    return Array.from(features);
  }

  private extractFeatureFromPath(path: string): string | null {
    const match = path.match(/features\/([^\/]+)/);
    return match ? match[1] : null;
  }

  private prioritizeAndDeduplicateRecommendations(recommendations: RefactoringRecommendation[]): RefactoringRecommendation[] {
    // Remove duplicates based on description
    const unique = recommendations.filter((rec, index, arr) => 
      arr.findIndex(r => r.description === rec.description) === index
    );

    // Sort by priority (high -> medium -> low) and then by estimated effort
    return unique.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const effortOrder = { small: 0, medium: 1, large: 2 };

      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return effortOrder[a.estimatedEffort] - effortOrder[b.estimatedEffort];
    });
  }
}