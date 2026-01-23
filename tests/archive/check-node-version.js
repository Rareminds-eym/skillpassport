#!/usr/bin/env node

/**
 * Node.js Version Checker
 * Checks if your Node.js version is compatible with the project
 */

const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

console.log('🔍 Node.js Environment Check\n');
console.log(`Current Node.js version: ${nodeVersion}`);
console.log(`Major version: ${majorVersion}\n`);

if (majorVersion < 15) {
  console.log('❌ INCOMPATIBLE VERSION');
  console.log('Your Node.js version is too old for this project.\n');
  
  console.log('📋 Issues you may encounter:');
  console.log('- SyntaxError: Unexpected token ??=');
  console.log('- Build failures');
  console.log('- Development server crashes\n');
  
  console.log('🚀 SOLUTION: Upgrade to Node.js 20 (LTS)');
  console.log('\n📖 Upgrade Instructions:');
  
  if (process.platform === 'darwin') {
    console.log('For macOS:');
    console.log('1. Using Homebrew: brew install node@20');
    console.log('2. Using nvm: nvm install 20 && nvm use 20');
    console.log('3. Direct download: https://nodejs.org/');
  } else if (process.platform === 'linux') {
    console.log('For Linux:');
    console.log('1. Using nvm: nvm install 20 && nvm use 20');
    console.log('2. Using package manager: sudo apt update && sudo apt install nodejs npm');
    console.log('3. Direct download: https://nodejs.org/');
  } else if (process.platform === 'win32') {
    console.log('For Windows:');
    console.log('1. Using nvm-windows: nvm install 20 && nvm use 20');
    console.log('2. Direct download: https://nodejs.org/');
    console.log('3. Using Chocolatey: choco install nodejs');
  }
  
  console.log('\n⚡ After upgrading:');
  console.log('1. npm cache clean --force');
  console.log('2. rm -rf node_modules package-lock.json');
  console.log('3. npm install');
  console.log('4. npm run dev');
  
  process.exit(1);
  
} else if (majorVersion >= 15 && majorVersion < 18) {
  console.log('⚠️  MINIMUM COMPATIBLE VERSION');
  console.log('Your Node.js version works but is not optimal.\n');
  console.log('💡 Recommendation: Upgrade to Node.js 20 (LTS) for best performance and security.');
  
} else if (majorVersion >= 18) {
  console.log('✅ COMPATIBLE VERSION');
  console.log('Your Node.js version is compatible with this project.\n');
  
  if (majorVersion === 20) {
    console.log('🎉 Perfect! You\'re using the LTS version.');
  } else if (majorVersion > 20) {
    console.log('🚀 You\'re using a newer version. Great for development!');
  } else {
    console.log('💡 Consider upgrading to Node.js 20 (LTS) for long-term support.');
  }
}

console.log('\n🔧 Next Steps:');
console.log('1. If you upgraded Node.js, restart your terminal');
console.log('2. Clear caches: npm cache clean --force');
console.log('3. Reinstall dependencies: rm -rf node_modules && npm install');
console.log('4. Start development server: npm run dev');

console.log('\n📝 The subscription redirect loop fix is ready to test once your environment is set up!');