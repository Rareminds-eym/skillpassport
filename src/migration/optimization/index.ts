export { BundleAnalyzer } from './BundleAnalyzer';
export type { BundleAnalysis, Dependency, BundleMetrics } from './BundleAnalyzer';

export { DependencyAnalyzer } from './DependencyAnalyzer';
export type { DependencyOptimization } from './DependencyAnalyzer';

export { TreeShakingDetector } from './TreeShakingDetector';
export type { TreeShakingOpportunity } from './TreeShakingDetector';

export { CodeSplitter } from './CodeSplitter';
export type { CodeSplittingResult, RouteInfo } from './CodeSplitter';

export { BundleOptimizer } from './BundleOptimizer';
export type { OptimizationOpportunity, OptimizationResult } from './BundleOptimizer';

export { PerformanceAnalyzer } from './PerformanceAnalyzer';
export type { 
  ComponentMetrics, 
  RerenderAnalysis, 
  ComputationAnalysis, 
  StoreOptimization, 
  PerformanceAnalysis 
} from './PerformanceAnalyzer';

export { PerformanceOptimizer } from './PerformanceOptimizer';
export type { 
  PerformanceOptimization, 
  OptimizationResult as PerformanceOptimizationResult, 
  PerformanceMetrics, 
  MetricSnapshot 
} from './PerformanceOptimizer';

export { ResourceOptimizer } from './ResourceOptimizer';
export type { 
  VirtualizationCandidate, 
  LazyLoadCandidate, 
  ResourceOptimizationResult 
} from './ResourceOptimizer';
