# Reusable UI Components

This directory contains reusable UI components for the SkillPassport college dashboard redesign, built with React, TypeScript, and Tailwind CSS.

## Components

### 1. CircularProgress
Circular progress indicator for displaying scores and percentages.

```tsx
import { CircularProgress } from '@/shared/ui';

<CircularProgress 
  value={75} 
  size={120}
  color="green"
  label="Score"
  showPercentage 
/>
```

**Props:**
- `value` (0-100): Progress value
- `size`: Circle diameter in pixels (default: 120)
- `color`: "green" | "blue" | "yellow" | "red" (default: "blue")
- `label`: Optional text label
- `showPercentage`: Show percentage text (default: true)
- `strokeWidth`: Circle stroke width (default: 8)

**Use case:** Enrollability score display in StudentProfileCard widget

---

### 2. ProgressBar
Horizontal progress bar with auto color-coding based on value ranges.

```tsx
import { ProgressBar } from '@/shared/ui';

<ProgressBar 
  value={85} 
  color="auto"
  label="JavaScript"
  showPercentage
  height={8}
/>
```

**Props:**
- `value` (0-100): Progress value
- `color`: "auto" | "green" | "blue" | "yellow" | "red" (default: "auto")
  - Auto color-coding: >80% = green, 60-80% = yellow, <60% = red
- `label`: Optional label text
- `showPercentage`: Display percentage value (default: false)
- `height`: Bar height in pixels (default: 8)

**Use case:** Skill proficiency bars in SkillsSnapshot widget

---

### 3. Badge
Colored badge component for displaying status, categories, or labels.

```tsx
import { Badge } from '@/shared/ui';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Expired</Badge>
<Badge variant="info">Verified</Badge>
```

**Props:**
- `variant`: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "error" | "info"
- `children`: Badge content

**Use case:** Verification status badges in SkillPassportCard widget

---

### 4. Card
Container component with variants, padding, and shadow options.

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/ui';

<Card variant="default" padding="md" shadow="sm">
  <CardHeader>
    <CardTitle>Dashboard Widget</CardTitle>
  </CardHeader>
  <CardContent>
    Widget content goes here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

**Props:**
- `variant`: "default" | "orange" | "blue"
- `padding`: "none" | "sm" | "md" | "lg"
- `shadow`: "none" | "sm" | "md" | "lg" (default: "sm")

**Use case:** Widget containers across all dashboard widgets

---

### 5. StatCard
Metric display card with icon, value, and trend indicator.

```tsx
import { StatCard } from '@/shared/ui';

<StatCard
  title="Streak"
  value={15}
  subtitle="days"
  icon={<FlameIcon />}
  trend={{ value: 5, direction: 'up' }}
  onClick={() => navigate('/achievements')}
/>
```

**Props:**
- `title`: Stat title text
- `value`: Stat value (string or number)
- `icon`: Optional React icon element
- `trend`: Optional trend object `{ value: number, direction: 'up' | 'down' }`
- `subtitle`: Optional subtitle text
- `onClick`: Optional click handler (makes card clickable)

**Use case:** Metric displays in AchievementStats widget

---

### 6. ErrorBoundary
React error boundary component for catching and displaying errors.

```tsx
import { ErrorBoundary } from '@/shared/ui';

<ErrorBoundary 
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => console.error(error)}
>
  <DashboardWidget />
</ErrorBoundary>
```

**Props:**
- `children`: Components to wrap
- `fallback`: Optional custom error UI (uses default if not provided)
- `onError`: Optional error callback for logging

**Use case:** Wrapping all dashboard widgets for error handling

---

### 7. LoadingSkeleton
Animated loading placeholder for content loading states.

```tsx
import { 
  LoadingSkeleton, 
  SkeletonCard, 
  SkeletonAvatar, 
  SkeletonText 
} from '@/shared/ui';

// Basic skeleton
<LoadingSkeleton variant="rectangular" width={200} height={100} />

// Circular skeleton
<LoadingSkeleton variant="circular" width={60} height={60} />

// Text lines
<LoadingSkeleton variant="text" count={3} />

// Preset components
<SkeletonCard />
<SkeletonAvatar size={48} />
<SkeletonText lines={5} />
```

**Props:**
- `variant`: "text" | "circular" | "rectangular" (default: "text")
- `width`: Width in pixels or CSS string
- `height`: Height in pixels or CSS string
- `count`: Number of skeleton elements (default: 1)
- `animation`: "pulse" | "wave" (default: "pulse")

**Use case:** Dashboard loading states while fetching data

---

## Design System

### Colors
Components use Tailwind CSS color utilities and follow these conventions:
- **Green (#10b981)**: Excellent/Success (>80%)
- **Blue (#3b82f6)**: Good/Info (70-80%)
- **Yellow (#f59e0b)**: Average/Warning (50-69%)
- **Red (#ef4444)**: Needs Improvement/Error (<50%)

### Accessibility
All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators
- Semantic HTML

### Responsiveness
Components are mobile-first and fully responsive using Tailwind breakpoints:
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

## Testing

All components include unit tests using Vitest and React Testing Library:

```bash
npm test -- --run src/shared/ui/
```

Test coverage includes:
- Rendering without errors
- Prop validation
- User interactions
- Accessibility attributes
- Edge cases (min/max values, empty states)

## Architecture

These components follow Feature-Sliced Design (FSD) architecture:
- **Location**: `src/shared/ui/` (shared layer)
- **Usage**: Imported by widgets, features, and pages
- **Philosophy**: Reusable, composable, framework-agnostic patterns

## Requirements Validation

These components validate requirements:
- **1.5**: Responsive design and accessibility (Card, all components)
- **8.2**: Color-coded skill proficiency (ProgressBar)
- **12.11**: Loading indicators for widgets (LoadingSkeleton)
- **13.10**: Error handling UI (ErrorBoundary)
- **15.1-15.3**: Responsive layouts, keyboard navigation, ARIA labels

## Examples

See `src/widgets/learner-dashboard/ui/` for complete usage examples in dashboard widgets.
