#!/usr/bin/env node

import { PerformanceAnalyzer } from '../optimization/PerformanceAnalyzer';
import { PerformanceOptimizer } from '../optimization/PerformanceOptimizer';
import { ResourceOptimizer } from '../optimization/ResourceOptimizer';

async function main() {
  console.log('🔍 Analyzing Performance...\n');

  const projectRoot = process.cwd();
  const analyzer = new PerformanceAnalyzer(projectRoot);
  const optimizer = new PerformanceOptimizer(projectRoot);
  const resourceOptimizer = new ResourceOptimizer(projectRoot);

  try {
    // Analyze render performance
    console.log('📊 Analyzing component render performance...');
    const analysis = await analyzer.analyzeRenderPerformance();

    console.log(`\n✅ Analysis Complete:`);
    console.log(`   - Expensive Components: ${analysis.expensiveComponents.length}`);
    console.log(`   - Unnecessary Re-renders: ${analysis.unnecessaryRerenders.length}`);
    console.log(`   - Heavy Computations: ${analysis.heavyComputations.length}`);
    console.log(`   - Store Optimizations: ${analysis.storeOptimizations.length}`);

    // Show expensive components
    if (analysis.expensiveComponents.length > 0) {
      console.log('\n🔴 Expensive Components:');
      analysis.expensiveComponents.slice(0, 5).forEach(comp => {
        console.log(`   - ${comp.name} (complexity: ${comp.complexity}, states: ${comp.stateCount}, effects: ${comp.effectsCount})`);
        console.log(`     ${comp.filePath}`);
      });
    }

    // Show unnecessary re-renders
    if (analysis.unnecessaryRerenders.length > 0) {
      console.log('\n⚠️  Unnecessary Re-renders:');
      analysis.unnecessaryRerenders.slice(0, 5).forEach(rerender => {
        console.log(`   - ${rerender.component} (${rerender.reason})`);
        console.log(`     ${rerender.suggestion}`);
      });
    }

    // Show heavy computations
    if (analysis.heavyComputations.length > 0) {
      console.log('\n💪 Heavy Computations:');
      analysis.heavyComputations.slice(0, 5).forEach(comp => {
        console.log(`   - Line ${comp.lineNumber} in ${comp.filePath}`);
        console.log(`     ${comp.suggestion}`);
      });
    }

    // Show store optimizations
    if (analysis.storeOptimizations.length > 0) {
      console.log('\n🏪 Store Optimizations:');
      analysis.storeOptimizations.slice(0, 5).forEach(opt => {
        console.log(`   - ${opt.storeName} (${opt.issue})`);
        console.log(`     ${opt.suggestion}`);
      });
    }

    // Identify optimization opportunities
    console.log('\n🎯 Identifying Optimization Opportunities...');
    const optimizations = await optimizer.identifyOptimizations();

    if (optimizations.length > 0) {
      console.log(`\n✅ Found ${optimizations.length} optimization opportunities:`);
      
      const byImpact = {
        high: optimizations.filter(o => o.impact === 'high'),
        medium: optimizations.filter(o => o.impact === 'medium'),
        low: optimizations.filter(o => o.impact === 'low'),
      };

      if (byImpact.high.length > 0) {
        console.log(`\n🔴 High Impact (${byImpact.high.length}):`);
        byImpact.high.slice(0, 3).forEach(opt => {
          console.log(`   - [${opt.type}] ${opt.component}`);
          console.log(`     ${opt.description}`);
        });
      }

      if (byImpact.medium.length > 0) {
        console.log(`\n🟡 Medium Impact (${byImpact.medium.length}):`);
        byImpact.medium.slice(0, 3).forEach(opt => {
          console.log(`   - [${opt.type}] ${opt.component}`);
          console.log(`     ${opt.description}`);
        });
      }

      if (byImpact.low.length > 0) {
        console.log(`\n🟢 Low Impact (${byImpact.low.length})`);
      }
    } else {
      console.log('\n✅ No optimization opportunities found!');
    }

    // Identify resource optimization candidates
    console.log('\n🎨 Analyzing Resource Optimization Opportunities...');
    
    const virtualizationCandidates = await resourceOptimizer.identifyVirtualizationCandidates();
    const lazyLoadCandidates = await resourceOptimizer.identifyLazyLoadCandidates();

    if (virtualizationCandidates.length > 0) {
      console.log(`\n📜 Virtualization Candidates (${virtualizationCandidates.length}):`);
      virtualizationCandidates.slice(0, 3).forEach(candidate => {
        console.log(`   - ${candidate.component} (${candidate.type})`);
        console.log(`     ${candidate.suggestion}`);
        console.log(`     Estimated improvement: ${candidate.estimatedImprovement}%`);
      });
    }

    if (lazyLoadCandidates.length > 0) {
      console.log(`\n🖼️  Lazy Loading Candidates (${lazyLoadCandidates.length}):`);
      lazyLoadCandidates.slice(0, 3).forEach(candidate => {
        console.log(`   - ${candidate.component} (${candidate.type})`);
        console.log(`     ${candidate.suggestion}`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Performance Analysis Summary');
    console.log('='.repeat(60));
    console.log(`Total Issues Found: ${
      analysis.expensiveComponents.length +
      analysis.unnecessaryRerenders.length +
      analysis.heavyComputations.length +
      analysis.storeOptimizations.length
    }`);
    console.log(`Optimization Opportunities: ${optimizations.length}`);
    console.log(`Virtualization Candidates: ${virtualizationCandidates.length}`);
    console.log(`Lazy Loading Candidates: ${lazyLoadCandidates.length}`);
    console.log('='.repeat(60));

    console.log('\n💡 Next Steps:');
    console.log('   1. Run: npm run optimize-performance (to implement automatic optimizations)');
    console.log('   2. Review manual optimization suggestions above');
    console.log('   3. Test performance improvements with React DevTools Profiler');

  } catch (error) {
    console.error('❌ Error analyzing performance:', error);
    process.exit(1);
  }
}

main();
