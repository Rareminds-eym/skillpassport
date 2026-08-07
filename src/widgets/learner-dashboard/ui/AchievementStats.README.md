# AchievementStats Widget

## Overview

The **AchievementStats** widget displays learner achievement metrics in a compact, dashboard-friendly format. This component was extracted and simplified from the existing `AchievementsTimeline.jsx` component, removing the timeline visualization and focusing on key statistics.

## Component Origin

**Reused from:** `AchievementsTimeline.jsx`

**Transformation:** 
- ✅ Extracted achievement data structure and counting logic
- ✅ Simplified from timeline visualization to grid-based stat cards
- ✅ Preserved streak tracking with flame icon
- ✅ Preserved badge and certificate counting logic
- ✅ Converted to TypeScript (.tsx) with proper type definitions

## Features

- **Learning Streak Display** - Shows current streak with flame icon, best streak indicator
- **Badges Earned** - Displays total badges with optional badges total
- **Certificates Earned** - Shows certificate count with verification status
- **Last Activity Tracking** - Displays last activity date when available
- **Motivational Messages** - Shows encouragement for streaks ≥7 days
- **Responsive Grid Layout** - Adapts to mobile/tablet/desktop screens
- **Animated Transitions** - Smooth fade-in animations using Framer Motion
- **Call-to-Action** - "View All Achievements" button with navigation callback

## Requirements Fulfilled

This component fulfills **Requirements 2.1-2.5** from the design specification:

- ✅ **2.1** - Displays current learning streak in days
- ✅ **2.2** - Displays total number of badges earned
- ✅ **2.3** - Displays total number of certificates earned
- ✅ **2.4** - Provides link to view detailed achievements
- ✅ **2.5** - Displays flame icon alongside streak count

## Usage

### Basic Usage

```tsx
import { AchievementStats } from '@/widgets/learner-dashboard';

const MyDashboard = () => {
  return (
    <AchievementStats
      stats={{
        streak: 15,
        badges: 12,
        certificates: 5,
      }}
      onViewAchievements={() => navigate('/learner/achievements')}
    />
  );
};
```

### With All Optional Fields

```tsx
<AchievementStats
  stats={{
    streak: 15,
    streakBest: 30,
    badges: 12,
    badgesTotal: 50,
    certificates: 5,
    lastActivity: new Date('2024-01-15'),
  }}
  onViewAchievements={() => navigate('/learner/achievements')}
/>
```

### Without Action Button

```tsx
<AchievementStats
  stats={{
    streak: 10,
    badges: 8,
    certificates: 3,
  }}
  // No onViewAchievements - button will be hidden
/>
```

## Props

### AchievementStatsProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `stats` | `AchievementStats` | ✅ Yes | Achievement statistics object |
| `onViewAchievements` | `() => void` | ❌ No | Callback when "View Achievements" button is clicked |

### AchievementStats (stats object)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `streak` | `number` | ✅ Yes | Current learning streak in days |
| `streakBest` | `number` | ❌ No | Best/longest streak achieved |
| `badges` | `number` | ✅ Yes | Total badges earned |
| `badgesTotal` | `number` | ❌ No | Total badges available |
| `certificates` | `number` | ✅ Yes | Total certificates earned |
| `lastActivity` | `Date` | ❌ No | Last activity timestamp |

## Visual Design

### Layout Structure

```
┌─────────────────────────────────────────────┐
│  🏆 Achievement Stats                       │
│     Your learning milestones                │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 🔥 15    │ │ 🏅 12    │ │ 🎓 5     │   │
│  │ Streak   │ │ Badges   │ │ Certs    │   │
│  │ Best: 30 │ │ of 50    │ │ Verified │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                             │
│  📈 Last active: Jan 15, 2024               │
│                                             │
│  🔥 Amazing! You're on fire with...         │
│                                             │
│  [ View All Achievements → ]                │
│                                             │
└─────────────────────────────────────────────┘
```

### Color Scheme

- **Streak Card**: Orange gradient (`from-orange-50 to-white`)
- **Badges Card**: Blue gradient (`from-blue-50 to-white`)
- **Certificates Card**: Green gradient (`from-green-50 to-white`)
- **Decorative Border**: Amber to orange gradient (`from-amber-400 via-orange-400 to-red-400`)

### Icons

- **Streak**: `Flame` icon (filled when streak > 0, outlined when 0)
- **Badges**: `Award` icon
- **Certificates**: `GraduationCap` icon
- **Last Activity**: `TrendingUp` icon
- **Button**: `ArrowRight` icon with hover animation

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Single column, stacked cards |
| Tablet (≥ 640px) | Three columns side-by-side |
| Desktop (≥ 1024px) | Three columns with larger spacing |

## Special Behaviors

