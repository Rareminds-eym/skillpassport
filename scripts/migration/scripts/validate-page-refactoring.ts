#!/usr/bin/env tsx

/**
 * Validates page refactoring to ensure:
 * 1. Zero Supabase client usage in pages
 * 2. Zero business logic in pages
 * 3. Zero direct service imports in pages
 * 4. Pages only import from features/, widgets/, shared/
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface ValidationResult {
  file: string;
  violations: Violation[];
}

interface Violation {
  type: 'supabase_usage' | 'business_logic' | 'service_import' | 'invalid_import';
  line: number;
  code: string;
  message: string;
}

interface ValidationSummary {
  totalPages: number;
  pagesWithViolations: number;
  cleanPages: number;
  violations: {
    supabaseUsage: number;
    businessLogic: number;
    serviceImports: number;
    invalidImports: number;
  };
  results: ValidationResult[];
}

const PAGES_DIR = path.join(process.cwd(), 'src/pages');

function getAllPageFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function validatePageFile(filePath: string): ValidationResult {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );
  
  // Check for Supabase client usage
  checkSupabaseUsage(sourceFile, content, violations);
  
  // Check for business logic patterns
  checkBusinessLogic(sourceFile, content, violations);
  
  // Check imports
  checkImports(sourceFile, content, violations);
  
  return {
    file: path.relative(process.cwd(), filePath),
    violations
  };
}

function checkSupabaseUsage(
  sourceFile: ts.SourceFile,
  content: string,
  violations: Violation[]
): void {
  const lines = content.split('\n');
  
  // Pattern 1: supabase.from()
  const fromPattern = /supabase\s*\.\s*from\s*\(/g;
  let match;
  while ((match = fromPattern.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    violations.push({
      type: 'supabase_usage',
      line,
      code: lines[line - 1]?.trim() || '',
      message: 'Direct Supabase.from() call found in page'
    });
  }
  
  // Pattern 2: supabase.rpc()
  const rpcPattern = /supabase\s*\.\s*rpc\s*\(/g;
  while ((match = rpcPattern.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    violations.push({
      type: 'supabase_usage',
      line,
      code: lines[line - 1]?.trim() || '',
      message: 'Direct Supabase.rpc() call found in page'
    });
  }
  
  // Pattern 3: supabase.auth
  const authPattern = /supabase\s*\.\s*auth\s*\./g;
  while ((match = authPattern.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    violations.push({
      type: 'supabase_usage',
      line,
      code: lines[line - 1]?.trim() || '',
      message: 'Direct Supabase.auth call found in page'
    });
  }
}

function checkBusinessLogic(
  sourceFile: ts.SourceFile,
  content: string,
  violations: Violation[]
): void {
  const lines = content.split('\n');
  
  // Pattern 1: useEffect with data fetching
  const useEffectPattern = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?(fetch|axios|supabase|async)/g;
  let match;
  while ((match = useEffectPattern.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    const effectContent = match[0];
    
    // Check if it's actually doing data fetching (not just side effects)
    if (effectContent.includes('fetch') || 
        effectContent.includes('axios') || 
        effectContent.includes('supabase') ||
        effectContent.includes('async')) {
      violations.push({
        type: 'business_logic',
        line,
        code: lines[line - 1]?.trim() || '',
        message: 'Data fetching logic found in useEffect'
      });
    }
  }
  
  // Pattern 2: Complex state transformations
  const transformPattern = /\.(map|filter|reduce)\s*\([^)]{50,}\)/g;
  while ((match = transformPattern.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    const lineContent = lines[line - 1]?.trim() || '';
    
    // Only flag if it's complex transformation (not simple rendering)
    if (!lineContent.includes('return') || lineContent.length > 100) {
      violations.push({
        type: 'business_logic',
        line,
        code: lineContent,
        message: 'Complex data transformation found in page'
      });
    }
  }
}

function checkImports(
  sourceFile: ts.SourceFile,
  content: string,
  violations: Violation[]
): void {
  const lines = content.split('\n');
  
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const lineContent = lines[line - 1]?.trim() || '';
        
        // Check for direct service imports
        if (importPath.includes('@/services/') || importPath.includes('../services/')) {
          violations.push({
            type: 'service_import',
            line,
            code: lineContent,
            message: `Direct service import: ${importPath}`
          });
        }
        
        // Check for invalid layer imports
        const validPrefixes = [
          '@/features/',
          '@/widgets/',
          '@/shared/',
          '@/app/',
          'react',
          'react-',
          '@/',
          '.',
          '..'
        ];
        
        const isValidImport = validPrefixes.some(prefix => {
          if (prefix === '@/' || prefix === '.' || prefix === '..') {
            return importPath.startsWith(prefix);
          }
          return importPath.startsWith(prefix);
        });
        
        // Check specifically for invalid layer imports
        const invalidPatterns = [
          '@/services/',
          '@/hooks/',
          '@/utils/',
          '@/types/',
          '@/config/',
          '@/lib/',
          '@/components/',
          '@/entities/',  // Pages shouldn't directly import entities
        ];
        
        const hasInvalidPattern = invalidPatterns.some(pattern => importPath.includes(pattern));
        
        if (hasInvalidPattern) {
          violations.push({
            type: 'invalid_import',
            line,
            code: lineContent,
            message: `Invalid import from legacy/restricted layer: ${importPath}`
          });
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
}

function generateReport(summary: ValidationSummary): void {
  console.log('\n' + '='.repeat(80));
  console.log('PAGE REFACTORING VALIDATION REPORT');
  console.log('='.repeat(80) + '\n');
  
  console.log('SUMMARY:');
  console.log(`  Total pages analyzed: ${summary.totalPages}`);
  console.log(`  Clean pages: ${summary.cleanPages} (${((summary.cleanPages / summary.totalPages) * 100).toFixed(1)}%)`);
  console.log(`  Pages with violations: ${summary.pagesWithViolations} (${((summary.pagesWithViolations / summary.totalPages) * 100).toFixed(1)}%)`);
  console.log('');
  
  console.log('VIOLATION BREAKDOWN:');
  console.log(`  Supabase client usage: ${summary.violations.supabaseUsage}`);
  console.log(`  Business logic: ${summary.violations.businessLogic}`);
  console.log(`  Direct service imports: ${summary.violations.serviceImports}`);
  console.log(`  Invalid layer imports: ${summary.violations.invalidImports}`);
  console.log('');
  
  if (summary.pagesWithViolations > 0) {
    console.log('VIOLATIONS BY FILE:');
    console.log('');
    
    for (const result of summary.results) {
      if (result.violations.length > 0) {
        console.log(`\n${result.file}:`);
        
        const grouped = {
          supabase_usage: result.violations.filter(v => v.type === 'supabase_usage'),
          business_logic: result.violations.filter(v => v.type === 'business_logic'),
          service_import: result.violations.filter(v => v.type === 'service_import'),
          invalid_import: result.violations.filter(v => v.type === 'invalid_import'),
        };
        
        if (grouped.supabase_usage.length > 0) {
          console.log(`  Supabase Usage (${grouped.supabase_usage.length}):`);
          grouped.supabase_usage.forEach(v => {
            console.log(`    Line ${v.line}: ${v.message}`);
            console.log(`      ${v.code}`);
          });
        }
        
        if (grouped.business_logic.length > 0) {
          console.log(`  Business Logic (${grouped.business_logic.length}):`);
          grouped.business_logic.forEach(v => {
            console.log(`    Line ${v.line}: ${v.message}`);
            console.log(`      ${v.code}`);
          });
        }
        
        if (grouped.service_import.length > 0) {
          console.log(`  Service Imports (${grouped.service_import.length}):`);
          grouped.service_import.forEach(v => {
            console.log(`    Line ${v.line}: ${v.message}`);
            console.log(`      ${v.code}`);
          });
        }
        
        if (grouped.invalid_import.length > 0) {
          console.log(`  Invalid Imports (${grouped.invalid_import.length}):`);
          grouped.invalid_import.forEach(v => {
            console.log(`    Line ${v.line}: ${v.message}`);
            console.log(`      ${v.code}`);
          });
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (summary.pagesWithViolations === 0) {
    console.log('✅ VALIDATION PASSED: All pages follow FSD refactoring guidelines');
  } else {
    console.log('❌ VALIDATION FAILED: Pages contain violations that need to be fixed');
  }
  
  console.log('='.repeat(80) + '\n');
}

function main() {
  console.log('Starting page refactoring validation...\n');
  
  if (!fs.existsSync(PAGES_DIR)) {
    console.error(`Error: Pages directory not found: ${PAGES_DIR}`);
    process.exit(1);
  }
  
  const pageFiles = getAllPageFiles(PAGES_DIR);
  console.log(`Found ${pageFiles.length} page files to validate\n`);
  
  const results: ValidationResult[] = [];
  
  for (const file of pageFiles) {
    const result = validatePageFile(file);
    results.push(result);
  }
  
  const summary: ValidationSummary = {
    totalPages: results.length,
    pagesWithViolations: results.filter(r => r.violations.length > 0).length,
    cleanPages: results.filter(r => r.violations.length === 0).length,
    violations: {
      supabaseUsage: results.reduce((sum, r) => 
        sum + r.violations.filter(v => v.type === 'supabase_usage').length, 0),
      businessLogic: results.reduce((sum, r) => 
        sum + r.violations.filter(v => v.type === 'business_logic').length, 0),
      serviceImports: results.reduce((sum, r) => 
        sum + r.violations.filter(v => v.type === 'service_import').length, 0),
      invalidImports: results.reduce((sum, r) => 
        sum + r.violations.filter(v => v.type === 'invalid_import').length, 0),
    },
    results
  };
  
  generateReport(summary);
  
  // Exit with error code if validation failed
  if (summary.pagesWithViolations > 0) {
    process.exit(1);
  }
}

main();
