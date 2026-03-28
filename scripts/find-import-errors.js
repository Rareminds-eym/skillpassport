#!/usr/bin/env node

/**
 * Script to find import errors in the codebase
 * Identifies imports pointing to non-existent files
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const srcDir = path.join(process.cwd(), 'src');

// Common import patterns to check
const importPatterns = [
  // ES6 imports
  /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g,
  // Dynamic imports
  /import\(['"]([^'"]+)['"]\)/g,
  // Require statements
  /require\(['"]([^'"]+)['"]\)/g,
];

function resolveImportPath(importPath, fromFile) {
  // Skip node_modules and external packages
  if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
    return null;
  }

  let resolvedPath;
  
  if (importPath.startsWith('@/')) {
    // Handle @ alias (maps to src/)
    resolvedPath = path.join(srcDir, importPath.substring(2));
  } else {
    // Handle relative imports
    const fromDir = path.dirname(fromFile);
    resolvedPath = path.join(fromDir, importPath);
  }

  // Try different extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.json'];
  
  for (const ext of extensions) {
    const fullPath = resolvedPath + ext;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Check if it's a directory with index file
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
      const indexPath = path.join(resolvedPath, 'index' + ext);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
  }

  return null;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileErrors = [];

  for (const pattern of importPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const importPath = match[1];
      const resolved = resolveImportPath(importPath, filePath);
      
      if (resolved === null && (importPath.startsWith('.') || importPath.startsWith('@/'))) {
        // Get line number
        const lines = content.substring(0, match.index).split('\n');
        const lineNumber = lines.length;
        
        fileErrors.push({
          file: path.relative(process.cwd(), filePath),
          line: lineNumber,
          import: importPath,
          statement: match[0],
        });
      }
    }
  }

  return fileErrors;
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .git, dist, build
      if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      // Check only source files
      if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        const fileErrors = checkFile(fullPath);
        errors.push(...fileErrors);
      }
    }
  }
}

console.log('🔍 Scanning for import errors...\n');

scanDirectory(srcDir);

if (errors.length === 0) {
  console.log('✅ No import errors found!');
} else {
  console.log(`❌ Found ${errors.length} import error(s):\n`);
  
  // Group by file
  const errorsByFile = {};
  for (const error of errors) {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  }

  // Print grouped errors
  for (const [file, fileErrors] of Object.entries(errorsByFile)) {
    console.log(`\n📁 ${file}`);
    for (const error of fileErrors) {
      console.log(`   Line ${error.line}: ${error.import}`);
      console.log(`   → ${error.statement}`);
    }
  }

  console.log(`\n\nTotal: ${errors.length} import error(s) in ${Object.keys(errorsByFile).length} file(s)`);
  process.exit(1);
}
