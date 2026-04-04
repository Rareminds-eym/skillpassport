#!/usr/bin/env node
/**
 * Type Safety Validation Script
 * 
 * Runs comprehensive type safety validation including TypeScript compilation,
 * entity interfaces, API types, and Zustand store types.
 * 
 * Usage:
 *   npm run validate:types
 *   npm run validate:types -- --strict
 *   npm run validate:types -- --config custom-config.json
 */

import { TypeSafetyValidator } from '../type-safety'
import { TypeSafetyConfig } from '@/shared/types/type-safety'
import * as fs from 'fs/promises'
import * as path from 'path'

interface CLIOptions {
  strict?: boolean
  config?: string
  verbose?: boolean
  json?: boolean
  exitOnError?: boolean
}

async function main() {
  const options = parseArgs()
  
  try {
    // Load configuration
    const config = await loadConfig(options)
    
    // Create validator
    const validator = new TypeSafetyValidator(process.cwd(), config)
    
    console.log('🔍 Running type safety validation...\n')
    
    // Generate report
    const report = await validator.generateReport()
    
    // Display results
    if (options.json) {
      console.log(JSON.stringify(report, null, 2))
    } else {
      displayReport(report, options.verbose || false)
    }
    
    // Exit with appropriate code
    if (options.exitOnError && !report.summary.passesQualityGate) {
      console.error('\n❌ Type safety validation failed')
      process.exit(1)
    }
    
    if (report.summary.passesQualityGate) {
      console.log('\n✅ Type safety validation passed')
      process.exit(0)
    } else {
      console.log('\n⚠️  Type safety validation completed with issues')
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Type safety validation failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {
    exitOnError: true
  }
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--strict':
        options.strict = true
        break
      case '--config':
        options.config = args[++i]
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--json':
        options.json = true
        break
      case '--no-exit':
        options.exitOnError = false
        break
    }
  }
  
  return options
}

/**
 * Load configuration
 */
async function loadConfig(options: CLIOptions): Promise<Partial<TypeSafetyConfig>> {
  let config: Partial<TypeSafetyConfig> = {}
  
  // Load from file if specified
  if (options.config) {
    try {
      const configPath = path.resolve(process.cwd(), options.config)
      const configContent = await fs.readFile(configPath, 'utf-8')
      config = JSON.parse(configContent)
    } catch (error) {
      console.warn(`⚠️  Could not load config file: ${options.config}`)
    }
  }
  
  // Apply strict mode if specified
  if (options.strict) {
    config.strictMode = true
    config.qualityGateThreshold = 95
  }
  
  return config
}

/**
 * Display validation report
 */
