#!/usr/bin/env node

/**
 * Setup validation script for Data Import system
 * Checks for common issues before deployment
 */

import fs from 'fs'
import path from 'path'

console.log('🔍 Checking Data Import System Setup')
console.log('====================================\n')

let issues = []
let warnings = []

// Check if required files exist
const requiredFiles = [
  'functions/api/data-import/index.ts',
  'functions/lib/cors.ts',
  'functions/package.json',
  'public/data-import.html',
  '.dev.vars.local-test'
]

console.log('📁 Checking required files...')
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file}`)
    issues.push(`Missing file: ${file}`)
  }
})

// Check package.json dependencies
console.log('\n📦 Checking dependencies...')
try {
  const packageJson = JSON.parse(fs.readFileSync('functions/package.json', 'utf-8'))
  const requiredDeps = ['xlsx', 'bcryptjs', '@supabase/supabase-js']
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`)
    } else {
      console.log(`❌ ${dep}: missing`)
      issues.push(`Missing dependency: ${dep}`)
    }
  })
} catch (error) {
  console.log('❌ Cannot read functions/package.json')
  issues.push('Cannot read functions/package.json')
}

// Check environment variables
console.log('\n🔧 Checking environment setup...')
if (fs.existsSync('.dev.vars')) {
  const envContent = fs.readFileSync('.dev.vars', 'utf-8')
  
  const requiredVars = [
    'FORCE_LOCAL_ONLY',
    'SSO_LOCAL_URL',
    'SSO_LOCAL_SERVICE_ROLE_KEY',
    'SKILLPASSPORT_LOCAL_URL',
    'SKILLPASSPORT_LOCAL_SERVICE_ROLE_KEY'
  ]
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName}`)
    } else {
      console.log(`⚠️  ${varName}`)
      warnings.push(`Missing environment variable: ${varName}`)
    }
  })
  
  // Check if production vars are disabled
  if (envContent.includes('SSO_SUPABASE_URL=http') || envContent.includes('SKILLPASSPORT_SUPABASE_URL=http')) {
    console.log('⚠️  Production URLs detected but seem to be local')
    warnings.push('Verify production URLs are properly configured or disabled')
  }
} else {
  console.log('❌ .dev.vars file missing')
  issues.push('Missing .dev.vars file')
}

// Check API function structure
console.log('\n🔌 Checking API function...')
try {
  const apiContent = fs.readFileSync('functions/api/data-import/index.ts', 'utf-8')
  
  const requiredExports = ['onRequestOptions', 'onRequestPost', 'onRequestGet']
  requiredExports.forEach(exportName => {
    if (apiContent.includes(`export const ${exportName}`)) {
      console.log(`✅ ${exportName}`)
    } else {
      console.log(`❌ ${exportName}`)
      issues.push(`Missing export: ${exportName}`)
    }
  })
  
  // Check for updated password
  if (apiContent.includes("rareminds123!")) {
    console.log(`✅ Default password updated`)
  } else if (apiContent.includes("TempPass123!")) {
    console.log(`⚠️  Old default password detected`)
    warnings.push('Default password not updated to rareminds123!')
  } else {
    console.log(`⚠️  No default password found`)
    warnings.push('Cannot verify default password')
  }
  
  // Check email verification setting
  if (apiContent.includes("is_email_verified: true")) {
    console.log(`✅ Email verification set to true`)
  } else {
    console.log(`⚠️  Email verification not set to true`)
    warnings.push('Email verification should be set to true for imported users')
  }
  
} catch (error) {
  console.log('❌ Cannot read API function')
  issues.push('Cannot read API function file')
}

// Check HTML interface
console.log('\n🌐 Checking web interface...')
try {
  const htmlContent = fs.readFileSync('public/data-import.html', 'utf-8')
  
  if (htmlContent.includes('/api/data-import')) {
    console.log(`✅ API endpoints configured`)
  } else {
    console.log(`❌ API endpoints not found`)
    issues.push('API endpoints not configured in HTML')
  }
  
  if (htmlContent.includes('rareminds123!')) {
    console.log(`✅ HTML shows updated password`)
  } else if (htmlContent.includes('TempPass123!')) {
    console.log(`⚠️  HTML shows old password`)
    warnings.push('HTML interface shows old default password')
  }
  
} catch (error) {
  console.log('❌ Cannot read HTML interface')
  issues.push('Cannot read HTML interface file')
}

// Summary
console.log('\n' + '='.repeat(50))

if (issues.length === 0 && warnings.length === 0) {
  console.log('🎉 All checks passed! Data import system is ready.')
  console.log('\n📋 Next steps:')
  console.log('1. Install dependencies: cd functions && npm install')
  console.log('2. Start local testing: ./setup-local-test.sh')
  console.log('3. Start dev server: npx wrangler pages dev . --compatibility-date=2023-11-30')
  console.log('4. Access interface: http://localhost:8788/data-import.html')
} else {
  if (issues.length > 0) {
    console.log('❌ Critical issues found:')
    issues.forEach(issue => console.log(`  • ${issue}`))
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    warnings.forEach(warning => console.log(`  • ${warning}`))
  }
  
  console.log('\n🔧 Fix these issues before proceeding.')
}

console.log('\n📖 Documentation:')
console.log('• Setup guide: LOCAL_TESTING_GUIDE.md')
console.log('• API docs: DATA_IMPORT_README.md')
console.log('• API endpoint: /api/data-import')
console.log('• Web interface: /data-import.html')