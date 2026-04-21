/**
 * Widget Template
 * Use this template to create new FSD widgets
 * 
 * Usage:
 * 1. Copy this template to src/widgets/{widget-name}/
 * 2. Replace {WidgetName} with your widget name (PascalCase)
 * 3. Replace {widgetName} with your widget name (camelCase)
 * 4. Implement the UI and model components
 * 
 * Note: Widgets should only import from entities, features, and shared layers
 */

// ============================================================================
// src/widgets/{widgetName}/model/types.ts
// ============================================================================

export interface {WidgetName}Props {
  // Add widget props here
  className?: string;
}

export interface {WidgetName}State {
  // Add widget state properties here
  isLoading: boolean;
}

// ============================================================================
// src/widgets/{widgetName}/model/store.ts (Optional - only if widget needs state)
// ============================================================================

import { create } from 'zustand';
import type { {WidgetName}State } from './types';

interface {WidgetName}Store extends {WidgetName}State {
  // Add actions
  setLoading: (isLoading: boolean) => void;
}

export const use{WidgetName}Store = create<{WidgetName}Store>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

// ============================================================================
// src/widgets/{widgetName}/model/index.ts
// ============================================================================

export type { {WidgetName}Props, {WidgetName}State } from './types';
// Export store only if needed
// export { use{WidgetName}Store } from './store';

// ============================================================================
// src/widgets/{widgetName}/ui/{WidgetName}.tsx
// ============================================================================

import type { {WidgetName}Props } from '../model';

/**
 * {WidgetName} Widget
 * 
 * Complex composite UI component that combines multiple features/entities
 * 
 * Dependencies:
 * - Entities: (list entities used)
 * - Features: (list features used)
 * - Shared: (list shared components used)
 */
export function {WidgetName}({ className }: {WidgetName}Props) {
  return (
    <div className={className}>
      <h2>{WidgetName}</h2>
      {/* Compose features and entities here */}
    </div>
  );
}

// ============================================================================
// src/widgets/{widgetName}/ui/index.ts
// ============================================================================

export { {WidgetName} } from './{WidgetName}';

// ============================================================================
// src/widgets/{widgetName}/index.ts (Public API)
// ============================================================================

/**
 * {WidgetName} Widget - Public API
 * 
 * Complex widget that composes multiple features and entities
 */

export { {WidgetName} } from './ui/{WidgetName}';
export type { {WidgetName}Props } from './model/types';
