import {
  TightCouplingAnalysis,
  CoupledFunctionPair,
  DependencyGraph,
  RefactoringRecommendation
} from '@/features/student-profile/model';

export class TightCouplingAnalyzer {
  analyzeTightCoupling(dependencyGraph: DependencyGraph): TightCouplingAnalysis {
    const coupledFunctions = this.identifyCoupledFunctions(dependencyGraph);
    const couplingScore = this.calculateOverallCouplingScore(coupledFunctions);
    const recommendations = this.generateCouplingRecommendations(coupledFunctions);

    return {
      coupledFunctions,
      couplingScore,
      recommendations
    };
  }

  private identifyCoupledFunctions(dependencyGraph: DependencyGraph): CoupledFunctionPair[] {
    const coupledPairs: CoupledFunctionPair[] = [];
    const functionPairs = this.getAllFunctionPairs(dependencyGraph);

    for (const pair of functionPairs) {
      const couplingStrength = this.calculateCouplingStrength(pair, dependencyGraph);
      
      if (couplingStrength > 0.5) { // Threshold for considering functions coupled
        coupledPairs.push({
          ...pair,
          couplingStrength,
          couplingType: this.determineCouplingType(pair, dependencyGraph),
          sharedDependencies: this.findSharedDependencies(pair, dependencyGraph)
        });
      }
    }

    return coupledPairs.sort((a, b) => b.couplingStrength - a.couplingStrength);
  }

  private getAllFunctionPairs(dependencyGraph: DependencyGraph): Array<{
    function1: string;
    function2: string;
    feature1: string;
    feature2: string;
  }> {
    const pairs: Array<{function1: string, function2: string, feature1: string, feature2: string}> = [];
    const functions = dependencyGraph.nodes.map(n => n.id);

    for (let i = 0; i < functions.length; i++) {
      for (let j = i + 1; j < functions.length; j++) {
        const feature1 = this.extractFeatureFromPath(functions[i]);
        const feature2 = this.extractFeatureFromPath(functions[j]);
        
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

  private calculateCouplingStrength(
    pair: {function1: string, function2: string},
    dependencyGraph: DependencyGraph
  ): number {
    const deps1 = this.getFunctionDependencies(pair.function1, dependencyGraph);
    const deps2 = this.getFunctionDependencies(pair.function2, dependencyGraph);
    
    const sharedDeps = deps1.filter(d => deps2.includes(d));
    const totalUniqueDeps = new Set([...deps1, ...deps2]).size;
    
    if (totalUniqueDeps === 0) return 0;
    
    // Calculate coupling based on shared dependencies ratio
    const sharedRatio = sharedDeps.length / totalUniqueDeps;
    
    // Also consider direct dependencies between the functions
    const hasDirectDependency = this.hasDirectDependency(pair.function1, pair.function2, dependencyGraph);
    const directDependencyBonus = hasDirectDependency ? 0.3 : 0;
    
    return Math.min(1, sharedRatio + directDependencyBonus);
  }

  private getFunctionDependencies(functionId: string, dependencyGraph: DependencyGraph): string[] {
    return dependencyGraph.edges
      .filter(edge => edge.from === functionId)
      .map(edge => edge.to);
  }

  private hasDirectDependency(
    function1: string,
    function2: string,
    dependencyGraph: DependencyGraph
  ): boolean {
    return dependencyGraph.edges.some(edge =>
      (edge.from === function1 && edge.to === function2) ||
      (edge.from === function2 && edge.to === function1)
    );
  }

  private findSharedDependencies(
    pair: {function1: string, function2: string},
    dependencyGraph: DependencyGraph
  ): string[] {
    const deps1 = this.getFunctionDependencies(pair.function1, dependencyGraph);
    const deps2 = this.getFunctionDependencies(pair.function2, dependencyGraph);
    
    return deps1.filter(d => deps2.includes(d));
  }

  private determineCouplingType(
    pair: CoupledFunctionPair,
    dependencyGraph: DependencyGraph
  ): 'data_coupling' | 'control_coupling' | 'common_coupling' | 'content_coupling' {
    const sharedCount = pair.sharedDependencies.length;
    const hasDirectDep = this.hasDirectDependency(pair.function1, pair.function2, dependencyGraph);

    if (hasDirectDep && sharedCount > 3) return 'content_coupling';
    if (sharedCount > 5) return 'common_coupling';
    if (hasDirectDep) return 'control_coupling';
    return 'data_coupling';
  }

  private calculateOverallCouplingScore(coupledFunctions: CoupledFunctionPair[]): number {
    if (coupledFunctions.length === 0) return 0;
    
    const totalStrength = coupledFunctions.reduce((sum, cf) => sum + cf.couplingStrength, 0);
    return totalStrength / coupledFunctions.length;
  }

  private generateCouplingRecommendations(coupledFunctions: CoupledFunctionPair[]): RefactoringRecommendation[] {
    return coupledFunctions
      .filter(cf => cf.couplingStrength > 0.7)
      .map(cf => ({
        type: 'decouple_features' as const,
        priority: cf.couplingStrength > 0.9 ? 'high' as const : 'medium' as const,
        description: `Reduce coupling between ${cf.function1} and ${cf.function2} (strength: ${cf.couplingStrength.toFixed(2)})`,
        affectedFiles: [],
        affectedFunctions: [cf.function1, cf.function2],
        estimatedEffort: this.estimateDecouplingEffort(cf),
        benefits: this.getDecouplingBenefits(cf.couplingType),
        implementation: this.createDecouplingImplementation(cf)
      }));
  }

  private estimateDecouplingEffort(coupledPair: CoupledFunctionPair): 'small' | 'medium' | 'large' {
    if (coupledPair.couplingStrength > 0.9 || coupledPair.sharedDependencies.length > 10) {
      return 'large';
    }
    if (coupledPair.couplingStrength > 0.7 || coupledPair.sharedDependencies.length > 5) {
      return 'medium';
    }
    return 'small';
  }

  private getDecouplingBenefits(couplingType: string): string[] {
    const baseBenefits = ['Reduces coupling', 'Improves maintainability', 'Enables independent development'];

    switch (couplingType) {
      case 'content_coupling':
        return [...baseBenefits, 'Improves encapsulation', 'Reduces fragility'];
      case 'common_coupling':
        return [...baseBenefits, 'Reduces shared state issues', 'Improves testability'];
      case 'control_coupling':
        return [...baseBenefits, 'Improves flexibility', 'Reduces control dependencies'];
      default:
        return baseBenefits;
    }
  }

  private createDecouplingImplementation(coupledPair: CoupledFunctionPair): any {
    return {
      steps: [
        {
          order: 1,
          description: 'Extract shared dependencies to common utilities',
          action: 'create_file',
          details: {
            targetPath: 'src/shared/api/common-utilities.ts',
            sharedDependencies: coupledPair.sharedDependencies
          }
        },
        {
          order: 2,
          description: 'Introduce interface or event-driven communication',
          action: 'create_file',
          details: {
            pattern: coupledPair.couplingType === 'control_coupling' ? 'events' : 'interface',
            features: [coupledPair.feature1, coupledPair.feature2]
          }
        }
      ],
      newFiles: ['src/shared/api/common-utilities.ts'],
      modifiedFiles: [coupledPair.function1, coupledPair.function2],
      deletedFiles: []
    };
  }

  private extractFeatureFromPath(path: string): string | null {
    const match = path.match(/features\/([^\/]+)/);
    return match ? match[1] : null;
  }
}