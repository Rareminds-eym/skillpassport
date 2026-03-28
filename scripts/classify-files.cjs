#!/usr/bin/env node

/**
 * File Classification Script for FSD Phase 7 Migration
 * 
 * This script analyzes files in the backup directory and classifies them
 * according to FSD (Feature-Sliced Design) architecture principles.
 */

const fs = require('fs');
const path = require('path');

// Babel imports with proper error handling
let parse, traverse;
try {
  parse = require('@babel/parser').parse;
  traverse = require('@babel/traverse').default;
} catch (error) {
  console.warn('Warning: Babel dependencies not available. Using fallback parsing.');
  parse = null;
  traverse = null;
}

// Configuration
const BACKUP_DIR = '.migration-backups/legacy-final-backup-2026-03-23-173634';
const OUTPUT_FILE = 'scripts/classification-report.json';
const CONFIDENCE_THRESHOLD = 0.7;

// FSD Layer hierarchy
const FSD_LAYERS = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];

/**
 * FileClassifier - Main classification engine
 */
class FileClassifier {
  constructor() {
    this.classifications = [];
    this.lowConfidenceFiles = [];
  }

  /**
   * Classify a single file
   * @param {string} filePath - Relative path from backup directory
   * @returns {Object} FileClassification object
   */
  classifyFile(filePath) {
    const analysis = this.analyzeFile(filePath);
    const layer = this.determineLayer(analysis);
    const feature = this.determineFeature(analysis);
    const subdirectory = this.determineSubdirectory(analysis);
    const confidence = this.calculateConfidence(analysis, layer, feature);

    const classification = {
      sourceFile: filePath,
      targetFile: this.buildTargetPath(layer, feature, subdirectory, path.basename(filePath)),
      layer,
      feature,
      subdirectory,
      confidence,
      category: this.determineCategory(filePath),
      analysis: {
        hasBusinessLogic: analysis.hasBusinessLogic,
        composesMultipleFeatures: analysis.composesMultipleFeatures,
        isSharedUtility: analysis.isSharedUtility,
        importCount: analysis.imports.length,
        exportCount: analysis.exports.length
      }
    };

    if (confidence < CONFIDENCE_THRESHOLD) {
      this.lowConfidenceFiles.push(classification);
    }

    return classification;
  }

  /**
   * Analyze file content and structure
   * @param {string} filePath - Relative path from backup directory
   * @returns {Object} FileAnalysis object
   */
  analyzeFile(filePath) {
    const fullPath = path.join(BACKUP_DIR, filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const ext = path.extname(filePath);

    const analysis = {
      path: filePath,
      content,
      imports: [],
      exports: [],
      hasBusinessLogic: false,
      composesMultipleFeatures: false,
      isSharedUtility: false,
      fileType: this.detectFileType(filePath, content)
    };

    // Only parse JS/TS files
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      try {
        analysis.imports = this.extractImports(content, ext);
        analysis.exports = this.extractExports(content, ext);
        analysis.hasBusinessLogic = this.detectBusinessLogic(content, analysis.imports);
        analysis.composesMultipleFeatures = this.detectMultipleFeatures(analysis.imports);
        analysis.isSharedUtility = this.detectSharedUtility(filePath, content, analysis.imports);
      } catch (error) {
        console.warn(`Warning: Could not parse ${filePath}: ${error.message}`);
      }
    }

    return analysis;
  }

