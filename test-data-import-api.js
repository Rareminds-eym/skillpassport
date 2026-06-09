#!/usr/bin/env node

/**
 * API Testing Script for Data Import System
 * Tests all endpoints and functionality
 */

import fs from 'fs'

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:8788'
const TEST_ENV = process.env.TEST_ENVIRONMENT || 'local'

console.log('🧪 Testing Data Import API')
console.log('========================')
console.log(`Base URL: ${BASE_URL}`)
console.log(`Environment: ${TEST_ENV}`)
console.log('')

async function testTemplateDownload(dataType) {
    console.log(`📥 Testing ${dataType} template download...`)
    
    try {
        const response = await fetch(`${BASE_URL}/api/data-import?action=template&dataType=${dataType}`)
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('spreadsheet')) {
            console.log(`⚠️  Unexpected content type: ${contentType}`)
        }
        
        const blob = await response.blob()
        console.log(`✅ ${dataType} template: ${blob.size} bytes`)
        
        return true
    } catch (error) {
        console.log(`❌ ${dataType} template failed: ${error.message}`)
        return false
    }
}

async function testOptionsRequest() {
    console.log('🔧 Testing CORS OPTIONS request...')
    
    try {
        const response = await fetch(`${BASE_URL}/api/data-import`, {
            method: 'OPTIONS'
        })
        
        if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`)
        }
        
        const corsHeaders = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers'
        ]
        
        let missingHeaders = []
        corsHeaders.forEach(header => {
            if (!response.headers.get(header)) {
                missingHeaders.push(header)
            }
        })
        
        if (missingHeaders.length > 0) {
            console.log(`⚠️  Missing CORS headers: ${missingHeaders.join(', ')}`)
        }
        
        console.log('✅ CORS preflight OK')
        return true
    } catch (error) {
        console.log(`❌ CORS preflight failed: ${error.message}`)
        return false
    }
}

async function testInvalidRequests() {
    console.log('🚫 Testing invalid requests...')
    
    const tests = [
        {
            name: 'Empty POST request',
            url: `${BASE_URL}/api/data-import?env=${TEST_ENV}`,
            options: { method: 'POST' },
            expectedStatus: 400
        },
        {
            name: 'Invalid template request',
            url: `${BASE_URL}/api/data-import?action=template&dataType=invalid`,
            options: { method: 'GET' },
            expectedStatus: 500
        },
        {
            name: 'Missing action parameter',
            url: `${BASE_URL}/api/data-import?dataType=universities`,
            options: { method: 'GET' },
            expectedStatus: 400
        }
    ]
    
    let passedTests = 0
    
    for (const test of tests) {
        try {
            const response = await fetch(test.url, test.options)
            
            if (response.status === test.expectedStatus) {
                console.log(`✅ ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`)
                passedTests++
            } else {
                console.log(`⚠️  ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`)
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message}`)
        }
    }
    
    return passedTests === tests.length
}

async function testEnvironmentValidation() {
    console.log('🔒 Testing environment validation...')
    
    // Test production access with FORCE_LOCAL_ONLY
    try {
        const formData = new FormData()
        // Create a minimal test file
        const testFile = new Blob(['name,email\nTest User,test@test.com'], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        formData.append('file', testFile, 'test.xlsx')
        formData.append('dataType', 'universities')
        
        const response = await fetch(`${BASE_URL}/api/data-import?env=production`, {
            method: 'POST',
            body: formData
        })
        
        if (response.status === 500) {
            const errorData = await response.json()
            if (errorData.details && errorData.details.includes('FORCE_LOCAL_ONLY')) {
                console.log('✅ Production access properly blocked')
                return true
            }
        }
        
        if (response.ok) {
            console.log('⚠️  Production access NOT blocked - security risk!')
            return false
        }
        
        console.log(`⚠️  Unexpected response: ${response.status}`)
        return false
        
    } catch (error) {
        console.log(`❌ Environment validation test failed: ${error.message}`)
        return false
    }
}

async function runAllTests() {
    console.log('🚀 Running comprehensive API tests...\n')
    
    const tests = [
        { name: 'CORS Options', fn: testOptionsRequest },
        { name: 'Universities Template', fn: () => testTemplateDownload('universities') },
        { name: 'Colleges Template', fn: () => testTemplateDownload('colleges') },
        { name: 'Students Template', fn: () => testTemplateDownload('students') },
        { name: 'Invalid Requests', fn: testInvalidRequests },
        { name: 'Environment Validation', fn: testEnvironmentValidation }
    ]
    
    let passed = 0
    let total = tests.length
    
    for (const test of tests) {
        console.log(`\n--- ${test.name} ---`)
        const result = await test.fn()
        if (result) passed++
        console.log('')
    }
    
    console.log('='.repeat(50))
    console.log(`📊 Test Results: ${passed}/${total} passed`)
    
    if (passed === total) {
        console.log('🎉 All tests passed! API is working correctly.')
        console.log('')
        console.log('✅ Ready for data import:')
        console.log(`   Interface: ${BASE_URL}/data-import.html`)
        console.log(`   API: ${BASE_URL}/api/data-import`)
        console.log('   Default password: rareminds123!')
    } else {
        console.log('❌ Some tests failed. Please check the issues above.')
        console.log('')
        console.log('🔧 Common fixes:')
        console.log('1. Ensure dev server is running')
        console.log('2. Check environment variables are set')
        console.log('3. Verify CORS configuration')
        console.log('4. Check function deployment')
    }
    
    return passed === total
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('Test runner error:', error)
            process.exit(1)
        })
}