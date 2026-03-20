/**
 * CompositionAnalyzer - Analyzes widget composition patterns
 * 
 * Provides detailed analysis of how widgets compose features, entities,
 * and shared components, including data flow and state management patterns.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import {
  CompositionPattern,
  DataFlowPattern,
  PropDrillingAnalysis,
  ContextUsagePattern
} from '../types/widget-migration'

export class CompositionAnalyzer {
  private projectRoot: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
  }

  /**
   * Analyze composition patterns in a widget
   */
  async analyzeCompositionPatterns(widgetPath: string): Promise<CompositionPattern[]> {
    const content = await this.readFile(widgetPath)
    const patterns: CompositionPattern[] = []

    // Pattern 1: Feature composition
    const featureComposition = this.detectFeatureComposition(content)
    if (featureComposition) {
      patterns.push(featureComposition)
    }

    // Pattern 2: Entity composition
    const entityComposition = this.detectEntityComposition(content)
    if (entityComposition) {
      patterns.push(entityComposition)
    }

    // Pattern 3: Shared component composition
    const sharedComposition = this.detectSharedComposition(content)
    if (sharedComposition) {
      patterns.push(sharedComposition)
    }

    return patterns
  }

  /**
   * Analyze data flow patterns
   */
  async analyzeDataFlow(widgetPath: string): Promise<DataFlowPattern> {
    const content = await this.readFile(widgetPath)

    const propsFlow = this.analyzePropsFlow(content)
    const contextFlow = this.analyzeContextFlow(content)
    const storeFlow = this.analyzeStoreFlow(content)
    const eventFlow = this.analyzeEventFlow(content)

    return {
      propsFlow,
      contextFlow,
      storeFlow,
      eventFlow,
      complexity: this.calculateDataFlowComplexity(propsFlow, contextFlow, storeFlow, eventFlow)
    }
  }

  /**
   * Analyze prop drilling patterns
   */
  async analyzePropDrilling(widgetPath: string): Promise<PropDrillingAnalysis> {
    const content = await this.readFile(widgetPath)

    const propChains = this.detectPropChains(content)
    const maxDepth = Math.max(...propChains.map(c => c.depth), 0)
    const averageDepth = propChains.length > 0 
      ? propChains.reduce((sum, c) => sum + c.depth, 0) / propChains.length 
      : 0

    const severity = this.assessPropDrillingSeverity(maxDepth, averageDepth)
    const recommendation = this.getPropDrillingRecommendation(severity)

    return {
      hasPropDrilling: propChains.length > 0,
      propChains,
      maxDepth,
      averageDepth,
      severity,
      recommendation
    }
  }

  /**
   * Analyze context usage patterns
   */
  async analyzeContextUsage(widgetPath: string): Promise<ContextUsagePattern> {
    const content = await this.readFile(widgetPath)

    const contexts = this.detectContexts(content)
    const providers = this.detectProviders(content)
    const consumers = this.detectConsumers(content)

    return {
      contexts,
      providers,
      consumers,
      isProvider: providers.length > 0,
      isConsumer: consumers.length > 0,
      contextCount: contexts.length
    }
  }

  /**
   * Validate composition follows best practices
   */
  async validateComposition(widgetPath: string): Promise<{
    valid: boolean
    violations: string[]
    recommendations: string[]
  }> {
    const violations: string[] = []
    const recommendations: string[] = []

    const content = await this.readFile(widgetPath)
    const dataFlow = await this.analyzeDataFlow(widgetPath)
    const propDrilling = await this.analyzePropDrilling(widgetPath)

    // Check 1: Excessive prop drilling
    if (propDrilling.severity === 'high') {
      violations.push('Excessive prop drilling detected (depth > 3)')
      recommendations.push('Consider using Context API or state management library')
    }

    // Check 2: Mixed state management patterns
    const usesMultiplePatterns = [
      dataFlow.contextFlow.length > 0,
      dataFlow.storeFlow.length > 0,
      dataFlow.propsFlow.length > 5
    ].filter(Boolean).length > 2

    if (usesMultiplePatterns) {
      violations.push('Multiple state management patterns detected')
      recommendations.push('Standardize on a single state management approach')
    }

    // Check 3: Upward dependencies
    const hasUpwardDeps = this.detectUpwardDependencies(content)
    if (hasUpwardDeps) {
      violations.push('Widget imports from higher layers (app, pages)')
      recommendations.push('Remove upward dependencies - widgets should only import from entities, features, shared')
    }

    return {
      valid: violations.length === 0,
      violations,
      recommendations
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Detect feature composition pattern
   */
  private detectFeatureComposition(content: string): CompositionPattern | null {
    const featureImports = this.extractImports(content, '@/features/')
    
    if (featureImports.length === 0) return null

    return {
      type: 'feature-composition',
      description: 'Widget composes multiple features',
      components: featureImports,
      complexity: featureImports.length > 3 ? 'high' : featureImports.length > 1 ? 'medium' : 'low'
    }
  }

  /**
   * Detect entity composition pattern
   */
  private detectEntityComposition(content: string): CompositionPattern | null {
    const entityImports = this.extractImports(content, '@/entities/')
    
    if (entityImports.length === 0) return null

    return {
      type: 'entity-composition',
      description: 'Widget uses multiple entities',
      components: entityImports,
      complexity: entityImports.length > 3 ? 'high' : entityImports.length > 1 ? 'medium' : 'low'
    }
  }

  /**
   * Detect shared component composition pattern
   */
  private detectSharedComposition(content: string): CompositionPattern | null {
    const sharedImports = this.extractImports(content, '@/shared/')
    
    if (sharedImports.length === 0) return null

    return {
      type: 'shared-composition',
      description: 'Widget uses shared components',
      components: sharedImports,
      complexity: sharedImports.length > 5 ? 'high' : sharedImports.length > 2 ? 'medium' : 'low'
    }
  }

  /**
   * Extract imports from specific path
   */
  private extractImports(content: string, importPath: string): string[] {
    const imports = new Set<string>()
    const regex = new RegExp(`from\\s+['"]${importPath.replace(/\//g, '\\/')}([^'"]+)['"]`, 'g')
    let match

    while ((match = regex.exec(content)) !== null) {
      imports.add(match[1])
    }

    return Array.from(imports)
  }

  /**
   * Analyze props flow
   */
  private analyzePropsFlow(content: string): Array<{ prop: string; depth: number }> {
    // Simplified analysis - count prop definitions
    const propsRegex = /(\w+):\s*\w+/g
    const props: Array<{ prop: string; depth: number }> = []
    let match

    while ((match = propsRegex.exec(content)) !== null) {
      props.push({ prop: match[1], depth: 1 })
    }

    return props
  }

  /**
   * Analyze context flow
   */
  private analyzeContextFlow(content: string): Array<{ context: string; usage: string }> {
    const contexts: Array<{ context: string; usage: string }> = []
    
    // Look for useContext calls
    const contextRegex = /useContext\((\w+)\)/g
    let match

    while ((match = contextRegex.exec(content)) !== null) {
      contexts.push({ context: match[1], usage: 'consumer' })
    }

    return contexts
  }

  /**
   * Analyze store flow
   */
  private analyzeStoreFlow(content: string): Array<{ store: string; selector: string }> {
    const stores: Array<{ store: string; selector: string }> = []
    
    // Look for zustand store usage
    const storeRegex = /use(\w+)Store\(/g
    let match

    while ((match = storeRegex.exec(content)) !== null) {
      stores.push({ store: match[1], selector: 'unknown' })
    }

    return stores
  }

  /**
   * Analyze event flow
   */
  private analyzeEventFlow(content: string): Array<{ event: string; handler: string }> {
    const events: Array<{ event: string; handler: string }> = []
    
    // Look for event handlers
    const eventRegex = /on(\w+)=\{(\w+)\}/g
    let match

    while ((match = eventRegex.exec(content)) !== null) {
      events.push({ event: match[1], handler: match[2] })
    }

    return events
  }

  /**
   * Calculate data flow complexity
   */
  private calculateDataFlowComplexity(
    propsFlow: any[],
    contextFlow: any[],
    storeFlow: any[],
    eventFlow: any[]
  ): 'low' | 'medium' | 'high' {
    const totalFlows = propsFlow.length + contextFlow.length + storeFlow.length + eventFlow.length

    if (totalFlows < 5) return 'low'
    if (totalFlows < 15) return 'medium'
    return 'high'
  }

  /**
   * Detect prop chains
   */
  private detectPropChains(content: string): Array<{ prop: string; depth: number }> {
    // Simplified - in real implementation would trace prop passing through components
    return []
  }

  /**
   * Assess prop drilling severity
   */
  private assessPropDrillingSeverity(maxDepth: number, averageDepth: number): 'low' | 'medium' | 'high' {
    if (maxDepth > 3 || averageDepth > 2) return 'high'
    if (maxDepth > 2 || averageDepth > 1.5) return 'medium'
    return 'low'
  }

  /**
   * Get prop drilling recommendation
   */
  private getPropDrillingRecommendation(severity: 'low' | 'medium' | 'high'): string {
    switch (severity) {
      case 'high':
        return 'Use Context API or state management library to avoid deep prop drilling'
      case 'medium':
        return 'Consider using Context API for shared state'
      case 'low':
        return 'Current prop passing is acceptable'
    }
  }

  /**
   * Detect contexts
   */
  private detectContexts(content: string): string[] {
    const contexts = new Set<string>()
    const regex = /createContext<(\w+)>/g
    let match

    while ((match = regex.exec(content)) !== null) {
      contexts.add(match[1])
    }

    return Array.from(contexts)
  }

  /**
   * Detect providers
   */
  private detectProviders(content: string): string[] {
    const providers = new Set<string>()
    const regex = /(\w+)\.Provider/g
    let match

    while ((match = regex.exec(content)) !== null) {
      providers.add(match[1])
    }

    return Array.from(providers)
  }

  /**
   * Detect consumers
   */
  private detectConsumers(content: string): string[] {
    const consumers = new Set<string>()
    const regex = /useContext\((\w+)\)/g
    let match

    while ((match = regex.exec(content)) !== null) {
      consumers.add(match[1])
    }

    return Array.from(consumers)
  }

  /**
   * Detect upward dependencies
   */
  private detectUpwardDependencies(content: string): boolean {
    return content.includes('@/app/') || content.includes('@/pages/')
  }

  /**
   * Read file content
   */
  private async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8')
    } catch {
      return ''
    }
  }
}
