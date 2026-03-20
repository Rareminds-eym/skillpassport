#!/usr/bin/env node

import { PerformanceOptimizer } from '../optimization/PerformanceOptimizer';
import { ResourceOptimizer } from '../optimization/ResourceOptimizer';
import * as readline from 'readline';

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(`${question} (y/n): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  console.log('⚡ Performance Optimizer\n');

  const projectRoot = process.cwd();
  const optimizer = new PerformanceOptimizer(projectRoot);
  const resourceOptimizer = new ResourceOptimizer(projectRoot);

  try {
    // Identify optimizations
    console.log('🔍 Identifying optimization opportunities...');
    const optimizations = await optimizer.identifyOptimizations();

    if (optimizations.length === 0) {
      console.log('✅ No optimization opportunities found!');
      return;
    }

    console.log(`\n✅ Found ${optimizations.length} optimization opportunities\n`);

    // Show what will be optimized
    const autoOptimizations = optimizations.filter(o => o.type === 'memo');
    const manualOptimizations = optimizations.filter(o => o.type !== 'memo');

    if (autoOptimizations.length > 0) {
      console.log(`🤖 Automatic Optimizations (${autoOptimizations.length}):`);
      autoOptimizations.forEach(opt => {
        console.log(`   - [${opt.type}] ${opt.component}`);
        console.log(`     ${opt.description}`);
      });
    }

    if (manualOptimizations.length > 0) {
      console.log(`\n👤 Manual Optimizations Required (${manualOptimizations.length}):`);
      manualOptimizations.forEach(opt => {
        console.log(`   - [${opt.type}] ${opt.component}`);
        console.log(`     ${opt.description}`);
      });
    }

    // Confirm before proceeding
    if (autoOptimizations.length > 0) {
      console.log('\n⚠️  This will modify your source files.');
      const proceed = await confirm('Do you want to proceed with automatic optimizations?');

      if (!proceed) {
        console.log('❌ Optimization cancelled.');
        return;
      }

      // Implement optimizations
      console.log('\n🔧 Implementing optimizations...');
      const result = await optimizer.implementOptimizations(autoOptimizations);

      console.log(`\n✅ Optimization Complete:`);
      console.log(`   - Files Modified: ${result.filesModified.length}`);
      console.log(`   - Optimizations Applied: ${result.optimizations.length}`);
      console.log(`   - Warnings: ${result.warnings.length}`);
      console.log(`   - Errors: ${result.errors.length}`);

      if (result.filesModified.length > 0) {
        console.log('\n📝 Modified Files:');
        result.filesModified.forEach(file => {
          console.log(`   - ${file}`);
        });
      }

      if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => {
          console.log(`   - ${warning}`);
        });
      }

      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
      }
    }

    // Resource optimizations
    console.log('\n🎨 Checking resource optimization opportunities...');
    const lazyLoadCandidates = await resourceOptimizer.identifyLazyLoadCandidates();
    const imageCandidates = lazyLoadCandidates.filter(c => c.type === 'image');

    if (imageCandidates.length > 0) {
      console.log(`\n🖼️  Found ${imageCandidates.length} images without lazy loading`);
      const proceedLazy = await confirm('Do you want to add lazy loading to images?');

      if (proceedLazy) {
        console.log('\n🔧 Adding lazy loading to images...');
        const lazyResult = await resourceOptimizer.implementLazyLoading(imageCandidates);

        console.log(`\n✅ Lazy Loading Complete:`);
        console.log(`   - Files Modified: ${lazyResult.filesModified.length}`);
        console.log(`   - Images Optimized: ${lazyResult.lazyLoadingImplemented.length}`);

        if (lazyResult.filesModified.length > 0) {
          console.log('\n📝 Modified Files:');
          lazyResult.filesModified.forEach(file => {
            console.log(`   - ${file}`);
          });
        }
      }
    }

    // Measure improvements
    console.log('\n📊 Measuring performance improvements...');
    const metrics = await optimizer.measureImprovements();

    console.log('\n📈 Estimated Performance Improvements:');
    console.log(`   - Render Time Reduction: ${metrics.improvement.renderTimeReduction.toFixed(1)}%`);
    console.log(`   - Re-render Reduction: ${metrics.improvement.rerenderReduction.toFixed(1)}%`);

    console.log('\n💡 Next Steps:');
    console.log('   1. Run your test suite to ensure nothing broke');
    console.log('   2. Use React DevTools Profiler to measure actual improvements');
    console.log('   3. Review manual optimization suggestions from analyze-performance');
    console.log('   4. Consider implementing virtualization for large lists/tables');

  } catch (error) {
    console.error('❌ Error optimizing performance:', error);
    process.exit(1);
  }
}

main();
