/**
 * Consolidation Strategy System
 * Determines canonical locations based on FSD rules
 */

import * as path from 'path';
import type { DuplicateGroup, FSDLayerRules } from '@/features/student-profile/model';

export class ConsolidationStrategy {
  private fsdRules: FSDLayerRules = {
    preferredLocations: {
      // Validation patterns
      'isValid.*': 'shared/lib/validation',
      'validate.*': 'shared/lib/validation',
      
      // Display/formatting utilities
      'format.*': 'shared/lib/format',
      'get.*DisplayName': 'shared/lib/format',
      'get.*Label': 'shared/lib/format',
      
      // Filtering utilities
      'filter.*': 'shared/lib/filters',
      'search.*': 'shared/lib/search',
      
      // Sorting utilities
      'sort.*': 'shared/lib/sorting',
      
      // Comparison utilities
      'isSame.*': 'shared/lib/comparison',
      'compare.*': 'shared/lib/comparison',
      
      // Calculation utilities
      'calculate.*': 'shared/lib/calculations',
      
      // Entity-specific logic stays in entity
      'entity-specific': 'entities/{entity}/model',
    },
    layerHierarchy: ['shared', 'entities', 'features', 'widgets', 'pages', 'app'],
  };

  /**
   * Determine canonical location for duplicate group
   */
  determineCanonicalLocation(group: DuplicateGroup): string {
    const files = group.files;
    
    // Extract function name from first code block
    const functionName = this.extractFunctionName(group.codeBlocks[0].code);
    
    // Check if it matches a pattern for shared utilities
    const sharedLocation = this.matchSharedPattern(functionName);
    if (sharedLocation) {
      return sharedLocation;
    }

    // If all files are in the same entity, keep it there
    const entities = this.extractEntities(files);
    if (entities.size === 1) {
      const entity = Array.from(entities)[0];
      return `src/entities/${entity}/model/utils.ts`;
    }

    // If files span multiple entities, move to shared
    if (entities.size > 1) {
      return this.determineSharedLocation(functionName);
    }

    // Default: use the file in the lowest layer
    return this.selectLowestLayer(files);
  }

  /**
   * Extract function name from code
   */
  private extractFunctionName(code: string): string {
    const match = code.match(/(?:export\s+)?(?:const|function)\s+(\w+)/);
    return match ? match[1] : '';
  }

  /**
   * Match function name against shared patterns
   */
  private matchSharedPattern(functionName: string): string | null {
    for (const [pattern, location] of Object.entries(this.fsdRules.preferredLocations)) {
      if (pattern === 'entity-specific') continue;
      
      const regex = new RegExp(pattern.replace('.*', '.*'));
      if (regex.test(functionName)) {
        return `src/${location}.ts`;
      }
    }
    return null;
  }

  /**
   * Extract entity names from file paths
   */
  private extractEntities(files: string[]): Set<string> {
    const entities = new Set<string>();
    
    for (const file of files) {
      const match = file.match(/entities\/([^\/]+)\//);
      if (match) {
        entities.add(match[1]);
      }
    }
    
    return entities;
  }

  /**
   * Determine shared location based on function name
   */
  private determineSharedLocation(functionName: string): string {
    if (functionName.startsWith('isValid') || functionName.startsWith('validate')) {
      return 'src/shared/lib/validation/common.ts';
    }
    
    if (functionName.startsWith('format') || functionName.includes('DisplayName') || functionName.includes('Label')) {
      return 'src/shared/lib/format/display.ts';
    }
    
    if (functionName.startsWith('filter') || functionName.startsWith('search')) {
      return 'src/shared/lib/filters/common.ts';
    }
    
    if (functionName.startsWith('sort')) {
      return 'src/shared/lib/sorting/common.ts';
    }
    
    if (functionName.startsWith('isSame') || functionName.startsWith('compare')) {
      return 'src/shared/lib/comparison/common.ts';
    }
    
    if (functionName.startsWith('calculate')) {
      return 'src/shared/lib/calculations/common.ts';
    }
    
    return 'src/shared/lib/utils/common.ts';
  }

  /**
   * Select file in lowest FSD layer
   */
  private selectLowestLayer(files: string[]): string {
    const layerMap = new Map<string, string[]>();
    
    for (const file of files) {
      const layer = this.extractLayer(file);
      if (!layerMap.has(layer)) {
        layerMap.set(layer, []);
      }
      layerMap.get(layer)!.push(file);
    }

    // Find lowest layer with files
    for (const layer of this.fsdRules.layerHierarchy) {
      if (layerMap.has(layer)) {
        return layerMap.get(layer)![0];
      }
    }

    return files[0];
  }

  /**
   * Extract FSD layer from file path
   */
  private extractLayer(file: string): string {
    for (const layer of this.fsdRules.layerHierarchy) {
      if (file.includes(`/${layer}/`)) {
        return layer;
      }
    }
    return 'unknown';
  }

  /**
   * Determine consolidation strategy
   */
  determineStrategy(group: DuplicateGroup): 'merge' | 'replace' | 'extract' {
    // If similarity is very high (>95%), use replace
    if (group.similarity > 0.95) {
      return 'replace';
    }

    // If files are in different layers, extract to shared
    const layers = new Set(group.files.map(f => this.extractLayer(f)));
    if (layers.size > 1) {
      return 'extract';
    }

    // Default to merge
    return 'merge';
  }

  /**
   * Check if location is in shared layer
   */
  isSharedLocation(location: string): boolean {
    return location.includes('/shared/');
  }

  /**
   * Generate import path for canonical location
   */
  generateImportPath(canonicalLocation: string, fromFile: string): string {
    // Convert file path to import path
    const relativePath = path.relative(path.dirname(fromFile), canonicalLocation);
    
    // Remove .ts extension
    const withoutExt = relativePath.replace(/\.ts$/, '');
    
    // Convert to import format
    if (withoutExt.startsWith('..')) {
      return withoutExt;
    }
    
    return `./${withoutExt}`;
  }
}