function displayReport(report: any, verbose: boolean) {
  console.log('📊 Type Safety Validation Report')
  console.log('═'.repeat(60))
  console.log(`Timestamp: ${report.timestamp}`)
  console.log(`Overall Score: ${report.summary.overallScore}/100`)
  console.log(`Quality Gate: ${report.summary.passesQualityGate ? '✅ PASS' : '❌ FAIL'}`)
  console.log()
  
  // Summary
  console.log('📈 Summary')
  console.log('─'.repeat(60))
  console.log(`Total Errors: ${report.summary.totalErrors}`)
  console.log(`Critical Errors: ${report.summary.criticalErrors}`)
  console.log(`Total Warnings: ${report.summary.totalWarnings}`)
  console.log()
  
  // TypeScript Validation
  console.log('🔧 TypeScript Compilation')
  console.log('─'.repeat(60))
  console.log(`Status: ${report.typeScriptValidation.success ? '✅ Success' : '❌ Failed'}`)
  console.log(`Strict Mode: ${report.typeScriptValidation.strictModeEnabled ? '✅ Enabled' : '⚠️  Disabled'}`)
  console.log(`Total Files: ${report.typeScriptValidation.totalFiles}`)
  console.log(`Files with Errors: ${report.typeScriptValidation.filesWithErrors}`)
  console.log(`Errors: ${report.typeScriptValidation.errors.length}`)
  console.log(`Warnings: ${report.typeScriptValidation.warnings.length}`)
  
  if (verbose && report.typeScriptValidation.errors.length > 0) {
    console.log('\nTop Errors:')
    report.typeScriptValidation.errors.slice(0, 10).forEach((error: any) => {
      console.log(`  • ${error.file}:${error.line}:${error.column}`)
      console.log(`    ${error.message}`)
      if (error.suggestion) {
        console.log(`    💡 ${error.suggestion}`)
      }
    })
    if (report.typeScriptValidation.errors.length > 10) {
      console.log(`  ... and ${report.typeScriptValidation.errors.length - 10} more`)
    }
  }
  console.log()
  
  // Entity Interface Validation
  console.log('🏢 Entity Interfaces')
  console.log('─'.repeat(60))
  console.log(`Status: ${report.entityInterfaceValidation.valid ? '✅ Valid' : '⚠️  Issues Found'}`)
  console.log(`Total Entities: ${report.entityInterfaceValidation.totalEntities}`)
  console.log(`Valid Entities: ${report.entityInterfaceValidation.validEntities}`)
  console.log(`Missing Interfaces: ${report.entityInterfaceValidation.missingInterfaces.length}`)
  console.log(`Incomplete Interfaces: ${report.entityInterfaceValidation.incompleteInterfaces.length}`)
  
  if (verbose && report.entityInterfaceValidation.missingInterfaces.length > 0) {
    console.log('\nMissing Interfaces:')
    report.entityInterfaceValidation.missingInterfaces.forEach((entity: string) => {
      console.log(`  • ${entity}`)
    })
  }
  console.log()
  
  // API Type Validation
  console.log('🌐 API Function Types')
  console.log('─'.repeat(60))
  console.log(`Status: ${report.apiTypeValidation.valid ? '✅ Valid' : '⚠️  Issues Found'}`)
  console.log(`Total Methods: ${report.apiTypeValidation.totalMethods}`)
  console.log(`Valid Methods: ${report.apiTypeValidation.validMethods}`)
  console.log(`Methods with Request Types: ${report.apiTypeValidation.summary.methodsWithRequestTypes}`)
  console.log(`Methods with Response Types: ${report.apiTypeValidation.summary.methodsWithResponseTypes}`)
  console.log(`Missing Types: ${report.apiTypeValidation.missingTypes.length}`)
  
  if (verbose && report.apiTypeValidation.missingTypes.length > 0) {
    console.log('\nMethods with Missing Types:')
    report.apiTypeValidation.missingTypes.slice(0, 10).forEach((method: any) => {
      console.log(`  • ${method.methodName} (${method.filePath})`)
      console.log(`    Missing: ${method.missingRequest ? 'Request' : ''} ${method.missingResponse ? 'Response' : ''}`)
    })
    if (report.apiTypeValidation.missingTypes.length > 10) {
      console.log(`  ... and ${report.apiTypeValidation.missingTypes.length - 10} more`)
    }
  }
  console.log()
  
  // Store Type Validation
  console.log('🗄️  Zustand Store Types')
  console.log('─'.repeat(60))
  console.log(`Status: ${report.storeTypeValidation.valid ? '✅ Valid' : '⚠️  Issues Found'}`)
  console.log(`Total Stores: ${report.storeTypeValidation.totalStores}`)
  console.log(`Valid Stores: ${report.storeTypeValidation.validStores}`)
  console.log(`Stores with State Interface: ${report.storeTypeValidation.summary.storesWithStateInterface}`)
  console.log(`Stores with Typed Selectors: ${report.storeTypeValidation.summary.storesWithTypedSelectors}`)
  console.log(`Stores with Typed Actions: ${report.storeTypeValidation.summary.storesWithTypedActions}`)
  
  if (verbose && report.storeTypeValidation.missingTypes.length > 0) {
    console.log('\nStores with Missing Types:')
    report.storeTypeValidation.missingTypes.forEach((store: any) => {
      console.log(`  • ${store.storeName} (${store.filePath})`)
      console.log(`    Missing: ${store.missingStateInterface ? 'State Interface' : ''} ${store.missingTypedSelectors ? 'Typed Selectors' : ''} ${store.missingTypedActions ? 'Typed Actions' : ''}`)
    })
  }
  console.log()
  
  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations')
    console.log('─'.repeat(60))
    report.recommendations.forEach((rec: any, index: number) => {
      const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'
      console.log(`${index + 1}. ${priorityIcon} [${rec.priority.toUpperCase()}] ${rec.title}`)
      console.log(`   ${rec.description}`)
      console.log(`   Effort: ${rec.estimatedEffort} | Impact: ${rec.impact}`)
      if (verbose) {
        console.log(`   Affected files: ${rec.affectedFiles.length}`)
      }
      console.log()
    })
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
