const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles('src');
let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;

  // 1. Remove if (!ssoClient.getAccessToken()) { throw new Error(...) }
  // This matches a block that throws an error or returns if token is missing
  content = content.replace(/if\s*\(!ssoClient\.getAccessToken\(\)\)\s*\{[^}]+\}\r?\n?/g, '');

  // 2. Remove headers: getAuthHeaders(ssoClient.getAccessToken())
  content = content.replace(/headers:\s*getAuthHeaders\(ssoClient\.getAccessToken\(\)\),?\r?\n?/g, '');
  
  // 3. Remove standalone getAuthHeaders usages
  content = content.replace(/headers:\s*getAuthHeaders\(token\),?\r?\n?/g, '');

  // 4. Specifically target videoSummarizerService.ts header
  content = content.replace(/['"]Authorization['"]:\s*`Bearer \$\{ssoClient\.getAccessToken\(\) \|\| ['"]['"]\}`,\r?\n?/g, '');

  // 5. Remove const token = ssoClient.getAccessToken(); if it is no longer used
  const tokenRegex = /const token = ssoClient\.getAccessToken\(\);?\r?\n?/g;
  if (tokenRegex.test(content)) {
    const tempContent = content.replace(tokenRegex, '');
    if (!tempContent.includes('token')) {
        content = tempContent;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log(`Cleaned up manual auth logic in ${file}`);
  }
}

console.log(`Successfully removed manual auth logic in ${changedFiles} files.`);