  /**
   * Extract imports using AST parsing
   */
  extractImports(content, ext) {
    const imports = [];
    
    // Use regex-based extraction (more reliable for this use case)
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push({ source: match[1], specifiers: [] });
    }
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push({ source: match[1], specifiers: [], dynamic: true });
    }

    return imports;
  }

  /**
   * Extract exports using AST parsing
   */
  extractExports(content, ext) {
    const exports = [];
    
    // Regex-based extraction
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
    const exportDefaultRegex = /export\s+default\s+/g;
    
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push({ name: match[1], isDefault: false });
    }
    
    if (exportDefaultRegex.test(content)) {
      exports.push({ name: 'default', isDefault: true });
    }

    return exports;
  }

  /**
   * Detect file type based on path and content
   */
  detectFileType(filePath, content) {
    const fileName = path.basename(filePath).toLowerCase();
    
    if (fileName.includes('service')) return 'service';
    if (fileName.includes('hook') || fileName.startsWith('use')) return 'hook';
    if (fileName.includes('modal')) return 'modal';
    if (fileName.includes('layout')) return 'layout';
    if (fileName.includes('route')) return 'route';
    if (fileName.includes('provider')) return 'provider';
    if (fileName.includes('config')) return 'config';
    if (fileName.includes('util') || fileName.includes('helper')) return 'utility';
    if (content.includes('React.Component') || content.includes('function') && content.includes('return')) return 'component';
    
    return 'unknown';
  }

  /**
   * Detect if file contains business logic
   */
  detectBusinessLogic(content, imports) {
    // Check for state management
    const hasState = /useState|useReducer|useContext/.test(content);
    // Check for API calls
    const hasApiCalls = /fetch|axios|supabase/.test(content);
    // Check for business-specific imports
    const hasBusinessImports = imports.some(imp => 
      imp.source.includes('service') || 
      imp.source.includes('api') ||
      imp.source.includes('store')
    );
    
    return hasState || hasApiCalls || hasBusinessImports;
  }

  /**
   * Detect if file composes multiple features
   */
  detectMultipleFeatures(imports) {
    const featureImports = imports.filter(imp => 
      imp.source.includes('features/') || 
      imp.source.includes('components/')
    );
    
    const uniqueFeatures = new Set(
      featureImports.map(imp => imp.source.split('/')[1])
    );
    
    return uniqueFeatures.size >= 2;
  }

  /**
   * Detect if file is a shared utility
   */
  detectSharedUtility(filePath, content, imports) {
    const fileName = path.basename(filePath).toLowerCase();
    
    // Check naming patterns
    if (fileName.includes('util') || fileName.includes('helper') || fileName.includes('common')) {
      return true;
    }
    
    // Check if it's in a shared/common directory
    if (filePath.includes('/common/') || filePath.includes('/shared/') || filePath.includes('/ui/')) {
      return true;
    }
    
    // Check if it has no feature-specific imports
    const hasFeatureImports = imports.some(imp => 
      imp.source.includes('features/') || 
      imp.source.includes('components/') && !imp.source.includes('components/ui')
    );
    
    return !hasFeatureImports && !this.detectBusinessLogic(content, imports);
  }

  /**
   * Determine FSD layer for file
   */
  determineLayer(analysis) {
    const { path: filePath, hasBusinessLogic, composesMultipleFeatures, isSharedUtility } = analysis;

    // App layer: layouts, routes, providers
    if (filePath.startsWith('layouts/') || filePath.startsWith('routes/') || filePath.startsWith('providers/')) {
      return 'app';
    }

    // Shared layer: utilities, common components, config
    if (isSharedUtility || filePath.startsWith('config/') || filePath.startsWith('lib/')) {
      return 'shared';
    }

    // Widgets layer: composes multiple features
    if (composesMultipleFeatures) {
      return 'widgets';
    }

    // Features layer: has business logic
    if (hasBusinessLogic) {
      return 'features';
    }

    // Entities layer: domain objects
    if (filePath.includes('/student/') && !hasBusinessLogic) {
      return 'entities';
    }

    // Default to shared for ambiguous cases
    return 'shared';
  }

  /**
   * Determine feature name for file
   */
  determineFeature(analysis) {
    const { path: filePath, fileType } = analysis;
    
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Extract feature from path - check for exact matches
    if (normalizedPath.includes('components/Myclass') || normalizedPath.includes('Myclass/')) return 'myclass';
    if (normalizedPath.includes('components/educator') || normalizedPath.includes('educator/')) return 'educator';
    if (normalizedPath.includes('components/admin') || normalizedPath.includes('admin/')) return 'admin';
    if (normalizedPath.includes('components/Recruiter') || normalizedPath.includes('Recruiter/')) return 'recruiter-pipeline';
    if (normalizedPath.includes('components/assessment') || normalizedPath.includes('assessment/')) return 'assessment';
    if (normalizedPath.includes('components/Students') || normalizedPath.includes('Students/')) return 'student-dashboard';
    if (normalizedPath.includes('components/Homepage') || normalizedPath.includes('Homepage/')) return 'marketing';
    if (normalizedPath.includes('components/Subscription') || normalizedPath.includes('Subscription/')) return 'subscription';
    if (normalizedPath.includes('components/StudentMessaging') || normalizedPath.includes('messaging/')) return 'messaging';
    if (normalizedPath.includes('components/digital-pp') || normalizedPath.includes('skillpassport/')) return 'digital-passport';
    if (normalizedPath.includes('components/exams') || normalizedPath.includes('exams/')) return 'exams';
    if (normalizedPath.includes('components/teacher')) return 'educator';
    if (normalizedPath.includes('components/Tours')) return 'onboarding';
    if (normalizedPath.includes('components/SEO')) return 'seo';
    
    // Service files
    if (normalizedPath.startsWith('services/')) {
      const serviceName = path.basename(filePath, path.extname(filePath));
      if (serviceName.includes('admin')) return 'admin';
      if (serviceName.includes('student')) return 'student-dashboard';
      if (serviceName.includes('subscription') || serviceName.includes('addOn')) return 'subscription';
      if (serviceName.includes('assessment')) return 'assessment';
      return 'shared'; // Shared services
    }

    return 'shared';
  }

  /**
   * Determine subdirectory (ui, model, api, lib)
   */
  determineSubdirectory(analysis) {
    const { path: filePath, fileType } = analysis;

    if (fileType === 'service') return 'api';
    if (fileType === 'hook') return 'model';
    if (fileType === 'utility' || fileType === 'config') return 'lib';
    if (fileType === 'component' || fileType === 'modal') return 'ui';
    if (fileType === 'layout') return 'ui';
    if (fileType === 'route') return 'routes';
    if (fileType === 'provider') return 'providers';
    
    // Default based on path
    if (filePath.includes('/hooks/')) return 'model';
    if (filePath.includes('/utils/') || filePath.includes('/lib/')) return 'lib';
    if (filePath.includes('/services/') || filePath.includes('/api/')) return 'api';
    
    return 'ui'; // Default to UI
  }

  /**
   * Calculate classification confidence score
   */
  calculateConfidence(analysis, layer, feature) {
    let score = 0;
    const { path: filePath } = analysis;

    // Path pattern matching (40%)
    const pathScore = this.calculatePathScore(filePath, layer, feature);
    score += pathScore * 0.4;

    // Import analysis (30%)
    const importScore = this.calculateImportScore(analysis);
    score += importScore * 0.3;

    // Usage analysis (20%)
    const usageScore = this.calculateUsageScore(analysis);
    score += usageScore * 0.2;

    // Naming convention (10%)
    const namingScore = this.calculateNamingScore(filePath, layer, feature);
    score += namingScore * 0.1;

    return Math.min(1, Math.max(0, score));
  }

  calculatePathScore(filePath, layer, feature) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Strong path indicators
    if (feature !== 'shared' && normalizedPath.includes(feature)) {
      return 1.0;
    }
    if (normalizedPath.startsWith('layouts/') && layer === 'app') return 1.0;
    if (normalizedPath.startsWith('routes/') && layer === 'app') return 1.0;
    if (normalizedPath.startsWith('providers/') && layer === 'app') return 1.0;
    if (normalizedPath.startsWith('config/') && layer === 'shared') return 1.0;
    if (normalizedPath.startsWith('lib/') && layer === 'shared') return 1.0;
    
    return 0.5; // Moderate confidence
  }

  calculateImportScore(analysis) {
    const { imports, hasBusinessLogic, composesMultipleFeatures } = analysis;
    
    if (imports.length === 0) return 0.3;
    if (composesMultipleFeatures) return 0.9;
    if (hasBusinessLogic) return 0.8;
    
    return 0.6;
  }

  calculateUsageScore(analysis) {
    const { hasBusinessLogic, isSharedUtility, exports } = analysis;
    
    if (hasBusinessLogic) return 0.8;
    if (isSharedUtility) return 0.9;
    if (exports.length > 0) return 0.7;
    
    return 0.5;
  }

  calculateNamingScore(filePath, layer, feature) {
    const fileName = path.basename(filePath).toLowerCase();
    
    if (fileName.includes(feature)) return 1.0;
    if (fileName.includes('service') && layer === 'features') return 0.8;
    if (fileName.includes('modal') && layer === 'features') return 0.8;
    if (fileName.includes('layout') && layer === 'app') return 1.0;
    
    return 0.5;
  }

  /**
   * Build target path in FSD structure
   */
  buildTargetPath(layer, feature, subdirectory, fileName) {
    if (layer === 'app') {
      return `src/app/${subdirectory}/${fileName}`;
    }
    if (layer === 'shared') {
      if (feature === 'marketing') {
        return `src/shared/ui/marketing/${fileName}`;
      }
      return `src/shared/${subdirectory}/${fileName}`;
    }
    if (layer === 'widgets') {
      return `src/widgets/${feature}/${subdirectory}/${fileName}`;
    }
    if (layer === 'entities') {
      return `src/entities/${feature}/${subdirectory}/${fileName}`;
    }
    // features
    return `src/features/${feature}/${subdirectory}/${fileName}`;
  }

  /**
   * Determine migration category
   */
  determineCategory(filePath) {
    if (filePath.includes('Myclass')) return 'myclass';
    if (filePath.includes('Students')) return 'student-dashboard';
    if (filePath.includes('Homepage')) return 'homepage-marketing';
    if (filePath.includes('Recruiter')) return 'recruiter-pipeline';
    if (filePath.includes('assessment')) return 'assessment-test-ui';
    if (filePath.includes('educator')) return 'educator';
    if (filePath.includes('admin')) return 'admin';
    if (filePath.includes('Subscription')) return 'subscription';
    if (filePath.startsWith('services/')) return 'services';
    return 'miscellaneous';
  }
}

