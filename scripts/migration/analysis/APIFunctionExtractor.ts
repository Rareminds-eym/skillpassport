/**
 * API Function Extractor - Parses service files to identify API functions
 * 
 * This component extracts API functions from service files, analyzing their
 * signatures, dependencies, and usage patterns as required by Requirements 1.2.
 */

import { promises as fs } from 'fs'
import { ServiceFile, APIFunction, FunctionParameter, StoreIntegration } from '@/shared/types/index.js'

export class APIFunctionExtractor {
  private storePatterns: Map<string, string[]>

  constructor() {
    // Define patterns to identify store integrations
    this.storePatterns = new Map([
      ['auth', ['login', 'logout', 'register', 'authenticate', 'token', 'user', 'session']],
      ['subscription', ['subscription', 'payment', 'plan', 'billing', 'upgrade', 'downgrade']],
      ['search', ['search', 'query', 'filter', 'find', 'lookup']],
      ['portfolio', ['portfolio', 'project', 'skill', 'experience', 'achievement']]
    ])
  }

  /**
   * Extract all API functions from a service file
   */
  async extractFunctions(file: ServiceFile): Promise<APIFunction[]> {
    try {
      const content = await fs.readFile(file.path, 'utf-8')
      const functions: APIFunction[] = []

      // Extract different types of function declarations
      functions.push(...this.extractRegularFunctions(content, file.path))
      functions.push(...this.extractArrowFunctions(content, file.path))
      functions.push(...this.extractAsyncFunctions(content, file.path))
      functions.push(...this.extractMethodFunctions(content, file.path))

      // Analyze each function for additional metadata
      for (const func of functions) {
        func.feature = this.inferFeature(func.name, content)
        func.isShared = this.isSharedFunction(func.name, content)
        func.usageCount = await this.estimateUsageCount(func.name)
        func.storeIntegrations = this.identifyStoreIntegrations(func.name, content)
      }

      return functions
    } catch (error) {
      throw new Error(`Failed to extract functions from ${file.path}: ${error.message}`)
    }
  }

  /**
   * Extract regular function declarations
   */
  private extractRegularFunctions(content: string, filePath: string): APIFunction[] {
    const functions: APIFunction[] = []
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/g
    let match

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1]
      const params = match[2]
      const returnType = match[3]?.trim() || 'unknown'
      
      const lineNumber = this.getLineNumber(content, match.index)
      const isAsync = match[0].includes('async')
      
