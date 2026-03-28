import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface BrokenImport {
  file: string;
  line: number;
  importPath: string;
  fullLine: string;
}

async function checkFileExists(importPath: string, fromFile: string): Promise<boolean> {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
  const baseDir = path.dirname(fromFile);
  
  // Resolve @/ alias to src/
  let resolvedPath = importPath.replace(/^@\//, 'src/');
  
  // Try with and without extensions
  for (const ext of ['', ...extensions]) {
    const fullPath = resolvedPath + ext;
    if (fs.existsSync(fullPath)) {
      return true;
    }
    // Also try as index file
    const indexPath = path.join(resolvedPath, 'index' + ext);
    if (fs.existsSync(indexPath)) {
      return true;
    }
  }
  
  return false;
}

async function findBrokenImports(): Promise<BrokenImport[]> {
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*', '**/migration/**']
  });

  const brokenImports: BrokenImport[] = [];
  const importRegex = /from\s+['"](@\/[^'"]+)['"]/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      let match;
      while ((match = importRegex.exec(line)) !== null) {
        const importPath = match[1];
        
        // Skip node_modules and external packages
        if (!importPath.startsWith('@/')) continue;
        
        const exists = checkFileExists(importPath, file);
        if (!exists) {
          brokenImports.push({
            file,
            line: index + 1,
            importPath,
            fullLine: line.trim()
          });
        }
      }
      importRegex.lastIndex = 0;
    });
  }

  return brokenImports;
}

async function main() {
  console.log('🔍 Scanning for broken imports...\n');

  const brokenImports = await findBrokenImports();

  if (brokenImports.length === 0) {
    console.log('✅ No broken imports found!');
    return;
  }

  console.log(`❌ Found ${brokenImports.length} broken imports:\n`);

  // Group by import path
  const grouped = brokenImports.reduce((acc, item) => {
    if (!acc[item.importPath]) {
      acc[item.importPath] = [];
    }
    acc[item.importPath].push(item);
    return {};
  }, {} as Record<string, BrokenImport[]>);

  for (const [importPath, items] of Object.entries(grouped)) {
    console.log(`\n📦 ${importPath} (${items.length} occurrences)`);
    items.slice(0, 3).forEach(item => {
      console.log(`   ${item.file}:${item.line}`);
    });
    if (items.length > 3) {
      console.log(`   ... and ${items.length - 3} more`);
    }
  }

  // Write to file for analysis
  fs.writeFileSync(
    'broken-imports.json',
    JSON.stringify(brokenImports, null, 2)
  );
  console.log(`\n📄 Full report written to broken-imports.json`);
}

main().catch(console.error);
