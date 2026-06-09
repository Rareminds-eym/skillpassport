#!/usr/bin/env node

/**
 * Test script to validate local data import setup
 * This verifies that data goes to local Docker containers only
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Local Docker Supabase URLs (these should match your setup)
const SSO_LOCAL_URL = 'http://localhost:54321'
const SSO_LOCAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const SKILLPASSPORT_LOCAL_URL = 'http://localhost:54322'  
const SKILLPASSPORT_LOCAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function testLocalConnection() {
  console.log('🧪 Testing Local Database Connections')
  console.log('====================================')
  
  try {
    // Test SSO connection
    console.log('📡 Testing SSO database connection...')
    const ssoClient = createClient(SSO_LOCAL_URL, SSO_LOCAL_KEY)
    const { data: ssoHealth, error: ssoError } = await ssoClient
      .from('organizations')
      .select('count', { count: 'exact', head: true })
    
    if (ssoError) {
      console.log('❌ SSO database connection failed:', ssoError.message)
      return false
    }
    
    console.log('✅ SSO database connected successfully')
    console.log(`   Organizations count: ${ssoHealth?.length || 0}`)
    
    // Test Skillpassport connection
    console.log('📡 Testing Skillpassport database connection...')
    const skillpassportClient = createClient(SKILLPASSPORT_LOCAL_URL, SKILLPASSPORT_LOCAL_KEY)
    const { data: spHealth, error: spError } = await skillpassportClient
      .from('organizations') 
      .select('count', { count: 'exact', head: true })
    
    if (spError) {
      console.log('❌ Skillpassport database connection failed:', spError.message)
      return false
    }
    
    console.log('✅ Skillpassport database connected successfully')
    console.log(`   Organizations count: ${spHealth?.length || 0}`)
    
    return true
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    return false
  }
}

async function testCreateTestData() {
  console.log('\n🔬 Testing Data Creation')
  console.log('========================')
  
  try {
    const ssoClient = createClient(SSO_LOCAL_URL, SSO_LOCAL_KEY)
    const skillpassportClient = createClient(SKILLPASSPORT_LOCAL_URL, SKILLPASSPORT_LOCAL_KEY)
    
    // Create test organization in SSO
    console.log('📝 Creating test organization in SSO...')
    const { data: ssoOrg, error: ssoError } = await ssoClient
      .from('organizations')
      .insert({
        name: 'Test Import Validation',
        slug: 'test-import-validation',
        metadata: { test: true, created_by: 'test-script' }
      })
      .select()
      .single()
    
    if (ssoError) {
      console.log('❌ Failed to create SSO organization:', ssoError.message)
      return false
    }
    
    console.log(`✅ Created SSO organization: ${ssoOrg.id}`)
    
    // Create test organization in Skillpassport
    console.log('📝 Creating test organization in Skillpassport...')
    const { data: spOrg, error: spError } = await skillpassportClient
      .from('organizations')
      .insert({
        name: 'Test Import Validation',
        organization_type: 'university',
        email: 'test@validation.local',
        verification_status: 'approved',
        is_active: true,
        approval_status: 'approved',
        account_status: 'active',
        metadata: { 
          test: true, 
          created_by: 'test-script',
          sso_org_id: ssoOrg.id 
        }
      })
      .select()
      .single()
    
    if (spError) {
      console.log('❌ Failed to create Skillpassport organization:', spError.message)
      return false
    }
    
    console.log(`✅ Created Skillpassport organization: ${spOrg.id}`)
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...')
    await ssoClient.from('organizations').delete().eq('id', ssoOrg.id)
    await skillpassportClient.from('organizations').delete().eq('id', spOrg.id)
    
    console.log('✅ Test data cleaned up')
    
    return true
    
  } catch (error) {
    console.error('❌ Data creation test failed:', error.message)
    return false
  }
}

async function checkEnvironmentIsolation() {
  console.log('\n🔒 Checking Environment Isolation')
  console.log('=================================')
  
  // Check if production URLs are accessible (they shouldn't be)
  const prodVars = [
    'SSO_SUPABASE_URL',
    'SSO_SERVICE_ROLE_KEY', 
    'SKILLPASSPORT_SUPABASE_URL',
    'SKILLPASSPORT_SERVICE_ROLE_KEY'
  ]
  
  let hasProductionVars = false
  
  prodVars.forEach(varName => {
    if (process.env[varName] && process.env[varName].includes('supabase.co')) {
      console.log(`⚠️  Production variable detected: ${varName}`)
      hasProductionVars = true
    }
  })
  
  if (hasProductionVars) {
    console.log('⚠️  Production environment variables found!')
    console.log('   Make sure FORCE_LOCAL_ONLY=true in .dev.vars')
    console.log('   Or remove production variables for safety')
  } else {
    console.log('✅ No production variables detected')
  }
  
  // Check FORCE_LOCAL_ONLY setting
  if (process.env.FORCE_LOCAL_ONLY === 'true') {
    console.log('✅ FORCE_LOCAL_ONLY mode is active')
  } else {
    console.log('⚠️  FORCE_LOCAL_ONLY mode is NOT active')
    console.log('   Set FORCE_LOCAL_ONLY=true in .dev.vars for safety')
  }
  
  return !hasProductionVars || process.env.FORCE_LOCAL_ONLY === 'true'
}

async function main() {
  console.log('🚀 Local Data Import Test Suite')
  console.log('===============================\n')
  
  // Load environment variables if .env file exists
  if (fs.existsSync('.dev.vars')) {
    console.log('📄 Loading .dev.vars file...')
    const envContent = fs.readFileSync('.dev.vars', 'utf-8')
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        const value = valueParts.join('=')
        if (key && value) {
          process.env[key.trim()] = value.trim()
        }
      }
    })
  }
  
  const tests = [
    { name: 'Database Connection', fn: testLocalConnection },
    { name: 'Data Creation', fn: testCreateTestData },
    { name: 'Environment Isolation', fn: checkEnvironmentIsolation }
  ]
  
  let allPassed = true
  
  for (const test of tests) {
    const passed = await test.fn()
    if (!passed) {
      allPassed = false
    }
  }
  
  console.log('\n' + '='.repeat(50))
  
  if (allPassed) {
    console.log('🎉 All tests passed! Local environment is ready for data import testing.')
    console.log('\nNext steps:')
    console.log('1. Start dev server: npx wrangler pages dev . --compatibility-date=2023-11-30')
    console.log('2. Open: http://localhost:8788/data-import.html')
    console.log('3. Use "Local" environment for safe testing')
  } else {
    console.log('❌ Some tests failed. Please check the issues above.')
    console.log('\nTroubleshooting:')
    console.log('1. Make sure Docker containers are running: docker-compose -f docker-compose.local-test.yml ps')
    console.log('2. Check .dev.vars has correct local URLs')  
    console.log('3. Verify FORCE_LOCAL_ONLY=true is set')
  }
}

// Run the tests
main().catch(console.error)