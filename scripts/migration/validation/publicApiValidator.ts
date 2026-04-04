/**
 * Public API Validator
 * 
 * Validates that all imports use public APIs (index.ts) rather than
 * direct internal file imports.
 * 
 * Requirements: 14.8
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PublicApiReport {
  totalViolations: number;
  violationsByModule: {
    features: number;
    entities: number;
    widgets: number;
  };
  violations: PublicApiViolation[];
  timestamp: Date;
}

export interface PublicApiViolation {
  file: string;
  line: number;
  importPath: string;
  moduleType: 'features' | 'entities' | 'widgets';
  moduleName: string;
  internalPath: string;
  suggestedFix: string;
}

export class PublicApiValidator {
  private srcPath: string;

  constructor(srcPath: string = 'src') {
    this.srcPath = srcPath;
  }

  /**
   * Generate public API validation report
   */
  async generateReport(): Promise<PublicApiReport> {
    const violations = await this.detectAllViolations();
    
    const violationsByModule = {
      features: violations.filter(v => v.moduleType === 'features').length,
      entities: violations.filter(v => v.moduleType === 'entities').length,
      widgets: violations.filter(v => v.moduleType === 'widgets').length
    };

    return {
      totalViolations: violations.length,
      violationsByModule,
      violations,
      timestamp: new Date()
    };
  }

  /**
   * Detect all public API violations
   */
  private async detectAllViolations(): Promise<PublicApiViolation[]> {
    const violations: PublicApiViolation[] = [];
    const allFiles = this.getFilesRecursively(this.srcPath, ['.ts', '.tsx', '.js', '.jsx'])
      .filter(file => !file.includes('migration') && !file.includes('__tests__'));

    for (const file of allFiles) {
      const fileViolations = this.checkFileViolations(file);
      violations.push(...fileViolations);
    }

    return violations;
  }

  /**
   * Check violations in a single file
   */
  private checkFileViolations(filePath: string): PublicApiViolation[] {
    const violations: PublicApiViolation[] = [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = this.extractImportsWithLines(content);

    for (const { importPath, line } of imports) {
      const violation = this.checkViolation(filePath, line, importPath);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  /**
   * Check if import violates public API usage
   */
  private checkViolation(
    file: string,
    line: number,
    importPath: string
  ): PublicApiViolation | null {
    // Only check imports from features, entities, and widgets
    if (!importPath.startsWith('@/features/') && 
        !importPath.startsWith('@/entities/') && 
        !importPath.startsWith('@/widgets/')) {
      return null;
    }

    const parts = importPath.split('/');
    
    // Valid patterns:
    // @/features/auth
    // @/features/auth/index
    // @/entities/user
    // @/widgets/student-dashboard
    
    // Invalid patterns:
    // @/features/auth/ui/LoginForm
    // @/features/auth/api/authService
    // @/features/auth/model/useAuth
    // @/entities/user/model/types
    
    if (parts.length > 3 || (parts.length === 3 && parts[2] !== 'index')) {
      // Has internal path like /ui/, /api/, /model/, /lib/
      const moduleType = parts[1] as 'features' | 'entities' | 'widgets';
      const moduleName = parts[2];
      const internalPath = parts.slice(3).join('/');
      const suggestedFix = `@/${parts[1]}/${moduleName}`;
      
      return {
        file,
        line,
        importPath,
        moduleType,
        moduleName,
        internalPath,
        suggestedFix
      };
    }

    return null;
  }

  /**
   * Extract imports with line numbers
   */
  private extractImportsWithLines(content: string): Array<{ importPath: string; line: number }> {
    const imports: Array<{ importPath: string; line: number }> = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match ES6 imports: import ... from '...'
      const importMatch = line.match(/import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/);
      if (importMatch) {
        imports.push({ importPath: importMatch[1], line: i + 1 });
      }

      // Match dynamic imports: import('...')
      const dynamicMatch = line.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
      if (dynamicMatch) {
        imports.push({ importPath: dynamicMatch[1], line: i + 1 });
      }
    }

    return imports;
  }

  /**
   * Recursively get all files with specific extensions
   */
  private getFilesRecursively(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const traverse = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            traverse(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    traverse(dir);
    return files;
  }

  /**
   * Print public API report
   */
  printReport(report: PublicApiReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('PUBLIC API VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`\nTotal Violations: ${report.totalViolations}`);
    console.log(`Timestamp: ${report.timestamp.toISOString()}\n`);

    console.log('Violations by Module Type:');
    console.log(`  Features: ${report.violationsByModule.features}`);
    console.log(`  Entities: ${report.violationsByModule.entities}`);
    console.log(`  Widgets:  ${report.violationsByModule.widgets}\n`);

    if (report.violations.length > 0) {
      console.log('Top 20 Violations:\n');
      
      report.violations.slice(0, 20).forEach((v, i) => {
        console.log(`${i + 1}. ${path.relative(this.srcPath, v.file)}:${v.line}`);
        console.log(`   Import: ${v.importPath}`);
        console.log(`   Fix:    ${v.suggestedFix}\n`);
      });

      if (report.violations.length > 20) {
        console.log(`... and ${report.violations.length - 20} more violations\n`);
      }

      // Group by module
      const byModule = new Map<string, PublicApiViolation[]>();
      for (const v of report.violations) {
        const key = `${v.moduleType}/${v.moduleName}`;
        if (!byModule.has(key)) {
          byModule.set(key, []);
        }
        byModule.get(key)!.push(v);
      }

      console.log('\nMost Violated Modules:');
      const sorted = Array.from(byModule.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10);

      sorted.forEach(([module, violations], i) => {
        console.log(`  ${i + 1}. ${module}: ${violations.length} violations`);
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  /**
   * Save report to JSON file
   */
  async saveReport(report: PublicApiReport, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Public API report saved to: ${outputPath}`);
  }
}

// CLI execution
const validator = new PublicApiValidator();

validator.generateReport()
  .then(report => {
    validator.printReport(report);
    return validator.saveReport(report, 'src/migration/reports/public-api-report.json');
  })
  .catch(error => {
    console.error('Error generating public API report:', error);
    process.exit(1);
  });
