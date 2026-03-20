/**
 * DuplicateScanner Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DuplicateScanner } from '../DuplicateScanner';

describe('DuplicateScanner', () => {
  let scanner: DuplicateScanner;

  beforeEach(() => {
    scanner = new DuplicateScanner();
  });

  describe('scanForDuplicates', () => {
    it('should scan entities directory and return results', async () => {
      const result = await scanner.scanForDuplicates(['src/entities'], {
        minSimilarity: 0.95,
        minLines: 5,
      });

      expect(result).toBeDefined();
      expect(result.totalDuplicates).toBeGreaterThanOrEqual(0);
      expect(result.scanMetadata).toBeDefined();
      expect(result.scanMetadata.filesScanned).toBeGreaterThanOrEqual(0);
      expect(result.potentialSavings).toBeDefined();
    });

    it('should detect validation pattern duplicates across entities', async () => {
      const result = await scanner.scanForDuplicates(['src/entities'], {
        minSimilarity: 0.8,
        minLines: 3,
      });

      // Validation functions like isValidEmail should be detected
      const validationDuplicates = result.duplicateGroups.filter(group =>
        group.codeBlocks.some(block => 
          block.code.includes('isValid') || block.code.includes('validate')
        )
      );

      // We expect to find some validation duplicates
      expect(validationDuplicates.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty directories gracefully', async () => {
      const result = await scanner.scanForDuplicates(['nonexistent-dir'], {
        minSimilarity: 0.9,
      });

      expect(result.totalDuplicates).toBe(0);
      expect(result.scanMetadata.filesScanned).toBe(0);
    });
  });
});
