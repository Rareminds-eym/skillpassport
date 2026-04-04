#!/usr/bin/env tsx

/**
 * Detects data transformation logic in page components
 * Identifies: array methods, data formatting, aggregations, calculations
 */

import * as fs from 'fs';
import * as path from 'path';

const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string, err?: any) => console.error(`[ERROR] ${msg}`, err),
};

interface DataTransformation {
  file: string;
  line: number;
  type: 'array_method' | 'formatting' | 'aggregation' | 'calculation' | 'filtering';
  code: string;
  context: string;
  suggestedFeature: string;
  suggestedLocation: string;
}

const ARRAY_METHODS = ['map', 'filter', 'reduce', 'sort', 'find', 'some', 'every', 'slice', 'splice'];
const FORMATTING_PATTERNS = [
  /toLocaleDateString/,
  /toLocaleString/,
  /toFixed/,
  /toPrecision/,
  /toUpperCase/,
  /toLowerCase/,
  /charAt.*toUpperCase/,
  /split.*join/,
  /Intl\./,
  /format.*Date/,
  /format.*Number/,
  /format.*Currency/,
];

function getAllPageFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && /\.(jsx|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function detectTransformations(filePath: string): DataTransformation[] {
  const transformations: DataTransformation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Determine feature from file path
  const suggestedFeature = determineFeature(filePath);
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();
    
    // Skip comments and imports
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('import ')) {
      return;
    }
    
    // Detect array methods
    for (const method of ARRAY_METHODS) {
      const regex = new RegExp(`\\.${method}\\(`);
      if (regex.test(line)) {
        // Get context (surrounding lines)
        const context = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join('\n');
        
        transformations.push({
          file: filePath,
          line: lineNum,
          type: 'array_method',
          code: trimmedLine,
          context,
          suggestedFeature,
          suggestedLocation: `src/features/${suggestedFeature}/lib/transformations.ts`,
        });
      }
    }
    
    // Detect formatting patterns
    for (const pattern of FORMATTING_PATTERNS) {
      if (pattern.test(line)) {
        const context = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join('\n');
        
        transformations.push({
          file: filePath,
          line: lineNum,
          type: 'formatting',
          code: trimmedLine,
          context,
          suggestedFeature,
          suggestedLocation: `src/features/${suggestedFeature}/lib/formatters.ts`,
        });
      }
    }
    
    // Detect aggregations (reduce, Object.entries, Object.values, etc.)
    if (/\.reduce\(|Object\.(entries|values|keys)/.test(line)) {
      const context = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join('\n');
      
      transformations.push({
        file: filePath,
        line: lineNum,
        type: 'aggregation',
        code: trimmedLine,
        context,
        suggestedFeature,
        suggestedLocation: `src/features/${suggestedFeature}/lib/aggregations.ts`,
      });
    }
  });
  
  return transformations;
}

function determineFeature(filePath: string): string {
  const normalized = filePath.toLowerCase();
  
  // Map page paths to features
  if (normalized.includes('analytics')) return 'analytics';
  if (normalized.includes('opportunities') || normalized.includes('jobs')) return 'opportunities';
  if (normalized.includes('timetable') || normalized.includes('schedule')) return 'courses';
  if (normalized.includes('lesson')) return 'courses';
  if (normalized.includes('swap')) return 'college-admin';
  if (normalized.includes('student') && normalized.includes('dashboard')) return 'student-profile';
  if (normalized.includes('educator') || normalized.includes('teacher')) return 'courses';
  if (normalized.includes('recruiter')) return 'placement';
  if (normalized.includes('assessment')) return 'assessment';
  if (normalized.includes('subscription')) return 'subscription';
  if (normalized.includes('messaging') || normalized.includes('messages')) return 'messaging';
  
  return 'shared';
}

function groupByFeature(transformations: DataTransformation[]): Map<string, DataTransformation[]> {
  const grouped = new Map<string, DataTransformation[]>();
  
  for (const transformation of transformations) {
    const feature = transformation.suggestedFeature;
    if (!grouped.has(feature)) {
      grouped.set(feature, []);
    }
    grouped.get(feature)!.push(transformation);
  }
  
  return grouped;
}

function main() {
  logger.info('Starting data transformation detection...');
  
  const pagesDir = path.join(process.cwd(), 'src', 'pages');
  const pageFiles = getAllPageFiles(pagesDir);
  
  logger.info(`Found ${pageFiles.length} page files to analyze`);
  
  const allTransformations: DataTransformation[] = [];
  
  for (const file of pageFiles) {
    const transformations = detectTransformations(file);
    allTransformations.push(...transformations);
  }
  
  logger.info(`Found ${allTransformations.length} data transformations`);
  
  // Group by feature
  const grouped = groupByFeature(allTransformations);
  
  // Output results
  console.log('\n=== DATA TRANSFORMATION ANALYSIS ===\n');
  
  for (const [feature, transformations] of grouped.entries()) {
    console.log(`\n## Feature: ${feature} (${transformations.length} transformations)`);
    
    // Group by type
    const byType = new Map<string, DataTransformation[]>();
    for (const t of transformations) {
      if (!byType.has(t.type)) {
        byType.set(t.type, []);
      }
      byType.get(t.type)!.push(t);
    }
    
    for (const [type, items] of byType.entries()) {
      console.log(`\n### ${type} (${items.length})`);
      
      // Show unique files
      const uniqueFiles = new Set(items.map(t => t.file));
      console.log(`Files: ${Array.from(uniqueFiles).map(f => path.relative(process.cwd(), f)).join(', ')}`);
      
      // Show sample transformations
      const samples = items.slice(0, 3);
      for (const sample of samples) {
        console.log(`\nLine ${sample.line}: ${sample.code.substring(0, 80)}...`);
        console.log(`Suggested: ${sample.suggestedLocation}`);
      }
    }
  }
  
  // Summary
  console.log('\n\n=== SUMMARY ===\n');
  console.log(`Total transformations found: ${allTransformations.length}`);
  console.log(`Features affected: ${grouped.size}`);
  console.log(`\nTop features by transformation count:`);
  
  const sorted = Array.from(grouped.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  
  for (const [feature, transformations] of sorted) {
    console.log(`  ${feature}: ${transformations.length}`);
  }
  
  logger.info('Analysis complete');
}

main();
