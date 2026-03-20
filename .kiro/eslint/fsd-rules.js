/**
 * ESLint Rules for Feature-Sliced Design (FSD) Compliance
 * 
 * Add to eslint.config.js:
 * 
 * import fsdRules from './.kiro/eslint/fsd-rules.js';
 * 
 * export default tseslint.config(
 *   // ... other config
 *   fsdRules
 * );
 */

const FSD_LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
const LAYER_HIERARCHY = {
  'app': 6,
  'pages': 5,
  'widgets': 4,
  'features': 3,
  'entities': 2,
  'shared': 1,
};

/**
 * Extract layer and slice from import path
 * @param {string} importPath - The import path to analyze
 * @returns {{layer: string, slice: string} | null}
 */
function parseImportPath(importPath) {
  // Handle absolute imports with @ alias
  const match = importPath.match(/^@\/(app|pages|widgets|features|entities|shared)\/([^/]+)/);
  if (match) {
    return { layer: match[1], slice: match[2] };
  }
  
  // Handle relative imports
  const relativeMatch = importPath.match(/^\.\.\/(app|pages|widgets|features|entities|shared)\/([^/]+)/);
  if (relativeMatch) {
    return { layer: relativeMatch[1], slice: relativeMatch[2] };
  }
  
  return null;
}

/**
 * Get the current file's layer and slice
 * @param {string} filename - The current file path
 * @returns {{layer: string, slice: string} | null}
 */
function getCurrentLayerSlice(filename) {
  const match = filename.match(/src\/(app|pages|widgets|features|entities|shared)\/([^/]+)/);
  if (match) {
    return { layer: match[1], slice: match[2] };
  }
  return null;
}

/**
 * Check if an import violates FSD layer hierarchy
 * Lower layers cannot import from higher layers
 */
const noUpwardImports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent upward imports in FSD layer hierarchy',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      upwardImport: 'Layer "{{fromLayer}}" cannot import from higher layer "{{toLayer}}". FSD hierarchy: shared < entities < features < widgets < pages < app',
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const filename = context.getFilename();
        const importPath = node.source.value;
        
        const currentLayerSlice = getCurrentLayerSlice(filename);
        const importLayerSlice = parseImportPath(importPath);
        
        if (!currentLayerSlice || !importLayerSlice) return;
        
        const currentLevel = LAYER_HIERARCHY[currentLayerSlice.layer];
        const importLevel = LAYER_HIERARCHY[importLayerSlice.layer];
        
        if (currentLevel < importLevel) {
          context.report({
            node,
            messageId: 'upwardImport',
            data: {
              fromLayer: currentLayerSlice.layer,
              toLayer: importLayerSlice.layer,
            },
          });
        }
      },
    };
  },
};

/**
 * Enforce public API imports (through index.ts)
 * Prevent deep imports into internal structure
 */
const usePublicApi = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce imports through public API (index.ts)',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      deepImport: 'Import from public API instead: use "@/{{layer}}/{{slice}}" instead of deep import into "{{subpath}}"',
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const filename = context.getFilename();
        const importPath = node.source.value;
        
        const currentLayerSlice = getCurrentLayerSlice(filename);
        if (!currentLayerSlice) return;
        
        // Check for deep imports (imports that go beyond the slice level)
        const deepImportMatch = importPath.match(/^@\/(app|pages|widgets|features|entities|shared)\/([^/]+)\/(.+)/);
        if (deepImportMatch) {
          const [, layer, slice, subpath] = deepImportMatch;
          
          // Allow imports within the same slice
          if (currentLayerSlice.layer === layer && currentLayerSlice.slice === slice) {
            return;
          }
          
          // Report deep import
          context.report({
            node,
            messageId: 'deepImport',
            data: { layer, slice, subpath },
          });
        }
      },
    };
  },
};

/**
 * Prevent cross-slice imports within the same layer
 * Slices should be independent
 */
const noCrossSliceImports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent cross-slice imports within the same layer',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      crossSliceImport: 'Cannot import from slice "{{toSlice}}" within the same "{{layer}}" layer. Slices should be independent. Consider moving shared code to the shared layer.',
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const filename = context.getFilename();
        const importPath = node.source.value;
        
        const currentLayerSlice = getCurrentLayerSlice(filename);
        const importLayerSlice = parseImportPath(importPath);
        
        if (!currentLayerSlice || !importLayerSlice) return;
        
        // Check if importing from different slice in same layer
        if (
          currentLayerSlice.layer === importLayerSlice.layer &&
          currentLayerSlice.slice !== importLayerSlice.slice &&
          currentLayerSlice.layer !== 'shared' // shared layer can have cross-slice imports
        ) {
          context.report({
            node,
            messageId: 'crossSliceImport',
            data: {
              layer: currentLayerSlice.layer,
              toSlice: importLayerSlice.slice,
            },
          });
        }
      },
    };
  },
};

/**
 * Enforce absolute imports with @ alias
 */
const useAbsoluteImports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce absolute imports using @ alias for FSD layers',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      relativeImport: 'Use absolute import with @ alias: "@/{{layer}}/{{slice}}" instead of relative path',
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        
        // Check for relative imports that cross into FSD layers
        const relativeMatch = importPath.match(/^\.\.\/(app|pages|widgets|features|entities|shared)\/([^/]+)/);
        if (relativeMatch) {
          const [, layer, slice] = relativeMatch;
          context.report({
            node,
            messageId: 'relativeImport',
            data: { layer, slice },
          });
        }
      },
    };
  },
};

// Export the rules as an ESLint config
export default {
  plugins: {
    'fsd': {
      rules: {
        'no-upward-imports': noUpwardImports,
        'use-public-api': usePublicApi,
        'no-cross-slice-imports': noCrossSliceImports,
        'use-absolute-imports': useAbsoluteImports,
      },
    },
  },
  rules: {
    'fsd/no-upward-imports': 'error',
    'fsd/use-public-api': 'warn',
    'fsd/no-cross-slice-imports': 'error',
    'fsd/use-absolute-imports': 'warn',
  },
};
