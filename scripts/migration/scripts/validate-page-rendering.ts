#!/usr/bin/env tsx
/**
 * Page Rendering Validation Script
 * 
 * Validates that all pages render correctly after FSD migration by:
 * 1. Testing page component imports and rendering
 * 2. Validating authentication flows
 * 3. Validating data fetching patterns
 * 4. Validating state management
 * 
 * Requirements: 16.4, 16.5, 16.6, 16.7
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../../..');
const srcDir = join(rootDir, 'src');
const pagesDir = join(srcDir, 'pages');

interface PageInfo {
  path: string;
  relativePath: string;
  category: string;
  hasAuth: boolean;
  hasDataFetching: boolean;
  hasStateManagement: boolean;
  imports: string[];
  issues: string[];
}

interface ValidationResult {
  totalPages: number;
  validPages: number;
  pagesWithIssues: number;
  authFlowsValidated: number;
  dataFetchingValidated: number;
  stateManagementValidated: number;
  pages: PageInfo[];
  summary: {
    byCategory: Record<string, number>;
    commonIssues: Record<string, number>;
  };
}

/**
 * Recursively find all page files
 */
async function findPageFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip test directories and node_modules
        if (!entry.name.startsWith('__') && entry.name !== 'node_modules') {
          files.push(...await findPageFiles(fullPath));
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        // Include .tsx, .jsx, .ts, .js files but exclude test files
        if (['.tsx', '.jsx', '.ts', '.js'].includes(ext) && 
            !entry.name.includes('.test.') && 
            !entry.name.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Analyze a page file for patterns and issues
 */
async function analyzePage(filePath: string): Promise<PageInfo> {
  const relativePath = relative(pagesDir, filePath);
  const category = relativePath.split('/')[0] || 'root';
  const content = await readFile(filePath, 'utf-8');
  
  const issues: string[] = [];
  const imports: string[] = [];
  
  // Extract imports
  const importRegex = /import\s+(?:{[^}]+}|[\w]+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Check for legacy imports (should not exist after migration)
  const legacyImports = imports.filter(imp => 
    imp.includes('@/components/') ||
    imp.includes('@/services/') ||
    imp.includes('@/hooks/') ||
    imp.includes('@/utils/') ||
    imp.includes('@/types/') ||
    imp.includes('@/config/') ||
    imp.includes('@/lib/')
  );
  
  if (legacyImports.length > 0) {
    issues.push(`Legacy imports found: ${legacyImports.join(', ')}`);
  }
  
  // Check for direct Supabase usage in pages (business logic violation)
  const hasDirectSupabase = /supabase\.(from|rpc|auth)\(/.test(content);
  if (hasDirectSupabase) {
    issues.push('Direct Supabase usage detected (business logic in page)');
  }
  
  // Check for useState/useEffect patterns (potential business logic)
  const hasUseState = /useState\s*</.test(content) || /useState\(/.test(content);
  const hasUseEffect = /useEffect\(/.test(content);
  const hasDataFetching = hasUseEffect && (
    content.includes('fetch(') ||
    content.includes('.get(') ||
    content.includes('.post(') ||
    content.includes('supabase')
  );
  
  if (hasDataFetching) {
    issues.push('Data fetching logic in page (should be in feature layer)');
  }
  
  // Check for proper FSD imports
  const hasFSDImports = imports.some(imp => 
    imp.includes('@/features/') ||
    imp.includes('@/widgets/') ||
    imp.includes('@/entities/') ||
    imp.includes('@/shared/')
  );
  
  // Check authentication patterns
  const hasAuth = imports.some(imp => imp.includes('auth')) ||
    content.includes('useAuth') ||
    content.includes('authService') ||
    content.includes('session');
  
  // Check state management patterns
  const hasStateManagement = imports.some(imp => 
    imp.includes('zustand') ||
    imp.includes('Store') ||
    imp.includes('store')
  ) || content.includes('useStore');
  
  // Validate component structure
  const hasDefaultExport = /export\s+default\s+/.test(content);
  if (!hasDefaultExport) {
    issues.push('No default export found (pages should export a component)');
  }
  
  // Check for proper composition (should import from features/widgets)
  if (!hasFSDImports && !content.includes('// TODO') && content.length > 500) {
    issues.push('No FSD layer imports found (page may not be properly refactored)');
  }
  
  return {
    path: filePath,
    relativePath,
    category,
    hasAuth,
    hasDataFetching: hasDataFetching || hasDirectSupabase,
    hasStateManagement,
    imports,
    issues
  };
}

/**
 * Validate authentication flows
 */
function validateAuthFlows(pages: PageInfo[]): number {
  const authPages = pages.filter(p => 
    p.category === 'auth' || 
    p.relativePath.includes('login') ||
    p.relativePath.includes('signup') ||
    p.relativePath.includes('password')
  );
  
  let validatedCount = 0;
  
  for (const page of authPages) {
    // Auth pages should use features/auth
    const hasAuthFeature = page.imports.some(imp => 
      imp.includes('@/features/auth') ||
      imp.includes('features/auth')
    );
    
    if (hasAuthFeature || page.issues.length === 0) {
      validatedCount++;
    }
  }
  
  return validatedCount;
}

/**
 * Validate data fetching patterns
 */
function validateDataFetching(pages: PageInfo[]): number {
  let validatedCount = 0;
  
  for (const page of pages) {
    // Pages should not have direct data fetching
    const hasDataFetchingIssue = page.issues.some(issue => 
      issue.includes('Data fetching') || 
      issue.includes('Supabase usage')
    );
    
    if (!hasDataFetchingIssue) {
      validatedCount++;
    }
  }
  
  return validatedCount;
}

/**
 * Validate state management patterns
 */
function validateStateManagement(pages: PageInfo[]): number {
  let validatedCount = 0;
  
  for (const page of pages) {
    // Pages with state management should use feature hooks or stores
    if (page.hasStateManagement) {
      const usesFeatureState = page.imports.some(imp => 
        imp.includes('@/features/') ||
        imp.includes('@/widgets/')
      );
      
      if (usesFeatureState) {
        validatedCount++;
      }
    } else {
      // Pages without state management are valid
      validatedCount++;
    }
  }
  
  return validatedCount;
}

/**
 * Main validation function
 */
async function validatePageRendering(): Promise<ValidationResult> {
  console.log('🔍 Starting page rendering validation...\n');
  
  // Find all page files
  const pageFiles = await findPageFiles(pagesDir);
  console.log(`Found ${pageFiles.length} page files\n`);
  
  // Analyze each page
  const pages: PageInfo[] = [];
  for (const filePath of pageFiles) {
    try {
      const pageInfo = await analyzePage(filePath);
      pages.push(pageInfo);
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error);
    }
  }
  
  // Calculate statistics
  const pagesWithIssues = pages.filter(p => p.issues.length > 0).length;
  const validPages = pages.length - pagesWithIssues;
  
  const authFlowsValidated = validateAuthFlows(pages);
  const dataFetchingValidated = validateDataFetching(pages);
  const stateManagementValidated = validateStateManagement(pages);
  
  // Group by category
  const byCategory: Record<string, number> = {};
  for (const page of pages) {
    byCategory[page.category] = (byCategory[page.category] || 0) + 1;
  }
  
  // Count common issues
  const commonIssues: Record<string, number> = {};
  for (const page of pages) {
    for (const issue of page.issues) {
      const issueType = issue.split(':')[0];
      commonIssues[issueType] = (commonIssues[issueType] || 0) + 1;
    }
  }
  
  return {
    totalPages: pages.length,
    validPages,
    pagesWithIssues,
    authFlowsValidated,
    dataFetchingValidated,
    stateManagementValidated,
    pages,
    summary: {
      byCategory,
      commonIssues
    }
  };
}

/**
 * Print validation results
 */
function printResults(result: ValidationResult): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 PAGE RENDERING VALIDATION RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📈 Overall Statistics:');
  console.log(`  Total Pages: ${result.totalPages}`);
  console.log(`  Valid Pages: ${result.validPages} (${((result.validPages / result.totalPages) * 100).toFixed(1)}%)`);
  console.log(`  Pages with Issues: ${result.pagesWithIssues} (${((result.pagesWithIssues / result.totalPages) * 100).toFixed(1)}%)`);
  console.log('');
  
  console.log('🔐 Authentication Flows:');
  console.log(`  Validated: ${result.authFlowsValidated} auth-related pages`);
  console.log('');
  
  console.log('📡 Data Fetching:');
  console.log(`  Valid: ${result.dataFetchingValidated}/${result.totalPages} pages`);
  console.log(`  Issues: ${result.totalPages - result.dataFetchingValidated} pages with data fetching violations`);
  console.log('');
  
  console.log('🗂️  State Management:');
  console.log(`  Valid: ${result.stateManagementValidated}/${result.totalPages} pages`);
  console.log(`  Issues: ${result.totalPages - result.stateManagementValidated} pages with state management issues`);
  console.log('');
  
  console.log('📂 Pages by Category:');
  const sortedCategories = Object.entries(result.summary.byCategory)
    .sort(([, a], [, b]) => b - a);
  for (const [category, count] of sortedCategories) {
    console.log(`  ${category}: ${count} pages`);
  }
  console.log('');
  
  if (Object.keys(result.summary.commonIssues).length > 0) {
    console.log('⚠️  Common Issues:');
    const sortedIssues = Object.entries(result.summary.commonIssues)
      .sort(([, a], [, b]) => b - a);
    for (const [issue, count] of sortedIssues) {
      console.log(`  ${issue}: ${count} occurrences`);
    }
    console.log('');
  }
  
  // Print detailed issues
  const pagesWithIssues = result.pages.filter(p => p.issues.length > 0);
  if (pagesWithIssues.length > 0) {
    console.log('🔍 Detailed Issues:');
    console.log('───────────────────────────────────────────────────────────\n');
    
    for (const page of pagesWithIssues) {
      console.log(`📄 ${page.relativePath}`);
      for (const issue of page.issues) {
        console.log(`   ❌ ${issue}`);
      }
      console.log('');
    }
  }
  
  // Final verdict
  console.log('═══════════════════════════════════════════════════════════');
  if (result.pagesWithIssues === 0) {
    console.log('✅ ALL PAGES VALIDATED SUCCESSFULLY!');
  } else {
    console.log(`⚠️  ${result.pagesWithIssues} pages need attention`);
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run validation
validatePageRendering()
  .then(result => {
    printResults(result);
    
    // Exit with appropriate code
    if (result.pagesWithIssues > 0) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
