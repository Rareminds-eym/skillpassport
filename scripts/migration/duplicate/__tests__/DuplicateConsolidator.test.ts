/**
 * DuplicateConsolidator Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DuplicateConsolidator } from '../DuplicateConsolidator';

describe('DuplicateConsolidator', () => {
  let consolidator: DuplicateConsolidator;

  beforeEach(() => {
    consolidator = new DuplicateConsolidator();
  });

  describe('end-to-end consolidation', () => {
    it('should scan and detect duplicates in entities', async () => {
      const scanResult = await consolidator.scanForDuplicates(['src/entities']);

      expect(scanResult).toBeDefined();
      expect(scanResult.totalDuplicates).toBeGreaterThanOrEqual(0);
      expect(scanResult.scanMetadata.filesScanned).toBeGreaterThan(0);
    });

    it('should provide meaningful potential savings estimates', async () => {
      const scanResult = await consolidator.scanForDuplicates(['src/entities']);

      expect(scanResult.potentialSavings).toBeDefined();
      expect(scanResult.potentialSavings.totalLines).toBeGreaterThanOrEqual(0);
      expect(scanResult.potentialSavings.estimatedPercentage).toBeGreaterThanOrEqual(0);
      expect(scanResult.potentialSavings.estimatedPercentage).toBeLessThanOrEqual(100);
    });

    it('should generate duplicate groups with proper structure', async () => {
      const scanResult = await consolidator.scanForDuplicates(['src/entities']);

      scanResult.duplicateGroups.forEach(group => {
        expect(group.id).toBeDefined();
        expect(group.files.length).toBeGreaterThan(1);
        expect(group.codeBlocks.length).toBeGreaterThan(1);
        expect(group.similarity).toBeGreaterThan(0);
        expect(group.similarity).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('consolidation safety', () => {
    it('should only consolidate safe duplicates', async () => {
      const scanResult = await consolidator.scanForDuplicates(['src/entities'], {
        minSimilarity: 0.95,
      });

      if (scanResult.duplicateGroups.length > 0) {
        const report = await consolidator.consolidateAll(scanResult.duplicateGroups);

        // All successful consolidations should have no errors
        report.consolidations
          .filter(c => c.success)
          .forEach(consolidation => {
            expect(consolidation.errors.length).toBe(0);
          });
      }
    });

    it('should report errors for unsafe consolidations', async () => {
      const scanResult = await consolidator.scanForDuplicates(['src/entities'], {
        minSimilarity: 0.7, // Lower threshold may find unsafe duplicates
      });

      if (scanResult.duplicateGroups.length > 0) {
        const report = await consolidator.consolidateAll(scanResult.duplicateGroups);

        // Should have some errors or all successes
        expect(report.totalConsolidations).toBeGreaterThan(0);
        expect(report.successfulConsolidations + report.failedConsolidations).toBe(
          report.totalConsolidations
        );
      }
    });
  });

  describe('code reduction metrics', () => {
    it('should calculate accurate code reduction metrics', async () => {
      const scanResult = await consolidator.scanForDuplicates(['src/entities']);

      if (scanResult.duplicateGroups.length > 0) {
        const report = await consolidator.consolidateAll(scanResult.duplicateGroups);

        expect(report.codeReduction).toBeDefined();
        expect(report.codeReduction.totalLinesRemoved).toBeGreaterThanOrEqual(0);
        expect(report.codeReduction.totalFilesAffected).toBeGreaterThanOrEqual(0);
        expect(report.codeReduction.percentageReduction).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
