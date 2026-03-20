#!/bin/bash

# Create Widget Script
# Usage: bash .kiro/scripts/create-widget.sh <widget-name>
# Example: bash .kiro/scripts/create-widget.sh product-catalog

set -e

if [ -z "$1" ]; then
  echo "Error: Widget name is required"
  echo "Usage: bash .kiro/scripts/create-widget.sh <widget-name>"
  echo "Example: bash .kiro/scripts/create-widget.sh product-catalog"
  exit 1
fi

WIDGET_NAME_KEBAB=$1
WIDGET_NAME_PASCAL=$(echo "$WIDGET_NAME_KEBAB" | sed -r 's/(^|-)([a-z])/\U\2/g')
WIDGET_NAME_CAMEL=$(echo "$WIDGET_NAME_PASCAL" | sed 's/^./\l&/')

WIDGET_DIR="src/widgets/$WIDGET_NAME_KEBAB"

echo "Creating widget: $WIDGET_NAME_PASCAL"
echo "Directory: $WIDGET_DIR"

# Check if widget already exists
if [ -d "$WIDGET_DIR" ]; then
  echo "Error: Widget '$WIDGET_NAME_KEBAB' already exists at $WIDGET_DIR"
  exit 1
fi

# Create directory structure
mkdir -p "$WIDGET_DIR/model"
mkdir -p "$WIDGET_DIR/ui"

# Create model/types.ts
cat > "$WIDGET_DIR/model/types.ts" << EOF
export interface ${WIDGET_NAME_PASCAL}Props {
  className?: string;
  // Add widget props here
}

export interface ${WIDGET_NAME_PASCAL}State {
  isLoading: boolean;
  // Add widget state properties here
}
EOF

# Create model/index.ts
cat > "$WIDGET_DIR/model/index.ts" << EOF
export type { ${WIDGET_NAME_PASCAL}Props, ${WIDGET_NAME_PASCAL}State } from './types';
EOF

# Create ui/${WIDGET_NAME_PASCAL}.tsx
cat > "$WIDGET_DIR/ui/${WIDGET_NAME_PASCAL}.tsx" << EOF
import type { ${WIDGET_NAME_PASCAL}Props } from '../model';

/**
 * $WIDGET_NAME_PASCAL Widget
 * 
 * Complex composite UI component that combines multiple features/entities
 * 
 * Dependencies:
 * - Entities: (list entities used)
 * - Features: (list features used)
 * - Shared: (list shared components used)
 * 
 * FSD Rules:
 * - Only import from entities, features, and shared layers
 * - Do not import from pages or app layers
 * - Do not import from other widgets
 */
export function $WIDGET_NAME_PASCAL({ className }: ${WIDGET_NAME_PASCAL}Props) {
  return (
    <div className={className}>
      <h2>$WIDGET_NAME_PASCAL</h2>
      {/* Compose features and entities here */}
    </div>
  );
}
EOF

# Create ui/index.ts
cat > "$WIDGET_DIR/ui/index.ts" << EOF
export { $WIDGET_NAME_PASCAL } from './$WIDGET_NAME_PASCAL';
EOF

# Create main index.ts (Public API)
cat > "$WIDGET_DIR/index.ts" << EOF
/**
 * $WIDGET_NAME_PASCAL Widget - Public API
 * 
 * Complex widget that composes multiple features and entities
 */

export { $WIDGET_NAME_PASCAL } from './ui/$WIDGET_NAME_PASCAL';
export type { ${WIDGET_NAME_PASCAL}Props } from './model/types';
EOF

echo "✓ Widget '$WIDGET_NAME_PASCAL' created successfully at $WIDGET_DIR"
echo ""
echo "Next steps:"
echo "1. Define widget props in model/types.ts"
echo "2. Implement the widget UI in ui/${WIDGET_NAME_PASCAL}.tsx"
echo "3. Import and compose entities/features from allowed layers"
echo "4. (Optional) Add state management in model/store.ts if needed"
echo ""
echo "Import the widget in your code:"
echo "  import { $WIDGET_NAME_PASCAL } from '@/widgets/$WIDGET_NAME_KEBAB';"
echo ""
echo "FSD Layer Rules:"
echo "  ✓ Can import from: entities, features, shared"
echo "  ✗ Cannot import from: pages, app, other widgets"
