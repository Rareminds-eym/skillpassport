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

  // Ensure ssoClient and useAuthStore are imported if needed
  const hasSsoClientImport = content.includes('ssoClient');
  const hasUseAuthStoreImport = content.includes('useAuthStore');

  // 1. Remove manual Authorization headers (handles \r\n and \n)
  content = content.replace(/['"]?Authorization['"]?\s*:\s*`Bearer \$\{?[a-zA-Z0-9_?.()]*\}?`\s*,?\r?\n?/g, '');
  content = content.replace(/['"]?Authorization['"]?\s*:\s*['"]Bearer ['"]\s*\+\s*[a-zA-Z0-9_?.()]+\s*,?\r?\n?/g, '');
  content = content.replace(/headers\[['"]Authorization['"]\]\s*=\s*`Bearer \$\{?[a-zA-Z0-9_?.()]*\}?`;?\r?\n?/g, '');
  
  // Clean up empty headers objects that might be left behind
  content = content.replace(/headers:\s*\{\s*\},?\r?\n?/g, '');

  // 2. Upgrade fetch to ssoClient.fetch
  // Only replace fetch( if it's not preceded by ssoClient., window., global., etc.
  content = content.replace(/(?<![a-zA-Z0-9_.]\s*)\bfetch\s*\(/g, 'ssoClient.fetch(');

  // 3. Transform legacy session object to just user
  const sessionRegex = /const session = \{ access_token: ssoClient\.getAccessToken\(\), user: useAuthStore\.getState\(\)\.user \};/g;
  
  if (sessionRegex.test(content)) {
    content = content.replace(sessionRegex, 'const user = useAuthStore.getState().user;');
    
    // Replace session.user usages
    content = content.replace(/session\?\.user/g, 'user');
    content = content.replace(/session\.user/g, 'user');
    
    // Replace session.access_token if it's still somehow used (e.g. passed to a function)
    content = content.replace(/session\?\.access_token/g, 'ssoClient.getAccessToken()');
    content = content.replace(/session\.access_token/g, 'ssoClient.getAccessToken()');

    // If the file now uses `user` but didn't before, we need to make sure useAuthStore is imported
    // (It should already be if it had the session line)
  }

  // 4. Remove standalone token fetches if they are no longer used
  const tokenRegex = /const token = (?:await )?ssoClient\.getAccessToken\(\);?\r?\n?/g;
  if (tokenRegex.test(content)) {
    // Check if token is used anywhere else in the file besides the declaration we just removed
    // We removed Authorization headers, so token might be unused now.
    // This is a bit tricky, let's just replace it if token is not used anymore
    // A simple heuristic: count occurrences of "token"
    const tempContent = content.replace(tokenRegex, '');
    if (!tempContent.includes('token')) {
        content = tempContent;
    }
  }

  if (content !== originalContent) {
    // If we added ssoClient.fetch but ssoClient wasn't imported, add it.
    if (content.includes('ssoClient.fetch') && !content.includes('import { ssoClient }') && !content.includes('import {ssoClient}')) {
       content = "import { ssoClient } from '@/shared/api/ssoClient';\n" + content;
    }

    fs.writeFileSync(file, content);
    changedFiles++;
    console.log(`Cleaned up auth in ${file}`);
  }
}

console.log(`Successfully refactored auth in ${changedFiles} files.`);
