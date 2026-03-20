export interface ImportStatement {
  filePath: string;
  importPath: string;
  importType: 'internal' | 'external' | 'fsd-layer';
  isRelative: boolean;
  usesAlias: boolean;
  line: number;
  namedImports: string[];
  defaultImport?: string;
}

export interface ImportViolation {
  type: 'cross-layer-relative' | 'missing-alias' | 'deep-import' | 'upward-dependency';
  severity: 'error' | 'warning';
  filePath: string;
  line: number;
  importPath: string;
  message: string;
  suggestion?: string;
}

export interface ImportPathAnalysis {
  totalImports: number;
  imports: ImportStatement[];
  violations: ImportViolation[];
  violationsByType: Record<string, ImportViolation[]>;
  statistics: {
    totalImports: number;
    relativeImports: number;
    aliasImports: number;
    externalImports: number;
    fsdLayerImports: number;
    violationCount: number;
    errorCount: number;
    warningCount: number;
    complianceRate: string;
  };
}

export interface RefactoringChange {
  filePath: string;
  line: number;
  changeType: string;
  oldImport: string;
  newImport: string;
  oldLine: string;
  newLine: string;
}

export interface RefactoringResult {
  success: boolean;
  changes: RefactoringChange[];
  filesModified: string[];
  errors: string[];
  statistics: {
    totalChanges: number;
    filesModified: number;
    changesByType: Record<string, number>;
  };
}

export interface PathMapping {
  alias: string;
  paths: string[];
}

export interface TypeScriptConfigUpdate {
  success: boolean;
  configPath: string;
  originalPaths: Record<string, string[]>;
  updatedPaths: Record<string, string[]>;
  addedMappings: PathMapping[];
  modifiedMappings: PathMapping[];
  error?: string;
}

export interface PathPattern {
  pattern: RegExp;
  replacement: string;
  description: string;
}

export interface ImportPathStandardizationResult {
  analysis: ImportPathAnalysis;
  refactoring: RefactoringResult;
  configUpdate: TypeScriptConfigUpdate;
  success: boolean;
  summary: {
    totalViolationsFound: number;
    totalViolationsFixed: number;
    filesAnalyzed: number;
    filesModified: number;
    configUpdated: boolean;
  };
}
