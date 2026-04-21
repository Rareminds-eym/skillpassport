#!/bin/bash

# Create Entity Script
# Usage: bash .kiro/scripts/create-entity.sh <entity-name>
# Example: bash .kiro/scripts/create-entity.sh product

set -e

if [ -z "$1" ]; then
  echo "Error: Entity name is required"
  echo "Usage: bash .kiro/scripts/create-entity.sh <entity-name>"
  echo "Example: bash .kiro/scripts/create-entity.sh product"
  exit 1
fi

ENTITY_NAME_KEBAB=$1
ENTITY_NAME_PASCAL=$(echo "$ENTITY_NAME_KEBAB" | sed -r 's/(^|-)([a-z])/\U\2/g')
ENTITY_NAME_CAMEL=$(echo "$ENTITY_NAME_PASCAL" | sed 's/^./\l&/')

ENTITY_DIR="src/entities/$ENTITY_NAME_KEBAB"

echo "Creating entity: $ENTITY_NAME_PASCAL"
echo "Directory: $ENTITY_DIR"

# Check if entity already exists
if [ -d "$ENTITY_DIR" ]; then
  echo "Error: Entity '$ENTITY_NAME_KEBAB' already exists at $ENTITY_DIR"
  exit 1
fi

# Create directory structure
mkdir -p "$ENTITY_DIR/model"
mkdir -p "$ENTITY_DIR/api"
mkdir -p "$ENTITY_DIR/ui"

# Create model/types.ts
cat > "$ENTITY_DIR/model/types.ts" << EOF
export interface $ENTITY_NAME_PASCAL {
  id: string;
  createdAt: string;
  updatedAt: string;
  // Add your entity properties here
}

export interface Create${ENTITY_NAME_PASCAL}Data {
  // Add creation data properties
}

export interface Update${ENTITY_NAME_PASCAL}Data {
  // Add update data properties
}
EOF

# Create model/validation.ts
cat > "$ENTITY_DIR/model/validation.ts" << EOF
import type { $ENTITY_NAME_PASCAL, Create${ENTITY_NAME_PASCAL}Data } from './types';

export function validate$ENTITY_NAME_PASCAL(data: unknown): data is $ENTITY_NAME_PASCAL {
  if (!data || typeof data !== 'object') return false;
  const entity = data as Record<string, unknown>;
  return (
    typeof entity.id === 'string' &&
    typeof entity.createdAt === 'string' &&
    typeof entity.updatedAt === 'string'
  );
}

export function validateCreate${ENTITY_NAME_PASCAL}Data(data: unknown): data is Create${ENTITY_NAME_PASCAL}Data {
  if (!data || typeof data !== 'object') return false;
  // Add validation logic
  return true;
}
EOF

# Create model/utils.ts
cat > "$ENTITY_DIR/model/utils.ts" << EOF
import type { $ENTITY_NAME_PASCAL } from './types';

export function get${ENTITY_NAME_PASCAL}DisplayName(entity: $ENTITY_NAME_PASCAL): string {
  return entity.id;
}

export function isSame$ENTITY_NAME_PASCAL(a: $ENTITY_NAME_PASCAL, b: $ENTITY_NAME_PASCAL): boolean {
  return a.id === b.id;
}

export function filter${ENTITY_NAME_PASCAL}sById(entities: $ENTITY_NAME_PASCAL[], ids: string[]): $ENTITY_NAME_PASCAL[] {
  return entities.filter(entity => ids.includes(entity.id));
}

