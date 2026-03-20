import {
  ArchitecturalComplianceValidator,
  ComplianceResult,
  ComplianceViolation,
  CircularDependencyResult,
  CrossFeatureDependencyResult,
  CrossFeatureDependencyViolation,
  RefactoringRecommendation,
  ComplianceSummary,
  DependencyGraph,
  DependencyEdge,
  CircularDependency,
  LegitimateFeatureDependency,
  TightCouplingAnalysis,
  CoupledFunctionPair,
  FSDComplianceRules,
  ArchitecturalDecision
} from '../types';

export class FSDArchitecturalComplianceValidator implements ArchitecturalComplianceValidator {
  private complianceRules: FSDComplianceRules;

  constructor(complianceRules?: FSDComplianceRules) {
    this.complianceRules = complianceRules || this.getDefaultComplianceRules();
  }

  async validateFSDCompliance(dependencyGraph: DependencyGraph): Promise<ComplianceResult> {
    const circularResult = this.checkCircularDependencies(dependencyGraph);
    const crossFeatureResult = this.validateCrossFeatureDependencies(dependencyGraph.edges);
    const tightCouplingAnalysis = this.analyzeTightCoupling(dependencyGraph);

    const violations: ComplianceViolation[] = [
      ...this.createCircularDependencyViolations(circularResult),
      ...this.createCrossFeatureViolations(crossFeatureResult),
      ...this.createTightCouplingViolations(tightCouplingAnalysis)
    ];

    const recommendations = this.generateRefactoringRecommendations(violations);
    const summary = this.generateComplianceSummary(violations, dependencyGraph);

    return {
      isCompliant: violations.filter(v => v.severity === 'error').length === 0,
      violations,
      circularDependencies: circularResult.cycles,
      crossFeatureDependencies: crossFeatureResult.violations,
      recommendations,
      summary
    };
  }

  checkCircularDependencies(dependencyGraph: DependencyGraph): CircularDependencyResult {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: CircularDependency[] = [];
    const affectedFeatures = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        const cyclePath = path.slice(cycleStart);
        cyclePath.push(nodeId); // Complete the cycle

        const cycle: CircularDependency = {
          nodes: cyclePath,
          edges: this.getCycleEdges(cyclePath, dependencyGraph.edges),
          severity: 'error'
        };

        cycles.push(cycle);
        cyclePath.forEach(node => {
          const feature = this.extractFeatureFromNode(node);
          if (feature) affectedFeatures.add(feature);
        });
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = dependencyGraph.edges.filter(edge => edge.from === nodeId);
      for (const edge of outgoingEdges) {
        dfs(edge.to, [...path, nodeId]);
      }

      recursionStack.delete(nodeId);
    };

    // Check all nodes for cycles
    for (const node of dependencyGraph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }

    return {
      hasCircularDependencies: cycles.length > 0,
      cycles,
      affectedFeatures: Array.from(affectedFeatures)
    };
  }

  validateCrossFeatureDependencies(dependencies: DependencyEdge[]): CrossFeatureDependencyResult {
    const violations: CrossFeatureDependencyViolation[] = [];
    const legitimateDependencies: LegitimateFeatureDependency[] = [];

    for (const dependency of dependencies) {
      const fromFeature = this.extractFeatureFromNode(dependency.from);
      const toFeature = this.extractFeatureFromNode(dependency.to);

      if (!fromFeature || !toFeature || fromFeature === toFeature) {
        continue; // Skip intra-feature or non-feature dependencies
      }

      if (this.isSharedUtilityDependency(dependency)) {
        // Legitimate dependency on shared utilities
        legitimateDependencies.push({
          fromFeature,
          toFeature,
          dependencyType: 'shared_utility',
          justification: 'Dependency on shared utility functions',
          functions: [dependency.functionName || 'unknown']
        });
        continue;
      }

      if (this.isDocumentedArchitecturalDecision(fromFeature, toFeature)) {
        // Legitimate documented coupling
        legitimateDependencies.push({
          fromFeature,
          toFeature,
          dependencyType: 'documented_coupling',
          justification: this.getArchitecturalDecisionJustification(fromFeature, toFeature),
          functions: [dependency.functionName || 'unknown']
        });
        continue;
      }

      // Check for violations
      const violationType = this.determineViolationType(dependency, dependencies);
      const severity = this.determineSeverity(violationType);

      violations.push({
        fromFeature,
        toFeature,
        violationType,
        affectedFunctions: [dependency.functionName || 'unknown'],
        severity,
        recommendation: this.generateCrossFeatureRecommendation(violationType, fromFeature, toFeature)
      });
    }

    return {
      hasViolations: violations.length > 0,
      violations,
      legitimateDependencies
    };
  }

  generateRefactoringRecommendations(violations: ComplianceViolation[]): RefactoringRecommendation[] {
    const recommendations: RefactoringRecommendation[] = [];

    // Group violations by type for better recommendations
    const violationsByType = this.groupViolationsByType(violations);

    for (const [type, typeViolations] of violationsByType.entries()) {
      switch (type) {
        case 'circular_dependency':
          recommendations.push(...this.generateCircularDependencyRecommendations(typeViolations));
          break;
        case 'cross_feature_violation':
          recommendations.push(...this.generateCrossFeatureRecommendations(typeViolations));
          break;
        case 'tight_coupling':
          recommendations.push(...this.generateTightCouplingRecommendations(typeViolations));
          break;
        case 'architectural_violation':
          recommendations.push(...this.generateArchitecturalRecommendations(typeViolations));
          break;
      }
    }

    return recommendations.sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));
  }

  private analyzeTightCoupling(dependencyGraph: DependencyGraph): TightCouplingAnalysis {
    const coupledFunctions: CoupledFunctionPair[] = [];
    const functionPairs = this.getAllFunctionPairs(dependencyGraph);

    for (const pair of functionPairs) {
      const couplingStrength = this.calculateCouplingStrength(pair, dependencyGraph);
      if (couplingStrength > 0.7) { // High coupling threshold
        coupledFunctions.push({
          ...pair,
          couplingStrength,
          couplingType: this.determineCouplingType(pair, dependencyGraph),
          sharedDependencies: this.findSharedDependencies(pair, dependencyGraph)
        });
      }
    }

    const couplingScore = this.calculateOverallCouplingScore(coupledFunctions);
    const recommendations = this.generateTightCouplingRecommendations(
      coupledFunctions.map(cf => this.createTightCouplingViolation(cf))
    );

    return {
      coupledFunctions,
      couplingScore,
      recommendations
    };
  }

  private createCircularDependencyViolations(result: CircularDependencyResult): ComplianceViolation[] {
    return result.cycles.map(cycle => ({
      type: 'circular_dependency' as const,
      severity: 'error' as const,
      description: `Circular dependency detected: ${cycle.nodes.join(' -> ')}`,
      affectedFiles: cycle.nodes,
      affectedFunctions: cycle.edges.map(e => e.functionName || 'unknown'),
      recommendation: 'Break the circular dependency by extracting shared functionality or introducing dependency inversion'
    }));
  }

  private createCrossFeatureViolations(result: CrossFeatureDependencyResult): ComplianceViolation[] {
    return result.violations.map(violation => ({
      type: 'cross_feature_violation' as const,
      severity: violation.severity,
      description: `Cross-feature dependency violation: ${violation.fromFeature} -> ${violation.toFeature} (${violation.violationType})`,
      affectedFiles: [], // Would need to be populated with actual file paths
      affectedFunctions: violation.affectedFunctions,
      recommendation: violation.recommendation
    }));
  }

  private createTightCouplingViolations(analysis: TightCouplingAnalysis): ComplianceViolation[] {
    return analysis.coupledFunctions.map(pair => ({
      type: 'tight_coupling' as const,
      severity: pair.couplingStrength > 0.9 ? 'error' as const : 'warning' as const,
      description: `Tight coupling detected between ${pair.function1} and ${pair.function2} (strength: ${pair.couplingStrength.toFixed(2)})`,
      affectedFiles: [],
      affectedFunctions: [pair.function1, pair.function2],
      recommendation: `Consider refactoring to reduce coupling through ${this.getCouplingReductionStrategy(pair.couplingType)}`
    }));
  }

  private generateComplianceSummary(violations: ComplianceViolation[], dependencyGraph: DependencyGraph): ComplianceSummary {
    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;
    const infoCount = violations.filter(v => v.severity === 'info').length;

    const featuresAffected = new Set<string>();
    violations.forEach(v => {
      v.affectedFiles.forEach(file => {
        const feature = this.extractFeatureFromNode(file);
        if (feature) featuresAffected.add(feature);
      });
    });

    const complianceScore = Math.max(0, 100 - (errorCount * 10 + warningCount * 5 + infoCount * 1));

    return {
      totalViolations: violations.length,
      errorCount,
      warningCount,
      infoCount,
      featuresAffected: Array.from(featuresAffected),
      complianceScore,
      improvementAreas: this.identifyImprovementAreas(violations)
    };
  }

  private extractFeatureFromNode(nodeId: string): string | null {
    // Extract feature name from file path like 'src/features/authentication/api/authApi.ts'
    const featureMatch = nodeId.match(/features\/([^\/]+)/);
    return featureMatch ? featureMatch[1] : null;
  }

  private getCycleEdges(cyclePath: string[], edges: DependencyEdge[]): DependencyEdge[] {
    const cycleEdges: DependencyEdge[] = [];
    for (let i = 0; i < cyclePath.length - 1; i++) {
      const edge = edges.find(e => e.from === cyclePath[i] && e.to === cyclePath[i + 1]);
      if (edge) cycleEdges.push(edge);
    }
    return cycleEdges;
  }

  private isSharedUtilityDependency(dependency: DependencyEdge): boolean {
    return dependency.to.includes('/shared/') || 
           this.complianceRules.sharedUtilityPatterns.some(pattern => 
             new RegExp(pattern).test(dependency.to)
           );
  }

  private isDocumentedArchitecturalDecision(fromFeature: string, toFeature: string): boolean {
    return this.complianceRules.architecturalDecisions.some(decision =>
      decision.fromFeature === fromFeature && decision.toFeature === toFeature
    );
  }

  private getArchitecturalDecisionJustification(fromFeature: string, toFeature: string): string {
    const decision = this.complianceRules.architecturalDecisions.find(d =>
      d.fromFeature === fromFeature && d.toFeature === toFeature
    );
    return decision?.justification || 'Documented architectural decision';
  }

  private determineViolationType(dependency: DependencyEdge, allDependencies: DependencyEdge[]): 'direct_import' | 'tight_coupling' | 'bidirectional' {
    const fromFeature = this.extractFeatureFromNode(dependency.from);
    const toFeature = this.extractFeatureFromNode(dependency.to);

    // Check for bidirectional dependency
    const reverseDependency = allDependencies.find(d => 
      this.extractFeatureFromNode(d.from) === toFeature && 
      this.extractFeatureFromNode(d.to) === fromFeature
    );

    if (reverseDependency) return 'bidirectional';

    // Check for tight coupling (multiple dependencies between same features)
    const samePairDependencies = allDependencies.filter(d =>
      this.extractFeatureFromNode(d.from) === fromFeature &&
      this.extractFeatureFromNode(d.to) === toFeature
    );

    if (samePairDependencies.length > 3) return 'tight_coupling';

    return 'direct_import';
  }

  private determineSeverity(violationType: 'direct_import' | 'tight_coupling' | 'bidirectional'): 'error' | 'warning' {
    switch (violationType) {
      case 'bidirectional':
        return 'error';
      case 'tight_coupling':
        return 'error';
      case 'direct_import':
        return 'warning';
    }
  }

  private generateCrossFeatureRecommendation(violationType: string, fromFeature: string, toFeature: string): string {
    switch (violationType) {
      case 'bidirectional':
        return `Break bidirectional dependency between ${fromFeature} and ${toFeature} by extracting shared functionality or introducing events`;
      case 'tight_coupling':
        return `Reduce tight coupling between ${fromFeature} and ${toFeature} by creating a facade or shared service`;
      case 'direct_import':
        return `Consider moving shared functionality to /shared/ or using event-driven communication`;
      default:
        return 'Review cross-feature dependency and consider architectural alternatives';
    }
  }

  private groupViolationsByType(violations: ComplianceViolation[]): Map<string, ComplianceViolation[]> {
    const grouped = new Map<string, ComplianceViolation[]>();
    for (const violation of violations) {
      const existing = grouped.get(violation.type) || [];
      existing.push(violation);
      grouped.set(violation.type, existing);
    }
    return grouped;
  }

  private generateCircularDependencyRecommendations(violations: ComplianceViolation[]): RefactoringRecommendation[] {
    return violations.map(violation => ({
      type: 'decouple_features' as const,
      priority: 'high' as const,
      description: `Break circular dependency: ${violation.description}`,
      affectedFiles: violation.affectedFiles,
      affectedFunctions: violation.affectedFunctions,
      estimatedEffort: 'medium' as const,
      benefits: ['Eliminates circular dependency', 'Improves code maintainability', 'Enables better testing'],
      implementation: {
        steps: [
          {
            order: 1,
            description: 'Identify shared functionality causing the cycle',
            action: 'create_file' as const,
            details: { analysis: 'dependency_analysis' }
          },
          {
            order: 2,
            description: 'Extract shared functionality to /shared/',
            action: 'create_file' as const,
            details: { targetPath: '/shared/api/' }
          },
          {
            order: 3,
            description: 'Update imports to use shared functionality',
            action: 'update_imports' as const,
            details: { updateType: 'shared_extraction' }
          }
        ],
        newFiles: ['/shared/api/extracted-functionality.ts'],
        modifiedFiles: violation.affectedFiles,
        deletedFiles: []
      }
    }));
  }

  private generateCrossFeatureRecommendations(violations: ComplianceViolation[]): RefactoringRecommendation[] {
    return violations.map(violation => ({
      type: 'extract_shared' as const,
      priority: violation.severity === 'error' ? 'high' as const : 'medium' as const,
      description: `Resolve cross-feature dependency: ${violation.description}`,
      affectedFiles: violation.affectedFiles,
      affectedFunctions: violation.affectedFunctions,
      estimatedEffort: 'small' as const,
      benefits: ['Improves feature isolation', 'Follows FSD principles', 'Reduces coupling'],
      implementation: {
        steps: [
          {
            order: 1,
            description: 'Move shared functionality to /shared/api/',
            action: 'move_function' as const,
            details: { targetPath: '/shared/api/' }
          },
          {
            order: 2,
            description: 'Update imports across features',
            action: 'update_imports' as const,
            details: { updateType: 'shared_migration' }
          }
        ],
        newFiles: [],
        modifiedFiles: violation.affectedFiles,
        deletedFiles: []
      }
    }));
  }

  private generateTightCouplingRecommendations(violations: ComplianceViolation[]): RefactoringRecommendation[] {
    return violations.map(violation => ({
      type: 'decouple_features' as const,
      priority: 'medium' as const,
      description: `Reduce tight coupling: ${violation.description}`,
      affectedFiles: violation.affectedFiles,
      affectedFunctions: violation.affectedFunctions,
      estimatedEffort: 'large' as const,
      benefits: ['Reduces coupling', 'Improves maintainability', 'Enables independent development'],
      implementation: {
        steps: [
          {
            order: 1,
            description: 'Introduce facade pattern or event system',
            action: 'create_file' as const,
            details: { pattern: 'facade_or_events' }
          },
          {
            order: 2,
            description: 'Refactor tightly coupled functions',
            action: 'modify_file' as const,
            details: { refactoringType: 'decouple' }
          }
        ],
        newFiles: ['/shared/events/feature-events.ts'],
        modifiedFiles: violation.affectedFiles,
        deletedFiles: []
      }
    }));
  }

  private generateArchitecturalRecommendations(violations: ComplianceViolation[]): RefactoringRecommendation[] {
    return violations.map(violation => ({
      type: 'create_facade' as const,
      priority: 'low' as const,
      description: `Address architectural violation: ${violation.description}`,
      affectedFiles: violation.affectedFiles,
      affectedFunctions: violation.affectedFunctions,
      estimatedEffort: 'medium' as const,
      benefits: ['Improves architecture', 'Better separation of concerns'],
      implementation: {
        steps: [
          {
            order: 1,
            description: 'Review and document architectural decision',
            action: 'create_file' as const,
            details: { documentType: 'architectural_decision' }
          }
        ],
        newFiles: [],
        modifiedFiles: [],
        deletedFiles: []
      }
    }));
  }

  private getPriorityWeight(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 1;
      case 'medium': return 2;
      case 'low': return 3;
    }
  }

  private getAllFunctionPairs(dependencyGraph: DependencyGraph): Array<{function1: string, function2: string, feature1: string, feature2: string}> {
    const pairs: Array<{function1: string, function2: string, feature1: string, feature2: string}> = [];
    const functions = dependencyGraph.nodes.map(n => n.id);

    for (let i = 0; i < functions.length; i++) {
      for (let j = i + 1; j < functions.length; j++) {
        const feature1 = this.extractFeatureFromNode(functions[i]);
        const feature2 = this.extractFeatureFromNode(functions[j]);
        
        if (feature1 && feature2 && feature1 !== feature2) {
          pairs.push({
            function1: functions[i],
            function2: functions[j],
            feature1,
            feature2
          });
        }
      }
    }

    return pairs;
  }

  private calculateCouplingStrength(pair: {function1: string, function2: string}, dependencyGraph: DependencyGraph): number {
    // Simple coupling calculation based on shared dependencies
    const deps1 = dependencyGraph.edges.filter(e => e.from === pair.function1).map(e => e.to);
    const deps2 = dependencyGraph.edges.filter(e => e.from === pair.function2).map(e => e.to);
    
    const sharedDeps = deps1.filter(d => deps2.includes(d));
    const totalDeps = new Set([...deps1, ...deps2]).size;
    
    return totalDeps > 0 ? sharedDeps.length / totalDeps : 0;
  }

  private determineCouplingType(pair: CoupledFunctionPair, dependencyGraph: DependencyGraph): 'data_coupling' | 'control_coupling' | 'common_coupling' | 'content_coupling' {
    // Simplified coupling type determination
    const sharedCount = pair.sharedDependencies.length;
    
    if (sharedCount > 5) return 'common_coupling';
    if (sharedCount > 2) return 'data_coupling';
    return 'control_coupling';
  }

  private findSharedDependencies(pair: {function1: string, function2: string}, dependencyGraph: DependencyGraph): string[] {
    const deps1 = dependencyGraph.edges.filter(e => e.from === pair.function1).map(e => e.to);
    const deps2 = dependencyGraph.edges.filter(e => e.from === pair.function2).map(e => e.to);
    
    return deps1.filter(d => deps2.includes(d));
  }

  private calculateOverallCouplingScore(coupledFunctions: CoupledFunctionPair[]): number {
    if (coupledFunctions.length === 0) return 0;
    
    const totalStrength = coupledFunctions.reduce((sum, cf) => sum + cf.couplingStrength, 0);
    return totalStrength / coupledFunctions.length;
  }

  private createTightCouplingViolation(pair: CoupledFunctionPair): ComplianceViolation {
    return {
      type: 'tight_coupling',
      severity: pair.couplingStrength > 0.9 ? 'error' : 'warning',
      description: `Tight coupling between ${pair.function1} and ${pair.function2}`,
      affectedFiles: [],
      affectedFunctions: [pair.function1, pair.function2],
      recommendation: `Reduce coupling through ${this.getCouplingReductionStrategy(pair.couplingType)}`
    };
  }

  private getCouplingReductionStrategy(couplingType: 'data_coupling' | 'control_coupling' | 'common_coupling' | 'content_coupling'): string {
    switch (couplingType) {
      case 'content_coupling':
        return 'proper encapsulation and interfaces';
      case 'common_coupling':
        return 'dependency injection or shared services';
      case 'control_coupling':
        return 'event-driven communication';
      case 'data_coupling':
        return 'data transfer objects and clear interfaces';
    }
  }

  private identifyImprovementAreas(violations: ComplianceViolation[]): string[] {
    const areas = new Set<string>();
    
    violations.forEach(violation => {
      switch (violation.type) {
        case 'circular_dependency':
          areas.add('Dependency Management');
          break;
        case 'cross_feature_violation':
          areas.add('Feature Isolation');
          break;
        case 'tight_coupling':
          areas.add('Code Coupling');
          break;
        case 'architectural_violation':
          areas.add('Architecture Compliance');
          break;
      }
    });

    return Array.from(areas);
  }

  private getDefaultComplianceRules(): FSDComplianceRules {
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
  }
}