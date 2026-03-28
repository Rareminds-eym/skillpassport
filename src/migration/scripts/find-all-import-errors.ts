import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Scan all source files for potential import errors
 * This helps identify all issues at once instead of fixing them one by one during build
 */

interface ImportIssue {
  file: string;
  line: number;
  importPath: string;
  issue: string;
}

async function findAllImportErrors() {
  console.log('🔍 Scanning for import errors...\n');

  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/.migration-backups/**', '**/dist/**']
  });

  const issues: ImportIssue[] = [];

  // Patterns to check
  const problematicPatterns = [
    { pattern: /from ['"]\.\.\/\.\.\/utils\/supabase['"]/, issue: 'Legacy utils/supabase import' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/utils\/supabase['"]/, issue: 'Legacy utils/supabase import' },
    { pattern: /from ['"]\.\.\/lib\/supabaseClient['"]/, issue: 'Legacy lib/supabaseClient import' },
    { pattern: /from ['"]\.\.\/\.\.\/lib\/supabaseClient['"]/, issue: 'Legacy lib/supabaseClient import' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/lib\/supabaseClient['"]/, issue: 'Legacy lib/supabaseClient import' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabaseClient['"]/, issue: 'Legacy lib/supabaseClient import' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabaseClient['"]/, issue: 'Legacy lib/supabaseClient import' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabaseClient['"]/, issue: 'Legacy lib/supabaseClient import' },
    { pattern: /from ['"]@\/lib\/supabaseClient['"]/, issue: 'Should use @/shared/api/supabaseClient' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/config\/logging['"]/, issue: 'Legacy config/logging import' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/config\/logging['"]/, issue: 'Legacy config/logging import' },
    { pattern: /from ['"]@\/shared\/lib\/hooks\/use[A-Z][a-zA-Z]+\.js['"]/, issue: 'Hook should be imported from feature' },
    { pattern: /from ['"]@\/shared\/ui\/educator\//, issue: 'Should use @/features/college-admin or @/features/educator' },
    { pattern: /from ['"]@\/shared\/ui\/admin\//, issue: 'Admin UI should be in features or shared/ui directly' },
    { pattern: /from ['"]@\/shared\/ui\/Recruiter\//, issue: 'Should use @/features/recruiter' },
    { pattern: /from ['"]@\/shared\/ui\/messaging\//, issue: 'Should use @/features/messaging' },
    { pattern: /from ['"]@\/shared\/ui\/Subscription\//, issue: 'Should use @/features/subscription' },
    { pattern: /from ['"]@\/shared\/ui\/shared\//, issue: 'Redundant /shared/ in path' },
    { pattern: /from ['"]@\/shared\/lib\/test\//, issue: 'Test data should be in @/data' },
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const { pattern, issue: issueDesc } of problematicPatterns) {
        if (pattern.test(line)) {
          const match = line.match(/from ['"]([^'"]+)['"]/);
          if (match) {
            issues.push({
              file,
              line: index + 1,
              importPath: match[1],
              issue: issueDesc
            });
          }
        }
      }
    });
  }

  // Group by issue type
  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.issue]) {
      acc[issue.issue] = [];
    }
    acc[issue.issue].push(issue);
    return acc;
  }, {} as Record<string, ImportIssue[]>);

  console.log('📊 Import Issues Found:\n');
  console.log('='.repeat(80));

  let totalIssues = 0;
  for (const [issueType, issueList] of Object.entries(groupedIssues)) {
    console.log(`\n${issueType} (${issueList.length} occurrences):`);
    console.log('-'.repeat(80));
    
    // Show first 10 examples
    issueList.slice(0, 10).forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    Import: ${issue.importPath}`);
    });
    
    if (issueList.length > 10) {
      console.log(`  ... and ${issueList.length - 10} more`);
    }
    
    totalIssues += issueList.length;
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 Total Issues: ${totalIssues}`);
  console.log(`📁 Files Scanned: ${files.length}`);
  console.log(`🔧 Issue Types: ${Object.keys(groupedIssues).length}`);

  // Save detailed report
  const reportPath = 'import-errors-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({ issues, groupedIssues, summary: { totalIssues, filesScanned: files.length } }, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);

  return issues;
}

findAllImportErrors().catch(console.error);
