#!/usr/bin/env tsx
/**
 * Widget Composition Pattern Analysis Script
 * 
 * Analyzes widget state management, prop patterns, and composition best practices
 * Validates widgets follow FSD composition rules
 * Generates comprehensive widget pattern analysis
 */

import * as path from 'path'
import { WidgetAnalyzer } from '../widget/WidgetAnalyzer'
import { CompositionAnalyzer } from '../widget/CompositionAnalyzer'
import { WidgetScanner } from '../widget/WidgetScanner'

interface WidgetCompositionReport {
  widgetName: string
  stateManagement: {
    type: 'local' | 'context' | 'zustand' | 'none'
    patterns: string[]
  }
  propPatterns: {
    propCount: number
    hasPropDrilling: boolean
    usesContext: boolean
    complexity: 'low' | 'medium' | 'high'
  }
  composition: {
    features: string[]
    entities: string[]
    sharedComponents: string[]
    followsBestPractices: boolean
    violations: string[]
  }
  recommendations: string[]
}

async function analyzeWidgetComposition(): Promise<void> {
  console.log('🔍 Starting Widget Composition Pattern Analysis...\n')

  const projectRoot = process.cwd()
  const widgetsPath = path.join(projectRoot, 'src', 'widgets')

  const scanner = new WidgetScanner(projectRoot)
  const analyzer = new WidgetAnalyzer(projectRoot)
  const compositionAnalyzer = new CompositionAnalyzer(projectRoot)

  // Scan for all widgets
  console.log('📂 Scanning widgets directory...')
  const widgets = await scanner.scanForWidgets()
  console.log(`Found ${widgets.length} widgets\n`)

  const reports: WidgetCompositionReport[] = []

  // Analyze each widget
  for (const widget of widgets) {
    console.log(`\n📊 Analyzing: ${widget.name}`)
    console.log('─'.repeat(50))

    try {
      // Find the main component file
      const componentPath = await findWidgetComponent(widget.path)
      
      if (!componentPath) {
        console.log(`⚠️  No component file found for ${widget.name}`)
        continue
      }

      // Analyze composition
      const composition = await analyzer.analyzeComposition(componentPath)
      const dataFlow = await compositionAnalyzer.analyzeDataFlow(componentPath)
      const propDrilling = await compositionAnalyzer.analyzePropDrilling(componentPath)
      const contextUsage = await compositionAnalyzer.analyzeContextUsage(componentPath)
      const validation = await compositionAnalyzer.validateComposition(componentPath)

      // Build report
      const report: WidgetCompositionReport = {
        widgetName: widget.name,
        stateManagement: {
          type: composition.stateManagement,
          patterns: [
            dataFlow.propsFlow.length > 0 ? 'Props flow' : '',
            dataFlow.contextFlow.length > 0 ? 'Context API' : '',
            dataFlow.storeFlow.length > 0 ? 'Zustand store' : '',
            dataFlow.eventFlow.length > 0 ? 'Event handlers' : ''
          ].filter(Boolean)
        },
        propPatterns: {
          propCount: dataFlow.propsFlow.length,
          hasPropDrilling: propDrilling.hasPropDrilling,
          usesContext: contextUsage.isConsumer,
          complexity: dataFlow.complexity
        },
        composition: {
          features: composition.features,
          entities: composition.entities,
          sharedComponents: composition.sharedComponents,
          followsBestPractices: validation.valid,
          violations: validation.violations
        },
        recommendations: validation.recommendations
      }

      reports.push(report)

      // Display analysis
      console.log(`\n📋 State Management:`)
      console.log(`   Type: ${report.stateManagement.type}`)
      console.log(`   Patterns: ${report.stateManagement.patterns.join(', ') || 'None'}`)

      console.log(`\n🔧 Prop Patterns:`)
      console.log(`   Prop count: ${report.propPatterns.propCount}`)
      console.log(`   Prop drilling: ${report.propPatterns.hasPropDrilling ? 'Yes' : 'No'}`)
      console.log(`   Uses context: ${report.propPatterns.usesContext ? 'Yes' : 'No'}`)
      console.log(`   Complexity: ${report.propPatterns.complexity}`)

      console.log(`\n🏗️  Composition:`)
      console.log(`   Features: ${report.composition.features.length > 0 ? report.composition.features.join(', ') : 'None'}`)
      console.log(`   Entities: ${report.composition.entities.length > 0 ? report.composition.entities.join(', ') : 'None'}`)
      console.log(`   Shared: ${report.composition.sharedComponents.length > 0 ? report.composition.sharedComponents.join(', ') : 'None'}`)
      console.log(`   Best practices: ${report.composition.followsBestPractices ? '✅' : '❌'}`)

      if (report.composition.violations.length > 0) {
        console.log(`\n⚠️  Violations:`)
        report.composition.violations.forEach(v => console.log(`   - ${v}`))
      }

      if (report.recommendations.length > 0) {
        console.log(`\n💡 Recommendations:`)
        report.recommendations.forEach(r => console.log(`   - ${r}`))
      }

    } catch (error) {
      console.error(`❌ Error analyzing ${widget.name}:`, error)
    }
  }

  // Generate summary
  console.log('\n\n' + '='.repeat(70))
  console.log('📊 WIDGET COMPOSITION ANALYSIS SUMMARY')
  console.log('='.repeat(70))

  console.log(`\n📈 Overall Statistics:`)
  console.log(`   Total widgets analyzed: ${reports.length}`)
  console.log(`   Following best practices: ${reports.filter(r => r.composition.followsBestPractices).length}`)
  console.log(`   Need improvements: ${reports.filter(r => !r.composition.followsBestPractices).length}`)

  console.log(`\n🔧 State Management Patterns:`)
  const stateTypes = reports.reduce((acc, r) => {
    acc[r.stateManagement.type] = (acc[r.stateManagement.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  Object.entries(stateTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`)
  })

  console.log(`\n📊 Prop Pattern Analysis:`)
  console.log(`   Widgets with prop drilling: ${reports.filter(r => r.propPatterns.hasPropDrilling).length}`)
  console.log(`   Widgets using context: ${reports.filter(r => r.propPatterns.usesContext).length}`)
  console.log(`   Average prop count: ${(reports.reduce((sum, r) => sum + r.propPatterns.propCount, 0) / reports.length).toFixed(1)}`)

  console.log(`\n🏗️  Composition Patterns:`)
  console.log(`   Widgets using features: ${reports.filter(r => r.composition.features.length > 0).length}`)
  console.log(`   Widgets using entities: ${reports.filter(r => r.composition.entities.length > 0).length}`)
  console.log(`   Widgets using shared: ${reports.filter(r => r.composition.sharedComponents.length > 0).length}`)

  console.log('\n✅ Widget composition pattern analysis complete!')
}

async function findWidgetComponent(widgetPath: string): Promise<string | null> {
  const fs = await import('fs/promises')
  const uiPath = path.join(widgetPath, 'ui')
  
  try {
    const files = await fs.readdir(uiPath)
    const tsxFile = files.find(f => f.endsWith('.tsx'))
    return tsxFile ? path.join(uiPath, tsxFile) : null
  } catch {
    return null
  }
}

// Run analysis
analyzeWidgetComposition().catch(console.error)
