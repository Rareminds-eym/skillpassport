#!/usr/bin/env node

import { BundleOptimizer } from '../optimization/BundleOptimizer.js';

async function main() {
  console.log('🔍 Analyzing bundle and identifying optimization opportunities...\n');

  const optimizer = new BundleOptimizer();

  try {
    // Analyze and identify optimizations
    const result = await optimizer.analyzeAndIdentifyOptimizations();

    console.log('📊 Bundle Analysis Results:');
    console.log('─'.repeat(60));
    console.log(`Total Bundle Size: ${optimizer.formatSize(result.bundleAnalysis.totalSize)}`);
    console.log(`Number of Chunks: ${result.bundleAnalysis.baseline.chunkCount}`);
    console.log(`Largest Chunk: ${result.bundleAnalysis.baseline.largestChunk.name} (${optimizer.formatSize(result.bundleAnalysis.baseline.largestChunk.size)})`);
    console.log();

    // Display chunk sizes
    console.log('📦 Chunk Sizes:');
    const sortedChunks = Object.entries(result.bundleAnalysis.chunkSizes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 chunks

    for (const [name, size] of sortedChunks) {
      console.log(`  ${name}: ${optimizer.formatSize(size)}`);
    }
    console.log();

    // Display large dependencies
    if (result.dependencyOptimizations.length > 0) {
      console.log('📚 Large Dependencies:');
      for (const opt of result.dependencyOptimizations) {
        console.log(`  ${opt.dependency}: ${optimizer.formatSize(opt.currentSize)}`);
        console.log(`    💡 ${opt.suggestion}`);
        if (opt.alternative) {
          console.log(`    ✨ Alternative: ${opt.alternative}`);
        }
        console.log(`    💰 Estimated savings: ${optimizer.formatSize(opt.estimatedSavings)}`);
        console.log();
      }
    }

    // Display tree shaking opportunities
    if (result.treeShakingOpportunities.length > 0) {
      console.log(`🌳 Tree Shaking Opportunities: ${result.treeShakingOpportunities.length} found`);
      
      // Group by type
      const byType: Record<string, number> = {};
      for (const opp of result.treeShakingOpportunities) {
        const type = opp.issue.split(':')[0];
        byType[type] = (byType[type] || 0) + 1;
      }

      for (const [type, count] of Object.entries(byType)) {
        console.log(`  ${type}: ${count} occurrences`);
      }
      console.log();
    }

    // Display prioritized optimization opportunities
    console.log('🎯 Prioritized Optimization Opportunities:');
    const opportunities = await optimizer.identifyOptimizations();
    
    for (let i = 0; i < Math.min(5, opportunities.length); i++) {
      const opp = opportunities[i];
      const impactEmoji = opp.impact === 'high' ? '🔴' : opp.impact === 'medium' ? '🟡' : '🟢';
      console.log(`  ${impactEmoji} ${opp.description}`);
      console.log(`     Type: ${opp.type}`);
      console.log(`     Impact: ${opp.impact}`);
      console.log(`     Complexity: ${opp.implementationComplexity}`);
      console.log(`     Estimated savings: ${optimizer.formatSize(opp.estimatedSavings)}`);
      console.log();
    }

    // Summary
    console.log('📈 Summary:');
    console.log('─'.repeat(60));
    console.log(`Total Estimated Savings: ${optimizer.formatSize(result.totalEstimatedSavings)}`);
    console.log(`Optimization Opportunities: ${opportunities.length}`);
    console.log();
    console.log('✅ Analysis complete!');
    console.log('💡 Run "npm run optimize-bundle" to apply optimizations');

  } catch (error) {
    console.error('❌ Error analyzing bundle:', error);
    process.exit(1);
  }
}

main();
