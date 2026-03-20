/**
 * Entity Template
 * Use this template to create new FSD entities
 * 
 * Usage:
 * 1. Copy this template to src/entities/{entity-name}/
 * 2. Replace {EntityName} with your entity name (PascalCase)
 * 3. Replace {entityName} with your entity name (camelCase)
 * 4. Implement the model, API, and UI components
 */

// ============================================================================
// src/entities/{entityName}/model/types.ts
// ============================================================================

export interface {EntityName} {
  id: string;
  createdAt: string;
  updatedAt: string;
  // Add your entity properties here
}

export interface Create{EntityName}Data {
  // Add creation data properties
}

export interface Update{EntityName}Data {
  // Add update data properties
}

// ============================================================================
// src/entities/{entityName}/model/validation.ts
// ============================================================================

export function validate{EntityName}(data: unknown): data is {EntityName} {
  // Implement validation logic
  return true;
}

export function validateCreate{EntityName}Data(data: unknown): data is Create{EntityName}Data {
  // Implement validation logic
  return true;
}

// ============================================================================
// src/entities/{entityName}/model/utils.ts
// ============================================================================

export function get{EntityName}DisplayName(entity: {EntityName}): string {
  // Implement display name logic
  return entity.id;
}

export function isSame{EntityName}(a: {EntityName}, b: {EntityName}): boolean {
  return a.id === b.id;
}

// ============================================================================
// src/entities/{entityName}/model/index.ts
// ============================================================================

export type { {EntityName}, Create{EntityName}Data, Update{EntityName}Data } from './types';
export { validate{EntityName}, validateCreate{EntityName}Data } from './validation';
export { get{EntityName}DisplayName, isSame{EntityName} } from './utils';

// ============================================================================
// src/entities/{entityName}/api/queries.ts
// ============================================================================

import type { {EntityName} } from '../model';

export async function get{EntityName}s(): Promise<{EntityName}[]> {
  // Implement API call
  throw new Error('Not implemented');
}

export async function get{EntityName}(id: string): Promise<{EntityName}> {
  // Implement API call
  throw new Error('Not implemented');
}

// ============================================================================
// src/entities/{entityName}/api/mutations.ts
// ============================================================================

import type { {EntityName}, Create{EntityName}Data, Update{EntityName}Data } from '../model';

export async function create{EntityName}(data: Create{EntityName}Data): Promise<{EntityName}> {
  // Implement API call
  throw new Error('Not implemented');
}

export async function update{EntityName}(id: string, data: Update{EntityName}Data): Promise<{EntityName}> {
  // Implement API call
  throw new Error('Not implemented');
}

export async function delete{EntityName}(id: string): Promise<void> {
  // Implement API call
  throw new Error('Not implemented');
}

// ============================================================================
// src/entities/{entityName}/api/index.ts
// ============================================================================

export { get{EntityName}s, get{EntityName} } from './queries';
export { create{EntityName}, update{EntityName}, delete{EntityName} } from './mutations';

// ============================================================================
// src/entities/{entityName}/ui/{EntityName}Card.tsx
// ============================================================================

import type { {EntityName} } from '../model';

export interface {EntityName}CardProps {
  entity: {EntityName};
  onClick?: (entity: {EntityName}) => void;
}

export function {EntityName}Card({ entity, onClick }: {EntityName}CardProps) {
  return (
    <div 
      className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(entity)}
    >
      <h3 className="font-semibold">{entity.id}</h3>
      {/* Add your UI components here */}
    </div>
  );
}

// ============================================================================
// src/entities/{entityName}/ui/index.ts
// ============================================================================

export { {EntityName}Card } from './{EntityName}Card';

// ============================================================================
// src/entities/{entityName}/index.ts (Public API)
// ============================================================================

/**
 * {EntityName} Entity - Public API
 * Central export point for all {entityName} entity functionality
 */

// Model exports
export type {
  {EntityName},
  Create{EntityName}Data,
  Update{EntityName}Data,
} from './model';

export {
  validate{EntityName},
  validateCreate{EntityName}Data,
  get{EntityName}DisplayName,
  isSame{EntityName},
} from './model';

// API exports
export {
  get{EntityName}s,
  get{EntityName},
  create{EntityName},
  update{EntityName},
  delete{EntityName},
} from './api';

// UI exports
export { {EntityName}Card } from './ui';
