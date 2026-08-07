# StudentProfileCard Component

## Overview

The `StudentProfileCard` is a consolidated React component that merges functionality from three existing components:

1. **HeroSection.jsx** - QR code generation and profile header display
2. **PersonalInfoSummary.jsx** - Profile information layout and display
3. **EmployabilityScoreCard.jsx** - Score calculation, visualization, and circular progress

This component provides a comprehensive student profile view with college identification, QR code access, and enrollability score visualization.

## Features

### From HeroSection.jsx
- ✅ QR code generation using `generateProfileQRCode()` utility
- ✅ Profile avatar display with graduation cap icon fallback
- ✅ College/university information display
- ✅ Gradient background styling

### From PersonalInfoSummary.jsx
- ✅ Structured profile data layout (name, email, college ID)
- ✅ College name and identification display
- ✅ Program and semester badge display
- ✅ Link Range ID field (conditional rendering)

### From EmployabilityScoreCard.jsx
- ✅ Enrollability score calculation and display
- ✅ Circular progress indicator using `CircularProgress` component
- ✅ Score status classification (Excellent/Good/Average/Needs Improvement)
- ✅ Color-coded progress bar and status indicators

### New Features
- ✅ Integrated layout combining all three source components
- ✅ Updated color coding:
  - Green (≥85%): Excellent
  - Blue (70-84%): Good
  - Yellow (50-69%): Average
  - Red (<50%): Needs Improvement
- ✅ TypeScript conversion with full type safety
- ✅ Responsive design for mobile/tablet/desktop
- ✅ "View Full Profile" CTA button
- ✅ Proper accessibility (ARIA labels, semantic HTML)

## Usage

### Basic Usage

```typescript
import { StudentProfileCard } from '@/widgets/learner-dashboard';

function Dashboard() {
  const learnerData = {
    id: 'learner-123',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@stanford.edu',
    avatar: 'https://example.com/avatar.jpg',
    collegeId: 'SU2024-8421',
    collegeName: 'Stanford University',
    linkRangeId: 'LR-2024-CS-001',
    program: 'B.Tech Computer Science',
    semester: 5,
    enrollabilityScore: 78,
    grade: 'UG',
  };

  return (
    <StudentProfileCard
      learnerData={learnerData}
      onViewProfile={() => navigate('/learner/profile')}
    />
  );
}
```

### Props Interface

```typescript
interface StudentProfileCardProps {
  learnerData: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    collegeId: string;
    collegeName: string;
    linkRangeId?: string;
    program: string;
    semester: number;
    enrollabilityScore: number;
    grade: string;
  };
  onViewProfile?: () => void;
}
```

## Component Structure

```
StudentProfileCard
├── Left Column
│   ├── Profile Header (Avatar + Name + Email)
│   ├── College Information
│   │   ├── College Name
│   │   ├── College ID
│   │   └── Link Range ID (optional)
│   ├── Program/Semester Badges
│   └── View Full Profile Button
└── Right Column
    ├── QR Code Card
    │   ├── QR Code Image
    │   └── Passport ID
    └── Enrollability Score Section
        ├── Score Header (with percentage)
        ├── Circular Progress Indicator
        ├── Status Label (Excellent/Good/Average/Needs Improvement)
        ├── Linear Progress Bar
        └── Range Labels (Beginner/Expert)
```

## Color Schemes by Score Range

