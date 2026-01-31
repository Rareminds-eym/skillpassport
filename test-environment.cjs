/**
 * Environment Verification Script
 * Tests that all required environment variables and dependencies are configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Environment Configuration...\n');

// Check Node modules
console.log('📦 Checking Dependencies:');

// Check if aws4fetch exists
const aws4fetchPath = path.join(__dirname, 'node_modules', 'aws4fetch');
if (fs.existsSync(aws4fetchPath)) {
  console.log('  ✅ aws4fetch installed');
} else {
  console.log('  ❌ aws4fetch NOT installed');
  process.exit(1);
}

// Check if @supabase/supabase-js exists
const supabasePath = path.join(__dirname, 'node_modules', '@supabase', 'supabase-js');
if (fs.existsSync(supabasePath)) {
  console.log('  ✅ @supabase/supabase-js installed');
} else {
  console.log('  ❌ @supabase/supabase-js NOT installed');
  process.exit(1);
}

// Check environment variables from .dev.vars
console.log('\n🔐 Checking Environment Variables (.dev.vars):');

const devVarsPath = path.join(__dirname, '.dev.vars');
if (!fs.existsSync(devVarsPath)) {
  console.log('  ❌ .dev.vars file not found');
  process.exit(1);
}

const devVarsContent = fs.readFileSync(devVarsPath, 'utf8');
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENROUTER_API_KEY',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME'
];

let allVarsPresent = true;
requiredVars.forEach(varName => {
  const regex = new RegExp(`^${varName}=.+`, 'm');
  if (regex.test(devVarsContent)) {
    console.log(`  ✅ ${varName} configured`);
  } else {
    console.log(`  ❌ ${varName} NOT configured`);
    allVarsPresent = false;
  }
});

if (!allVarsPresent) {
  console.log('\n❌ Some required environment variables are missing');
  process.exit(1);
}

console.log('\n✅ All environment checks passed!');
console.log('\n📋 Summary:');
console.log('  - aws4fetch: Ready for R2 operations');
console.log('  - Supabase: Configured and ready');
console.log('  - OpenRouter: API key configured');
console.log('  - Cloudflare R2: Credentials configured');
console.log('\n🚀 Ready to start implementation!');