export function sort${ENTITY_NAME_PASCAL}sByCreatedAt(entities: $ENTITY_NAME_PASCAL[]): $ENTITY_NAME_PASCAL[] {
  return [...entities].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
EOF

# Create model/index.ts
cat > "$ENTITY_DIR/model/index.ts" << EOF
export type { $ENTITY_NAME_PASCAL, Create${ENTITY_NAME_PASCAL}Data, Update${ENTITY_NAME_PASCAL}Data } from './types';
export { validate$ENTITY_NAME_PASCAL, validateCreate${ENTITY_NAME_PASCAL}Data } from './validation';
export { 
  get${ENTITY_NAME_PASCAL}DisplayName, 
  isSame$ENTITY_NAME_PASCAL,
  filter${ENTITY_NAME_PASCAL}sById,
  sort${ENTITY_NAME_PASCAL}sByCreatedAt,
} from './utils';
EOF

# Create api/queries.ts
cat > "$ENTITY_DIR/api/queries.ts" << EOF
import type { $ENTITY_NAME_PASCAL } from '../model';

export async function get${ENTITY_NAME_PASCAL}s(): Promise<$ENTITY_NAME_PASCAL[]> {
  // TODO: Implement API call
  throw new Error('get${ENTITY_NAME_PASCAL}s not implemented');
}

export async function get$ENTITY_NAME_PASCAL(id: string): Promise<$ENTITY_NAME_PASCAL> {
  // TODO: Implement API call
  throw new Error('get$ENTITY_NAME_PASCAL not implemented');
}
EOF

# Create api/mutations.ts
cat > "$ENTITY_DIR/api/mutations.ts" << EOF
import type { $ENTITY_NAME_PASCAL, Create${ENTITY_NAME_PASCAL}Data, Update${ENTITY_NAME_PASCAL}Data } from '../model';

export async function create$ENTITY_NAME_PASCAL(data: Create${ENTITY_NAME_PASCAL}Data): Promise<$ENTITY_NAME_PASCAL> {
  // TODO: Implement API call
  throw new Error('create$ENTITY_NAME_PASCAL not implemented');
}

export async function update$ENTITY_NAME_PASCAL(id: string, data: Update${ENTITY_NAME_PASCAL}Data): Promise<$ENTITY_NAME_PASCAL> {
  // TODO: Implement API call
  throw new Error('update$ENTITY_NAME_PASCAL not implemented');
}

export async function delete$ENTITY_NAME_PASCAL(id: string): Promise<void> {
  // TODO: Implement API call
  throw new Error('delete$ENTITY_NAME_PASCAL not implemented');
}
EOF

# Create api/index.ts
cat > "$ENTITY_DIR/api/index.ts" << EOF
export { get${ENTITY_NAME_PASCAL}s, get$ENTITY_NAME_PASCAL } from './queries';
export { create$ENTITY_NAME_PASCAL, update$ENTITY_NAME_PASCAL, delete$ENTITY_NAME_PASCAL } from './mutations';
EOF

# Create ui/${ENTITY_NAME_PASCAL}Card.tsx
cat > "$ENTITY_DIR/ui/${ENTITY_NAME_PASCAL}Card.tsx" << EOF
import type { $ENTITY_NAME_PASCAL } from '../model';

export interface ${ENTITY_NAME_PASCAL}CardProps {
  entity: $ENTITY_NAME_PASCAL;
  onClick?: (entity: $ENTITY_NAME_PASCAL) => void;
}

export function ${ENTITY_NAME_PASCAL}Card({ entity, onClick }: ${ENTITY_NAME_PASCAL}CardProps) {
  return (
    <div 
      className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(entity)}
    >
      <h3 className="font-semibold">{entity.id}</h3>
      <p className="text-sm text-gray-500">
        Created: {new Date(entity.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}
EOF

# Create ui/index.ts
cat > "$ENTITY_DIR/ui/index.ts" << EOF
export { ${ENTITY_NAME_PASCAL}Card } from './${ENTITY_NAME_PASCAL}Card';
EOF

# Create main index.ts (Public API)
cat > "$ENTITY_DIR/index.ts" << EOF
/**
 * $ENTITY_NAME_PASCAL Entity - Public API
 * Central export point for all $ENTITY_NAME_CAMEL entity functionality
 */

// Model exports
export type {
  $ENTITY_NAME_PASCAL,
  Create${ENTITY_NAME_PASCAL}Data,
  Update${ENTITY_NAME_PASCAL}Data,
} from './model';

export {
  validate$ENTITY_NAME_PASCAL,
  validateCreate${ENTITY_NAME_PASCAL}Data,
  get${ENTITY_NAME_PASCAL}DisplayName,
  isSame$ENTITY_NAME_PASCAL,
  filter${ENTITY_NAME_PASCAL}sById,
  sort${ENTITY_NAME_PASCAL}sByCreatedAt,
} from './model';

// API exports
export {
  get${ENTITY_NAME_PASCAL}s,
  get$ENTITY_NAME_PASCAL,
  create$ENTITY_NAME_PASCAL,
  update$ENTITY_NAME_PASCAL,
  delete$ENTITY_NAME_PASCAL,
} from './api';

// UI exports
export { ${ENTITY_NAME_PASCAL}Card } from './ui';
EOF

echo "✓ Entity '$ENTITY_NAME_PASCAL' created successfully at $ENTITY_DIR"
echo ""
echo "Next steps:"
echo "1. Implement the entity properties in model/types.ts"
echo "2. Add validation logic in model/validation.ts"
echo "3. Implement API calls in api/queries.ts and api/mutations.ts"
echo "4. Customize the UI component in ui/${ENTITY_NAME_PASCAL}Card.tsx"
echo ""
echo "Import the entity in your code:"
echo "  import { $ENTITY_NAME_PASCAL, get${ENTITY_NAME_PASCAL}s } from '@/entities/$ENTITY_NAME_KEBAB';"