module.exports = { FileClassifier };

/**
 * Recursively scan directory for files
 */
function scanDirectory(dir, baseDir = dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath, baseDir));
    } else if (entry.isFile()) {
      // Only include source files
      const ext = path.extname(entry.name);
      if (['.js', '.jsx', '.ts', '.tsx', '.json', '.md'].includes(ext)) {
        files.push(relativePath);
      }
    }
  }

  return files;
}

/**
 * Generate classification report
 */
function generateReport(classifications, lowConfidenceFiles) {
  const report = {
    summary: {
      totalFiles: classifications.length,
      lowConfidenceFiles: lowConfidenceFiles.length,
      byLayer: {},
      byCategory: {},
      byFeature: {}
    },
    classifications,
    lowConfidenceFiles,
    timestamp: new Date().toISOString()
  };

  // Calculate statistics
  classifications.forEach(c => {
    report.summary.byLayer[c.layer] = (report.summary.byLayer[c.layer] || 0) + 1;
    report.summary.byCategory[c.category] = (report.summary.byCategory[c.category] || 0) + 1;
    report.summary.byFeature[c.feature] = (report.summary.byFeature[c.feature] || 0) + 1;
  });

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Starting file classification...\n');
  console.log(`Scanning directory: ${BACKUP_DIR}\n`);

  // Check if backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error(`❌ Error: Backup directory not found: ${BACKUP_DIR}`);
    process.exit(1);
  }

  // Scan all files
  const files = scanDirectory(BACKUP_DIR);
  console.log(`Found ${files.length} files to classify\n`);

  // Classify each file
  const classifier = new FileClassifier();
  const classifications = [];

  files.forEach((file, index) => {
    try {
      const classification = classifier.classifyFile(file);
      classifications.push(classification);
      
      // Progress indicator
      if ((index + 1) % 10 === 0) {
        process.stdout.write(`\rProcessed: ${index + 1}/${files.length}`);
      }
    } catch (error) {
      console.error(`\n❌ Error classifying ${file}: ${error.message}`);
    }
  });

  console.log(`\n\n✅ Classification complete!\n`);

  // Generate report
  const report = generateReport(classifications, classifier.lowConfidenceFiles);

  // Save report
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));

  // Print summary
  console.log('📊 Classification Summary:');
  console.log(`   Total files: ${report.summary.totalFiles}`);
  console.log(`   Low confidence files: ${report.summary.lowConfidenceFiles}`);
  console.log('\n📁 By Layer:');
  Object.entries(report.summary.byLayer).forEach(([layer, count]) => {
    console.log(`   ${layer}: ${count}`);
  });
  console.log('\n🏷️  By Category:');
  Object.entries(report.summary.byCategory).forEach(([category, count]) => {
    console.log(`   ${category}: ${count}`);
  });
  console.log('\n🎯 By Feature:');
  Object.entries(report.summary.byFeature).forEach(([feature, count]) => {
    console.log(`   ${feature}: ${count}`);
  });

  if (classifier.lowConfidenceFiles.length > 0) {
    console.log('\n⚠️  Low Confidence Files (require manual review):');
    classifier.lowConfidenceFiles.slice(0, 10).forEach(file => {
      console.log(`   ${file.sourceFile} -> ${file.targetFile} (confidence: ${file.confidence.toFixed(2)})`);
    });
    if (classifier.lowConfidenceFiles.length > 10) {
      console.log(`   ... and ${classifier.lowConfidenceFiles.length - 10} more`);
    }
  }

  console.log(`\n📄 Full report saved to: ${OUTPUT_FILE}\n`);
}

// Run if executed directly
if (require.main === module) {
  main();
}