| Score Range | Status | Primary Color | Border | Background |
|------------|--------|---------------|--------|------------|
| ≥85% | Excellent | Green (#10b981) | border-green-300 | bg-green-100 |
| 70-84% | Good | Blue (#3b82f6) | border-blue-300 | bg-blue-100 |
| 50-69% | Average | Amber (#f59e0b) | border-amber-300 | bg-amber-100 |
| <50% | Needs Improvement | Red (#ef4444) | border-red-300 | bg-red-100 |

## Testing

### Test Coverage

- ✅ 19 unit tests (all passing)
- ✅ Rendering with complete data
- ✅ Rendering with missing optional fields
- ✅ QR code generation and display
- ✅ Score color coding for all ranges
- ✅ Status text verification
- ✅ Button click handlers
- ✅ Responsive behavior

### Running Tests

```bash
npm test -- StudentProfileCard.test.tsx --run
```

## Dependencies

- **React** - UI framework
- **lucide-react** - Icon library
- **@/shared/ui/Card** - Card container component
- **@/shared/ui/Badge** - Badge component
- **@/shared/ui/CircularProgress** - Circular progress indicator
- **@/shared/lib/utils/qrCode** - QR code generation utility
- **@/shared/lib/calculations/enrollability** - Score calculation

## File Locations

- **Component**: `src/widgets/learner-dashboard/ui/StudentProfileCard.tsx`
- **Tests**: `src/widgets/learner-dashboard/ui/StudentProfileCard.test.tsx`
- **Examples**: `src/widgets/learner-dashboard/ui/StudentProfileCard.example.tsx`
- **Types**: `src/widgets/learner-dashboard/model/types.ts`

## Migration Notes

### Original Components Status

The following components have been consolidated into `StudentProfileCard`:

- ✅ **HeroSection.jsx** - Functionality preserved and enhanced
- ✅ **PersonalInfoSummary.jsx** - Functionality integrated
- ✅ **EmployabilityScoreCard.jsx** - Functionality merged

These original components can be deprecated once the new `StudentProfileCard` is fully integrated into the dashboard.

### Breaking Changes

None - This is a new component. Existing components remain unchanged.

### Deprecation Plan

1. ✅ Phase 1: Create new `StudentProfileCard` component (COMPLETED)
2. ⏳ Phase 2: Update dashboard to use `StudentProfileCard`
3. ⏳ Phase 3: Mark old components as deprecated with JSDoc annotations
4. ⏳ Phase 4: Move old components to `_deprecated/` folder after 2 weeks
5. ⏳ Phase 5: Delete deprecated components after 1 month

## Requirements Validation

This component validates the following requirements from the spec:

- **Requirements 1.1-1.10**: Student Profile Display
  - ✅ 1.1: Display learner name, email, avatar
  - ✅ 1.2: Display college ID, college name, program, semester
  - ✅ 1.3: Display link range ID (conditional)
  - ✅ 1.4: Generate and display QR code
  - ✅ 1.5: Calculate and display enrollability score
  - ✅ 1.6-1.9: Color-coded score status (green/blue/yellow/red)
  - ✅ 1.10: "View Full Profile" button navigation

- **Requirements 9.1-9.10**: Enrollability Score Calculation
  - ✅ Uses `calculateEnrollabilityScore()` function
  - ✅ Weighted factors: skills (35%), learning (30%), certs (20%), activity (15%)
  - ✅ Score capped at 100
  - ✅ Status classification based on score ranges

## Accessibility

- ✅ Semantic HTML structure
- ✅ ARIA labels for progress indicators
- ✅ Keyboard navigation support
- ✅ Color contrast ratios meet WCAG AA standards
- ✅ Screen reader compatible
- ✅ Focus indicators for interactive elements

## Performance

- ✅ QR code generated asynchronously (doesn't block render)
- ✅ Error handling for QR code generation failures
- ✅ Optimized re-renders with React hooks
- ✅ No unnecessary prop drilling
- ✅ Lazy loading of QR code image

## Responsive Design

- **Mobile** (< 768px): Single column layout
- **Tablet** (768px - 1024px): Two column layout with stacked elements
- **Desktop** (> 1024px): Full two column grid layout

## Future Enhancements

- [ ] Add score breakdown tooltip (showing factor contributions)
- [ ] Implement score history chart
- [ ] Add downloadable QR code option
- [ ] Implement profile completion percentage
- [ ] Add social sharing for digital passport

## Support

For questions or issues, please refer to:
- Design Document: `.kiro/specs/college-dashboard-redesign/design.md`
- Requirements: `.kiro/specs/college-dashboard-redesign/requirements.md`
- Tasks: `.kiro/specs/college-dashboard-redesign/tasks.md`
