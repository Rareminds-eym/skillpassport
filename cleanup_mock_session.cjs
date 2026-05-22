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

  // Fix 1: const { data: { session } } = { data: { session: ... } };
  const mockSessionRegex1 = /const \{\s*data\s*:\s*\{\s*session\s*\}\s*\}\s*=\s*\{\s*data\s*:\s*\{\s*session\s*:\s*\{\s*access_token\s*:\s*ssoClient\.getAccessToken\(\)\s*,\s*user\s*:\s*useAuthStore\.getState\(\)\.user\s*\}\s*\}\s*\};/g;
  if (mockSessionRegex1.test(content)) {
    content = content.replace(mockSessionRegex1, 'const user = useAuthStore.getState().user;');
  }

  // Fix 2: const { data: { session }, error: sessionError } = { data: { session: ... } };
  const mockSessionRegex2 = /const \{\s*data\s*:\s*\{\s*session\s*\}\s*,\s*error\s*:\s*sessionError\s*\}\s*=\s*\{\s*data\s*:\s*\{\s*session\s*:\s*\{\s*access_token\s*:\s*ssoClient\.getAccessToken\(\)\s*,\s*user\s*:\s*useAuthStore\.getState\(\)\.user\s*\}\s*\}\s*\};/g;
  if (mockSessionRegex2.test(content)) {
    content = content.replace(mockSessionRegex2, 'const user = useAuthStore.getState().user; const sessionError = null;');
  }
  
  // Fix 3: const { session, error } = { data: { session: ... } };
  const mockSessionRegex3 = /const \{\s*session\s*,\s*error\s*\}\s*=\s*\{\s*data\s*:\s*\{\s*session\s*:\s*\{\s*access_token\s*:\s*ssoClient\.getAccessToken\(\)\s*,\s*user\s*:\s*useAuthStore\.getState\(\)\.user\s*\}\s*\}\s*\};/g;
  if (mockSessionRegex3.test(content)) {
    content = content.replace(mockSessionRegex3, 'const user = useAuthStore.getState().user; const error = null;');
  }
  
  // Fix 4: const { session } = { data: { session: ... } };
  const mockSessionRegex4 = /const \{\s*session\s*\}\s*=\s*\{\s*data\s*:\s*\{\s*session\s*:\s*\{\s*access_token\s*:\s*ssoClient\.getAccessToken\(\)\s*,\s*user\s*:\s*useAuthStore\.getState\(\)\.user\s*\}\s*\}\s*\};/g;
  if (mockSessionRegex4.test(content)) {
    content = content.replace(mockSessionRegex4, 'const user = useAuthStore.getState().user;');
  }

  // Rewrite usages of session to user (only if it makes sense)
  if (content !== originalContent) {
    content = content.replace(/session\?\.user/g, 'user');
    content = content.replace(/session\.user/g, 'user');
    content = content.replace(/session\?\.access_token/g, 'ssoClient.getAccessToken()');
    content = content.replace(/session\.access_token/g, 'ssoClient.getAccessToken()');
    
    // Add useAuthStore import if missing
    if (!content.includes('useAuthStore')) {
      content = "import { useAuthStore } from '@/shared/model/authStore';\n" + content;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log(`Cleaned up mocked session in ${file}`);
  }
}

console.log(`Successfully refactored auth wrappers in ${changedFiles} files.`);