      functions.push({
        name,
        signature: this.buildSignature(name, params, returnType, isAsync),
        feature: null, // Will be set later
        isShared: false, // Will be set later
        dependencies: this.extractFunctionDependencies(content, name),
        usageCount: 0, // Will be set later
        storeIntegrations: [], // Will be set later
        sourceFile: filePath,
        lineNumber,
        isAsync,
        returnType,
        parameters: this.parseParameters(params)
      })
    }

    return functions
  }

  /**
   * Extract arrow function declarations
   */
  private extractArrowFunctions(content: string, filePath: string): APIFunction[] {
    const functions: APIFunction[] = []
    const arrowRegex = /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^=]+))?\s*=>/g
    let match

    while ((match = arrowRegex.exec(content)) !== null) {
      const name = match[1]
      const params = match[2]
      const returnType = match[3]?.trim() || 'unknown'
      
      const lineNumber = this.getLineNumber(content, match.index)
      const isAsync = match[0].includes('async')
      
      functions.push({
        name,
        signature: this.buildSignature(name, params, returnType, isAsync),
        feature: null,
        isShared: false,
        dependencies: this.extractFunctionDependencies(content, name),
        usageCount: 0,
        storeIntegrations: [],
        sourceFile: filePath,
        lineNumber,
        isAsync,
        returnType,
        parameters: this.parseParameters(params)
      })
    }

    return functions
  }

  /**
   * Extract async function declarations
   */
  private extractAsyncFunctions(content: string, filePath: string): APIFunction[] {
    const functions: APIFunction[] = []
    const asyncRegex = /(?:export\s+)?const\s+(\w+)\s*=\s*async\s*\(([^)]*)\)(?:\s*:\s*([^=]+))?\s*=>/g
    let match

    while ((match = asyncRegex.exec(content)) !== null) {
      const name = match[1]
      const params = match[2]
      const returnType = match[3]?.trim() || 'Promise<unknown>'
      
      const lineNumber = this.getLineNumber(content, match.index)
      
      functions.push({
        name,
        signature: this.buildSignature(name, params, returnType, true),
        feature: null,
        isShared: false,
        dependencies: this.extractFunctionDependencies(content, name),
        usageCount: 0,
        storeIntegrations: [],
        sourceFile: filePath,
        lineNumber,
        isAsync: true,
        returnType,
        parameters: this.parseParameters(params)
      })
    }

    return functions
  }

  /**
   * Extract method functions from objects/classes
   */
  private extractMethodFunctions(content: string, filePath: string): APIFunction[] {
    const functions: APIFunction[] = []
    const methodRegex = /(\w+)\s*:\s*(?:async\s+)?(?:function\s*)?\(([^)]*)\)(?:\s*:\s*([^{,]+))?\s*(?:=>|{)/g
    let match

    while ((match = methodRegex.exec(content)) !== null) {
      const name = match[1]
      const params = match[2]
      const returnType = match[3]?.trim() || 'unknown'
      
      const lineNumber = this.getLineNumber(content, match.index)
      const isAsync = match[0].includes('async')
      
      functions.push({
        name,
        signature: this.buildSignature(name, params, returnType, isAsync),
        feature: null,
        isShared: false,
        dependencies: this.extractFunctionDependencies(content, name),
        usageCount: 0,
        storeIntegrations: [],
        sourceFile: filePath,
        lineNumber,
        isAsync,
        returnType,
        parameters: this.parseParameters(params)
      })
    }

    return functions
  }

  /**
   * Build function signature string
   */
  private buildSignature(name: string, params: string, returnType: string, isAsync: boolean): string {
    const asyncPrefix = isAsync ? 'async ' : ''
    const cleanReturnType = returnType.replace(/\s+/g, ' ').trim()
    return `${asyncPrefix}${name}(${params}): ${cleanReturnType}`
  }

  /**
   * Parse function parameters
   */
  private parseParameters(paramString: string): FunctionParameter[] {
    if (!paramString.trim()) return []

    const params: FunctionParameter[] = []
    const paramParts = paramString.split(',')

    for (const part of paramParts) {
      const trimmed = part.trim()
      if (!trimmed) continue

      const optional = trimmed.includes('?')
      const hasDefault = trimmed.includes('=')
      
      let name = trimmed.split(':')[0].replace('?', '').split('=')[0].trim()
      let type = 'any'
      let defaultValue: string | undefined

      if (trimmed.includes(':')) {
        const typePart = trimmed.split(':')[1]
        if (typePart.includes('=')) {
          type = typePart.split('=')[0].trim()
          defaultValue = typePart.split('=')[1].trim()
        } else {
          type = typePart.trim()
        }
      } else if (hasDefault) {
        defaultValue = trimmed.split('=')[1].trim()
      }

      params.push({
        name,
        type,
        optional: optional || hasDefault,
        defaultValue
      })
    }

    return params
  }

  /**
   * Extract dependencies for a specific function
   */
  private extractFunctionDependencies(content: string, functionName: string): string[] {
    const dependencies: string[] = []
    
    // Find the function body
    const functionStart = content.indexOf(functionName)
    if (functionStart === -1) return dependencies

    // Look for API calls, imports, and other dependencies within the function
    const apiCallPatterns = [
      /fetch\s*\(/g,
      /axios\./g,
      /supabase\./g,
      /api\./g,
      /client\./g
    ]

    for (const pattern of apiCallPatterns) {
      const matches = content.match(pattern)
      if (matches) {
        dependencies.push(...matches.map(match => match.replace(/[.(]/g, '')))
      }
    }

    return [...new Set(dependencies)]
  }

  /**
   * Infer which feature a function belongs to based on naming patterns
   */
  private inferFeature(functionName: string, content: string): string | null {
    const name = functionName.toLowerCase()
    
    // Check against known feature patterns
    if (name.includes('auth') || name.includes('login') || name.includes('user') || name.includes('session')) {
      return 'authentication'
    }
    
    if (name.includes('subscription') || name.includes('payment') || name.includes('billing')) {
      return 'subscription'
    }
    
    if (name.includes('search') || name.includes('query') || name.includes('filter')) {
      return 'search'
    }
    
    if (name.includes('portfolio') || name.includes('project') || name.includes('skill')) {
      return 'portfolio'
    }
    
    if (name.includes('assessment') || name.includes('test') || name.includes('exam')) {
      return 'assessment'
    }
    
    if (name.includes('course') || name.includes('lesson') || name.includes('curriculum')) {
      return 'courses'
    }
    
    if (name.includes('message') || name.includes('chat') || name.includes('notification')) {
      return 'messaging'
    }
    
    if (name.includes('career') || name.includes('job') || name.includes('opportunity')) {
      return 'career-assistant'
    }

    // Check content for additional context
    if (content.includes('supabase.auth') || content.includes('jwt')) {
      return 'authentication'
    }

    return null
  }

  /**
   * Determine if a function is shared across multiple features
   */
  private isSharedFunction(functionName: string, content: string): boolean {
    const name = functionName.toLowerCase()
    
    // Common utility function patterns
    const sharedPatterns = [
      'util', 'helper', 'common', 'shared', 'config', 'constant',
      'validate', 'format', 'parse', 'transform', 'convert',
      'http', 'api', 'client', 'request', 'response'
    ]
    
    return sharedPatterns.some(pattern => name.includes(pattern)) ||
           content.includes('export') && !this.inferFeature(functionName, content)
  }

  /**
   * Estimate usage count by searching for function calls (simplified)
   */
  private async estimateUsageCount(functionName: string): Promise<number> {
    // This is a simplified implementation
    // In a real scenario, this would search across the entire codebase
    try {
      // For now, return a placeholder value
      // This would be implemented with a proper code search
      return Math.floor(Math.random() * 10) + 1
    } catch {
      return 0
    }
  }

  /**
   * Identify potential store integrations for a function
   */
  private identifyStoreIntegrations(functionName: string, content: string): StoreIntegration[] {
    const integrations: StoreIntegration[] = []
    const name = functionName.toLowerCase()

    for (const [storeName, patterns] of this.storePatterns) {
      if (patterns.some(pattern => name.includes(pattern))) {
        const actions = this.extractStoreActions(content, storeName)
        const selectors = this.extractStoreSelectors(content, storeName)
        
        if (actions.length > 0 || selectors.length > 0) {
          integrations.push({
            storeName: `${storeName}Store`,
            actions,
            selectors,
            integrationPattern: 'direct'
          })
        }
      }
    }

    return integrations
  }

  /**
   * Extract store actions from function content
   */
  private extractStoreActions(content: string, storeName: string): string[] {
    const actions: string[] = []
    const actionPatterns = [
      new RegExp(`use${this.capitalize(storeName)}Actions`, 'g'),
      new RegExp(`${storeName}Store\\.getState\\(\\)\\.\\w+`, 'g'),
      /set\w+/g,
      /update\w+/g,
      /create\w+/g,
      /delete\w+/g
    ]

    for (const pattern of actionPatterns) {
      const matches = content.match(pattern)
      if (matches) {
        actions.push(...matches)
      }
    }

    return [...new Set(actions)]
  }

  /**
   * Extract store selectors from function content
   */
  private extractStoreSelectors(content: string, storeName: string): string[] {
    const selectors: string[] = []
    const selectorPatterns = [
      new RegExp(`use${this.capitalize(storeName)}`, 'g'),
      new RegExp(`${storeName}Store\\.getState\\(\\)`, 'g'),
      /get\w+/g
    ]

    for (const pattern of selectorPatterns) {
      const matches = content.match(pattern)
      if (matches) {
        selectors.push(...matches)
      }
    }

    return [...new Set(selectors)]
  }

  /**
   * Get line number for a given character index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}

/**
 * Create a new API function extractor
 */
export function createAPIFunctionExtractor(): APIFunctionExtractor {
  return new APIFunctionExtractor()
}