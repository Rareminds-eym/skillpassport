import {
  APIFunction,
  StandardizationChange,
  NamingConvention,
  SignatureStandard,
  ErrorHandlingPattern,
  ResponseTypeStandard,
  RequestPatternStandard
} from '../types';
import { StandardizationConfig } from './StandardizationConfig';
import { MigrationLogger } from '../logging/MigrationLogger';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CodeTransformer {
  private logger: MigrationLogger;

  constructor(logger: MigrationLogger) {
    this.logger = logger;
  }

  async applyNamingStandardization(functions: APIFunction[], changes: StandardizationChange[]): Promise<void> {
    const namingChanges = changes.filter(c => c.changeType === 'naming');
    
    for (const change of namingChanges) {
      await this.updateFunctionName(change);
    }
  }

  async applySignatureStandardization(functions: APIFunction[], changes: StandardizationChange[]): Promise<void> {
    const signatureChanges = changes.filter(c => c.changeType === 'signature');
    
    for (const change of signatureChanges) {
      await this.updateFunctionSignature(change);
    }
  }

  async applyErrorHandlingStandardization(functions: APIFunction[], changes: StandardizationChange[]): Promise<void> {
    const errorHandlingChanges = changes.filter(c => c.changeType === 'error-handling');
    
    for (const change of errorHandlingChanges) {
      await this.updateErrorHandling(change);
    }
  }

  async applyResponseTypeStandardization(functions: APIFunction[], changes: StandardizationChange[]): Promise<void> {
    const responseTypeChanges = changes.filter(c => c.changeType === 'response-type');
    
    for (const change of responseTypeChanges) {
      await this.updateResponseType(change);
    }
  }

  async applyRequestPatternStandardization(functions: APIFunction[], changes: StandardizationChange[]): Promise<void> {
    const requestPatternChanges = changes.filter(c => c.changeType === 'request-pattern');
    
    for (const change of requestPatternChanges) {
      await this.updateRequestPattern(change);
    }
  }

  async generateStandardizedTypes(): Promise<void> {
    const typeStandards = StandardizationConfig.getTypeScriptTypeStandards();
    const typesDir = 'src/shared/types';
    
    // Ensure types directory exists
    await fs.mkdir(typesDir, { recursive: true });
    
    // Generate standard API types file
    const apiTypesContent = this.generateApiTypesFile(typeStandards);
    await fs.writeFile(path.join(typesDir, 'api.ts'), apiTypesContent);
    
    this.logger.info('Generated standardized API types');
  }

  private async updateFunctionName(change: StandardizationChange): Promise<void> {
    try {
      const filePath = change.filePath;
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Update function declaration
      let updatedContent = content.replace(
        new RegExp(`(function\\s+|const\\s+|export\\s+(?:function\\s+|const\\s+))${change.oldValue}`, 'g'),
        `$1${change.newValue}`
      );
      
      // Update function calls within the same file
      updatedContent = updatedContent.replace(
        new RegExp(`\\b${change.oldValue}\\s*\\(`, 'g'),
        `${change.newValue}(`
      );
      
      await fs.writeFile(filePath, updatedContent);
      this.logger.debug(`Updated function name from ${change.oldValue} to ${change.newValue} in ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to update function name in ${change.filePath}`, { error });
      throw error;
    }
  }

  private async updateFunctionSignature(change: StandardizationChange): Promise<void> {
    try {
      const filePath = change.filePath;
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract function name from the change
      const functionName = change.functionName;
      
      // Find and replace the function signature
      const functionRegex = new RegExp(
        `((?:export\\s+)?(?:async\\s+)?function\\s+${functionName}\\s*)\\([^)]*\\)\\s*:\\s*[^{]+`,
        'g'
      );
      
      const updatedContent = content.replace(functionRegex, `$1${change.newValue}`);
      
      await fs.writeFile(filePath, updatedContent);
      this.logger.debug(`Updated function signature for ${functionName} in ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to update function signature in ${change.filePath}`, { error });
      throw error;
    }
  }

  private async updateErrorHandling(change: StandardizationChange): Promise<void> {
    try {
      const filePath = change.filePath;
      const content = await fs.readFile(filePath, 'utf-8');
      
      const functionName = change.functionName;
      const errorHandlingPatterns = StandardizationConfig.getErrorHandlingPatterns();
      const standardPattern = errorHandlingPatterns['standard'];
      
      // Generate standardized error handling code
      const standardErrorHandling = this.generateErrorHandlingCode(functionName, standardPattern);
      
      // Find the function and wrap its body with standard error handling
      const functionBodyRegex = new RegExp(
        `((?:export\\s+)?(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*:\\s*[^{]+\\s*{)([^}]+)(})`,
        's'
      );
      
      const updatedContent = content.replace(functionBodyRegex, (match, start, body, end) => {
        return start + standardErrorHandling.replace('{{functionBody}}', body.trim()) + end;
      });
      
      await fs.writeFile(filePath, updatedContent);
      this.logger.debug(`Updated error handling for ${functionName} in ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to update error handling in ${change.filePath}`, { error });
      throw error;
    }
  }

  private async updateResponseType(change: StandardizationChange): Promise<void> {
    try {
      const filePath = change.filePath;
      const content = await fs.readFile(filePath, 'utf-8');
      
      const functionName = change.functionName;
      
      // Update the return type in function signature
      const signatureRegex = new RegExp(
        `((?:export\\s+)?(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*:\\s*)([^{]+)`,
        'g'
      );
      
      const updatedContent = content.replace(signatureRegex, `$1${change.newValue}`);
      
      await fs.writeFile(filePath, updatedContent);
      this.logger.debug(`Updated response type for ${functionName} in ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to update response type in ${change.filePath}`, { error });
      throw error;
    }
  }

  private async updateRequestPattern(change: StandardizationChange): Promise<void> {
    try {
      const filePath = change.filePath;
      const content = await fs.readFile(filePath, 'utf-8');
      
      const functionName = change.functionName;
      const requestPatternStandard = StandardizationConfig.getRequestPatternStandards();
      
      // Add parameter validation at the beginning of the function
      const validationCode = this.generateParameterValidation(functionName, requestPatternStandard);
      
      // Find the function body and add validation
      const functionBodyRegex = new RegExp(
        `((?:export\\s+)?(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*:\\s*[^{]+\\s*{)`,
        'g'
      );
      
      const updatedContent = content.replace(functionBodyRegex, `$1\n${validationCode}\n`);
      
      await fs.writeFile(filePath, updatedContent);
      this.logger.debug(`Updated request pattern for ${functionName} in ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to update request pattern in ${change.filePath}`, { error });
      throw error;
    }
  }

  private generateErrorHandlingCode(functionName: string, pattern: ErrorHandlingPattern): string {
    return pattern.implementation
      .replace(/{{functionName}}/g, functionName)
      .replace(/{{parameters}}/g, 'parameters')
      .replace(/{{logParameters}}/g, 'parameters')
      .replace(/{{returnType}}/g, 'Promise<ApiResponse<any>>')
      .replace(/{{functionBody}}/g, '{{functionBody}}'); // Placeholder for actual function body
  }

  private generateParameterValidation(functionName: string, standard: RequestPatternStandard): string {
    return `  // Parameter validation
  ${standard.parameterValidation
    .replace(/{{validationSchema}}/g, '// Add validation schema here')
    .replace(/{{parameters}}/g, 'parameters')}`;
  }

  private generateApiTypesFile(typeStandards: Record<string, string>): string {
    const imports = `// Standard API types for FSD migration
// Generated automatically - do not modify manually

`;

    const typeDefinitions = Object.entries(typeStandards)
      .map(([name, definition]) => definition.trim())
      .join('\n\n');

    const exports = `
// Export all types
export {
  ApiResponse,
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ApiRequestOptions,
  PaginationOptions,
  FilterOptions
};

// Type utilities
export type ApiFunction<T = any> = (...args: any[]) => Promise<ApiResponse<T>>;
export type ApiErrorHandler = (error: ApiError) => void;
export type ApiSuccessHandler<T> = (response: ApiResponse<T>) => void;
`;

    return imports + typeDefinitions + exports;
  }

  async ensureImportsAreUpdated(filePath: string, requiredImports: string[]): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check if imports already exist
      const existingImports = this.extractExistingImports(content);
      const missingImports = requiredImports.filter(imp => !existingImports.includes(imp));
      
      if (missingImports.length === 0) return;
      
      // Add missing imports
      const importStatement = `import { ${missingImports.join(', ')} } from '../shared/types/api';\n`;
      
      // Find the best place to insert imports (after existing imports or at the top)
      const importInsertionPoint = this.findImportInsertionPoint(content);
      const updatedContent = content.slice(0, importInsertionPoint) + 
                           importStatement + 
                           content.slice(importInsertionPoint);
      
      await fs.writeFile(filePath, updatedContent);
      this.logger.debug(`Added missing imports to ${filePath}: ${missingImports.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to update imports in ${filePath}`, { error });
      throw error;
    }
  }

  private extractExistingImports(content: string): string[] {
    const importRegex = /import\s+{([^}]+)}\s+from/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importList = match[1].split(',').map(imp => imp.trim());
      imports.push(...importList);
    }
    
    return imports;
  }

  private findImportInsertionPoint(content: string): number {
    // Find the last import statement
    const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?\s*\n/g;
    let lastImportEnd = 0;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      lastImportEnd = match.index + match[0].length;
    }
    
    return lastImportEnd;
  }
}