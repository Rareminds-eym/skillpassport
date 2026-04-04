/**
 * Duplicate Code Consolidation - Type Definitions
 */

export interface DuplicateGroup {
  id: string;
  files: string[];
  similarity: number;
  canonicalLocation: string;
  consolidationStrategy: 'merge' | 'replace' | 'extract';
  codeBlocks: CodeBlock[];
}

export interface CodeBlock {
  file: string;
  startLine: number;
  endLine: number;
  code: string;
  hash: string;
  ast?: any;
}

export interface SemanticAnalysis {
  functionalEquivalence: boolean;
  typeCompatibility: boolean;
  sideEffects: string[];
  dependencies: string[];
  confidence: number;
}

export interface ConsolidationResult {
  success: boolean;
  duplicateGroup: DuplicateGroup;
  canonicalFile: string;
  updatedFiles: string[];
  importPathUpdates: ImportPathUpdate[];
  codeReduction: {
    linesRemoved: number;
    filesAffected: number;
    percentageReduction: number;
  };
  errors: string[];
}

export interface ImportPathUpdate {
  file: string;
  oldImport: string;
  newImport: string;
  line: number;
}

export interface DuplicateScanResult {
  totalDuplicates: number;
  duplicateGroups: DuplicateGroup[];
  potentialSavings: {
    totalLines: number;
    estimatedPercentage: number;
  };
  scanMetadata: {
    filesScanned: number;
    timeElapsed: number;
    timestamp: Date;
  };
}

export interface ConsolidationReport {
  totalConsolidations: number;
  successfulConsolidations: number;
  failedConsolidations: number;
  codeReduction: {
    totalLinesRemoved: number;
    totalFilesAffected: number;
    percentageReduction: number;
  };
  consolidations: ConsolidationResult[];
  errors: Array<{
    duplicateGroupId: string;
    error: string;
  }>;
}

export interface FSDLayerRules {
  preferredLocations: {
    [pattern: string]: string;
  };
  layerHierarchy: string[];
}
