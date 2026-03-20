#!/usr/bin/env node

import { BundleOptimizer } from '../optimization/BundleOptimizer.js';

async function main() {
  console.log('⚡ Optimizing bundle...\n');

  const optimizer = new BundleOptimizer();

  try {
    // Get baseline
    console.log('📊 Analyzing current bundle...');
    const beforeAnalysis = await optimizer.analyzeAndIdentifyOptimizations();
    console.log(`Current bundle size: ${optimizer.formatSize(beforeAnalysis.bundleAnalysis.totalSize)}\n`);

    // Implement code splitting
    console.log('🔀 Implementing code splitting...');
    const codeSplittingResult = await optimizer.implementCodeSplitting();
    
    if (codeSplittingResult.routesUpdated.length > 0) {
      console.log(`✅ Updated ${codeSplittingResult.routesUpdated.length} route files:`);
      for (const route of codeSplittingResult.routesUpdated) {
        console.log(`   - ${route}`);
      }
    } else {
      console.log('ℹ️  No routes needed updating (already optimized)');
    }

    if (codeSplittingResult.modulesLazyLoaded.length > 0) {
      console.log(`✅ Lazy loaded ${codeSplittingResult.modulesLazyLoaded.length} feature modules:`);
      for (const module of codeSplittingResult.modulesLazyLoaded) {
        console.log(`   - ${module}`);
      }
    }

    console.log(`💰 Estimated savings from code splitting: ${optimizer.formatSize(codeSplittingResult.estimatedSavings)}\n`);

    // Tree shaking optimization
    console.log('🌳 Analyzing tree shaking opportunities...');
    const treeShakingResult = await optimizer.optimizeTreeShaking();
    console.log(`💡 Found ${treeShakingResult.fixed} fixable tree shaking issues`);
    console.log(`💰 Potential savings: ${optimizer.formatSize(treeShakingResult.estimatedSavings)}\n`);

    // Summary
    console.log('📈 Optimization Summary:');
    console.log('─'.repeat(60));
    console.log(`Routes optimized: ${codeSplittingResult.routesUpdated.length}`);
    console.log(`Modules lazy loaded: ${codeSplittingResult.modulesLazyLoaded.length}`);
    console.log(`Total estimated savings: ${optimizer.formatSize(codeSplittingResult.estimatedSavings + treeShakingResult.estimatedSavings)}`);
    console.log();
    console.log('✅ Optimization complete!');
    console.log('💡 Run "npm run build" to see actual bundle size improvements');
    console.log('💡 Run "npm run analyze-bundle" to verify optimizations');

  } catch (error) {
    console.error('❌ Error optimizing bundle:', error);
    process.exit(1);
  }
}

main();