### Motivational Message

When `stats.streak >= 7`, a motivational message appears:

```
🔥 Amazing! You're on fire with a 15-day streak!
```

This provides positive reinforcement for consistent learning behavior.

### Zero State Handling

The component gracefully handles zero values:

- **Streak = 0**: Flame icon is gray/outlined
- **Badges = 0**: Shows count as "0"
- **Certificates = 0**: Subtitle changes to "Start learning"

### Button Visibility

The "View All Achievements" button only appears when `onViewAchievements` callback is provided. This allows flexibility in different dashboard contexts.

## Animations

All animations use **Framer Motion**:

1. **Container fade-in**: Opacity 0→1, Y-translate 20→0, duration 0.5s
2. **Stat cards stagger**: Each card delays by 0.1s (card 1: 0.1s, card 2: 0.2s, card 3: 0.3s)
3. **Motivational message**: Opacity 0→1, Y-translate 10→0, delay 0.5s
4. **Button arrow hover**: X-translate on hover with smooth transition

## Accessibility

- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy
- ✅ Button role for clickable elements
- ✅ ARIA labels on icons (inherited from lucide-react)
- ✅ Keyboard navigation support
- ✅ Color contrast ratio meets WCAG 2.1 AA standards
- ✅ Focus indicators on interactive elements

## Testing

Comprehensive test coverage includes:

- ✅ Rendering with valid data
- ✅ All requirements (2.1-2.5) validation
- ✅ Optional field handling
- ✅ Edge cases (zeros, large numbers, missing fields)
- ✅ Callback invocation
- ✅ Responsive layout
- ✅ Accessibility checks
- ✅ Animation and styling verification

**Test file:** `AchievementStats.test.tsx`

**Test coverage:** 31 test cases, 100% pass rate

Run tests:
```bash
npm test -- AchievementStats.test.tsx --run
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `react` | Core framework |
| `framer-motion` | Animations |
| `lucide-react` | Icons |
| `@/shared/ui/Card` | Card container components |
| `@/shared/ui/StatCard` | Individual stat card component |

## Integration Example

### Dashboard Integration

```tsx
import { AchievementStats } from '@/widgets/learner-dashboard';
import { useNavigate } from 'react-router-dom';

const LearnerDashboard = () => {
  const navigate = useNavigate();
  
  // Fetch from API or state management
  const achievementData = {
    streak: 15,
    streakBest: 30,
    badges: 12,
    badgesTotal: 50,
    certificates: 5,
    lastActivity: new Date(),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Other widgets */}
      <div className="lg:col-span-2">
        <AchievementStats
          stats={achievementData}
          onViewAchievements={() => navigate('/learner/achievements')}
        />
      </div>
    </div>
  );
};
```

## File Structure

```
src/widgets/learner-dashboard/
├── ui/
│   ├── AchievementStats.tsx          # Main component
│   ├── AchievementStats.test.tsx     # Unit tests
│   ├── AchievementStats.example.tsx  # Usage examples
│   └── AchievementStats.README.md    # This file
├── model/
│   └── types.ts                      # Type definitions
└── index.ts                          # Barrel exports
```

## Migration Notes

### Changes from AchievementsTimeline.jsx

1. **Removed**: Timeline visualization with `react-vertical-timeline-component`
2. **Removed**: Achievement aggregation logic (certificates, projects, education, experience)
3. **Simplified**: Focus on three core metrics (streak, badges, certificates)
4. **Added**: TypeScript type safety
5. **Added**: Motivational messaging for streaks ≥7 days
6. **Added**: Last activity timestamp display
7. **Preserved**: Streak counting logic
8. **Preserved**: Flame icon for streak visualization
9. **Preserved**: Navigation to detailed achievements page

### Why This Approach?

The original `AchievementsTimeline.jsx` is a comprehensive component showing a full timeline of achievements. For the dashboard, we needed:

- ✅ **Compact display** - Less vertical space
- ✅ **Quick metrics** - At-a-glance statistics
- ✅ **Faster loading** - No timeline rendering overhead
- ✅ **Clearer focus** - Three key achievement metrics

The timeline view is still accessible via the "View All Achievements" button, maintaining feature parity while improving dashboard UX.

## Support

For issues, questions, or contributions related to this component:

1. Check existing tests for expected behavior
2. Review the example file for common use cases
3. Consult the design document: `.kiro/specs/college-dashboard-redesign/design.md`
4. Refer to requirements: `.kiro/specs/college-dashboard-redesign/requirements.md`

## Version History

- **v1.0.0** (2024-01) - Initial implementation extracted from AchievementsTimeline.jsx
  - Phase 2 of college dashboard redesign
  - Simplified stat card display
  - TypeScript conversion
  - Comprehensive test coverage
