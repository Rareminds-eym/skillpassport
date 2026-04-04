#!/usr/bin/env tsx
/**
 * Refactor Pages to Composition-Only
 * 
 * This script ensures all page components:
 * 1. Only import from features/, widgets/, and shared/
 * 2. Contain no business logic (Supabase calls, state management, data transformations)
 * 3. Are pure composition of UI components
 * 
 * Requirements: 2.7
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface PageAnalysis {
  filePath: string;
  hasSupabaseCalls: boolean;
  hasBusinessLogic: boolean;
  invalidImports: string[];
  validImports: string[];
  issues: string[];
  isCompositionOnly: boolean;
}

interface RefactoringReport {
  totalPages: number;
  compositionOnlyPages: number;
  pagesNeedingRefactor: PageAnalysis[];
  summary: {
    pagesWithSupabase: number;
    pagesWithBusinessLogic: number;
    pagesWithInvalidImports: number;
  };
}

const PAGES_DIR = path.join(process.cwd(), 'src', 'pages');
const VALID_IMPORT_PATTERNS = [
  /^@\/features\//,
  /^@\/widgets\//,
  /^@\/shared\//,
  /^@\/app\//,
  /^react$/,
  /^react-router/,
  /^@heroicons\//,
  /^lucide-react$/,
  /^\.\.\//,  // Relative imports within pages
  /^\.\//,    // Relative imports within pages
];

const BUSINESS_LOGIC_PATTERNS = [
  'supabase.from',
  'supabase.rpc',
  'supabase.auth',
  'useState',
  'useEffect',
  'useMemo',
  'useCallback',
  'useReducer',
];

class PageRefactorer {
  private report: RefactoringReport = {
    totalPages: 0,
    compositionOnlyPages: 0,
    pagesNeedingRefactor: [],
    summary: {
      pagesWithSupabase: 0,
      pagesWithBusinessLogic: 0,
      pagesWithInvalidImports: 0,
    },
  };

  async refactorPages(): Promise<void> {
    console.log('🔍 Analyzing pages for composition-only refactoring...\n');

    const pageFiles = this.getAllPageFiles(PAGES_DIR);
    this.report.totalPages = pageFiles.length;

    for (const filePath of pageFiles) {
      const analysis = await this.analyzePage(filePath);
      
      if (!analysis.isCompositionOnly) {
        this.report.pagesNeedingRefactor.push(analysis);
        
        if (analysis.hasSupabaseCalls) {
          this.report.summary.pagesWithSupabase++;
        }
        if (analysis.hasBusinessLogic) {
          this.report.summary.pagesWithBusinessLogic++;
        }
        if (analysis.invalidImports.length > 0) {
          this.report.summary.pagesWithInvalidImports++;
        }
      } else {
        this.report.compositionOnlyPages++;
      }
    }

    this.printReport();
  }

  private getAllPageFiles(dir: string): string[] {
    const files: string[] = [];
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...this.getAllPageFiles(fullPath));
      } else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private async analyzePage(filePath: string): Promise<PageAnalysis> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);

    const analysis: PageAnalysis = {
      filePath: relativePath,
      hasSupabaseCalls: false,
      hasBusinessLogic: false,
      invalidImports: [],
      validImports: [],
      issues: [],
      isCompositionOnly: true,
    };

    // Check for Supabase calls
    if (/supabase\.(from|rpc|auth)/.test(content)) {
      analysis.hasSupabaseCalls = true;
      analysis.isCompositionOnly = false;
      analysis.issues.push('Contains direct Supabase calls');
    }

    // Check for business logic patterns
    const businessLogicFound: string[] = [];
    for (const pattern of BUSINESS_LOGIC_PATTERNS) {
      if (content.includes(pattern)) {
        businessLogicFound.push(pattern);
      }
    }

    // Special handling: useState/useEffect are OK if they're just for UI state
    // But if combined with data fetching, it's business logic
    if (businessLogicFound.length > 0) {
      // Check if it's just UI state or actual business logic
      const hasDataFetching = /fetch|axios|supabase|api/.test(content);
      const hasComplexState = /useReducer|useContext/.test(content);
      
      if (hasDataFetching || hasComplexState || businessLogicFound.includes('supabase.from')) {
        analysis.hasBusinessLogic = true;
        analysis.isCompositionOnly = false;
        analysis.issues.push(`Contains business logic: ${businessLogicFound.join(', ')}`);
      }
    }

    // Analyze imports
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (!ts.isStringLiteral(moduleSpecifier)) return;
        
        const moduleText = moduleSpecifier.text;
        
        const isValid = VALID_IMPORT_PATTERNS.some(pattern => pattern.test(moduleText));
        
        if (isValid) {
          analysis.validImports.push(moduleText);
        } else {
          // Check for legacy imports
          if (
            moduleText.includes('@/services/') ||
            moduleText.includes('@/hooks/') ||
            moduleText.includes('@/utils/') ||
            moduleText.includes('@/types/') ||
            moduleText.includes('@/config/') ||
            moduleText.includes('@/lib/') ||
            moduleText.includes('@/components/')
          ) {
            analysis.invalidImports.push(moduleText);
            analysis.isCompositionOnly = false;
            analysis.issues.push(`Invalid import: ${moduleText}`);
          }
        }
      }
    });

    return analysis;
  }

  private printReport(): void {
    console.log('\n📊 Page Refactoring Analysis Report\n');
    console.log('='.repeat(80));
    console.log(`Total Pages: ${this.report.totalPages}`);
    console.log(`Composition-Only Pages: ${this.report.compositionOnlyPages} (${Math.round(this.report.compositionOnlyPages / this.report.totalPages * 100)}%)`);
    console.log(`Pages Needing Refactor: ${this.report.pagesNeedingRefactor.length}`);
    console.log('='.repeat(80));
    console.log('\nSummary:');
    console.log(`  - Pages with Supabase calls: ${this.report.summary.pagesWithSupabase}`);
    console.log(`  - Pages with business logic: ${this.report.summary.pagesWithBusinessLogic}`);
    console.log(`  - Pages with invalid imports: ${this.report.summary.pagesWithInvalidImports}`);
    console.log('='.repeat(80));

    if (this.report.pagesNeedingRefactor.length > 0) {
      console.log('\n⚠️  Pages Needing Refactoring:\n');
      
      for (const page of this.report.pagesNeedingRefactor) {
        console.log(`\n📄 ${page.filePath}`);
        console.log(`   Issues:`);
        for (const issue of page.issues) {
          console.log(`     - ${issue}`);
        }
        
        if (page.invalidImports.length > 0) {
          console.log(`   Invalid Imports:`);
          for (const imp of page.invalidImports) {
            console.log(`     - ${imp}`);
          }
        }
      }
      
      console.log('\n💡 Next Steps:');
      console.log('   1. Review pages with Supabase calls - extract to feature services');
      console.log('   2. Review pages with business logic - extract to feature hooks');
      console.log('   3. Update invalid imports to use feature/widget public APIs');
    } else {
      console.log('\n✅ All pages are composition-only!');
    }

    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  const refactorer = new PageRefactorer();
  await refactorer.refactorPages();
}

main().catch(console.error);
