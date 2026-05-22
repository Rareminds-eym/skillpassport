const fs = require('fs');
const glob = require('glob'); // Note: we'll use a simple recursive readdir instead if glob isn't installed.

// Let's implement a simple recursive readdir
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(dirPath + "/" + file);
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles('src');

let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. If it contains manual session extraction
  if (content.includes('ssoClient.getAccessToken()') && content.includes('fetch(')) {
    // We want to replace fetch(...) with ssoClient.fetch(...) ONLY if it's not already ssoClient.fetch
    // and if the file imports ssoClient.
    
    // First, ensure ssoClient is imported if we are going to use it
    if (!content.includes("import { ssoClient }")) {
      // Add import
      const importStatement = "import { ssoClient } from '@/shared/api/ssoClient';\n";
      content = importStatement + content;
    }

    // Replace fetch( with ssoClient.fetch(
    content = content.replace(/(?<!ssoClient\.)\bfetch\(/g, 'ssoClient.fetch(');

    // Now remove the Authorization headers
    // Pattern: 'Authorization': `Bearer ${session.access_token}`
    content = content.replace(/['"]Authorization['"]\s*:\s*`Bearer \$\{session\.access_token\}`\s*,?/g, '');
    content = content.replace(/['"]Authorization['"]\s*:\s*`Bearer \$\{token\}`\s*,?/g, '');
    
    // Sometimes there's empty headers: {} left, we can leave them or clean them
    content = content.replace(/headers:\s*\{\s*\}/g, '');

    // Cleanup session const if it's no longer used
    if (!content.includes('session.') && !content.includes('session?.') && content.includes('const session = { access_token: ssoClient.getAccessToken()')) {
      content = content.replace(/const session = \{ access_token: ssoClient\.getAccessToken\(\)[^;]+;\n?/g, '');
    }
  }

  // Also catch other patterns
  if (content.includes('const token = ssoClient.getAccessToken();')) {
      // If we use ssoClient.fetch, we don't need token extraction for authorization headers
      content = content.replace(/(?<!ssoClient\.)\bfetch\(/g, 'ssoClient.fetch(');
      content = content.replace(/['"]Authorization['"]\s*:\s*`Bearer \$\{token\}`\s*,?/g, '');
      if (!content.includes('token.') && content.match(/\btoken\b/g)?.length === 1) { // if token is only used once in the declaration
         content = content.replace(/const token = ssoClient\.getAccessToken\(\);\n?/g, '');
      }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Updated ${changedFiles} files with manual fetch/auth logic.`);
