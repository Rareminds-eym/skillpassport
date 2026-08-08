# SkillPassportCard Widget

## Overview

The `SkillPassportCard` widget displays a comprehensive view of a learner's skill passport, including verified skills count, skill score, certificates, verification status badge, and a detailed skill health breakdown. It categorizes skills into three health levels: healthy (>75% proficiency), upskill (50-75% proficiency), and critical (<50% proficiency).

**Part of:** College Dashboard Redesign - Phase 3  
**Task:** 9.1  
**Requirements:** 5.1-5.9, 10.1-10.7

## Features

### Core Metrics Display (Requirements 5.1-5.3)
- **Verified Skills Count**: Shows total number of verified skills
- **Skill Score**: Displays overall skill score (0-100) with visual circular progress indicator
- **Certificates Count**: Shows number of earned certificates

### Verification Status (Requirements 5.4-5.5)
- **Status Badge**: Visual badge showing verification status
  - **Active**: Green badge with checkmark icon
  - **Pending**: Yellow badge with clock icon
  - **Expired**: Red badge with alert icon
  - **None**: Gray badge with info icon
- **Last Verified Date**: Displayed when status is "active"

### Skill Health Breakdown (Requirements 5.6-5.7, 10.1-10.7)
- **Healthy Skills** (>75% proficiency): Green indicator
- **Upskill Skills** (50-75% proficiency): Yellow indicator
- **Critical Skills** (<50% proficiency): Red indicator
- Shows percentage, count, and progress bar for each category
- Uses `calculateSkillHealth()` utility from `@/shared/lib/calculations/skillHealth`

### Action Buttons (Requirements 5.8-5.9)
- **Upskill Now**: Navigates to skill improvement resources
- **View Details**: Navigates to digital portfolio/passport page

## Props Interface

```typescript
interface SkillPassportCardProps {
  passport: {
    verifiedSkills: number;
    skillScore: number; // 0-100
    certificates: number;
    verificationStatus: 'active' | 'pending' | 'expired' | 'none';
    lastVerified?: Date;
    skills: SkillWithProficiency[];
  };
  onUpskill?: () => void;
  onViewDetails?: () => void;
}

interface SkillWithProficiency {
  name?: string;
  skillName?: string;
  proficiency: number; // 0-100
}
```

## Usage

### Basic Usage

```tsx
import { SkillPassportCard } from '@/widgets/learner-dashboard';

function DashboardPage() {
  const passportData = {
    verifiedSkills: 15,
    skillScore: 75,
    certificates: 8,
    verificationStatus: 'active',
    lastVerified: new Date('2024-01-15'),
    skills: [
      { name: 'JavaScript', proficiency: 90 },
      { name: 'React', proficiency: 85 },
      { name: 'Python', proficiency: 70 },
      { name: 'Docker', proficiency: 45 },
      // ... more skills
    ],
  };

  const handleUpskill = () => {
    navigate('/learner/my-skills');
  };

  const handleViewDetails = () => {
    navigate('/learner/digital-portfolio');
  };

  return (
    <SkillPassportCard
      passport={passportData}
      onUpskill={handleUpskill}
      onViewDetails={handleViewDetails}
    />
  );
}
```

### With React Router

```tsx
import { useNavigate } from 'react-router-dom';
import { SkillPassportCard } from '@/widgets/learner-dashboard';

function DashboardPage() {
  const navigate = useNavigate();
  const passportData = usePassportData(); // Custom hook to fetch data

  return (
    <SkillPassportCard
      passport={passportData}
      onUpskill={() => navigate('/learner/my-skills')}
      onViewDetails={() => navigate('/learner/digital-portfolio')}
    />
  );
}
```

### Without Callbacks (Optional Props)

```tsx
import { SkillPassportCard } from '@/widgets/learner-dashboard';

function ReadOnlyPassport() {
  const passportData = getPassportData();

  // Buttons will still render but won't do anything
  return <SkillPassportCard passport={passportData} />;
}
```

## Visual Design

### Layout
- **Card Container**: Rounded corners, shadow, gradient background decoration
- **Header Section**: Icon, title, description, and verification badge
- **Metrics Grid**: 3-column grid for verified skills, skill score, and certificates
- **Circular Progress**: Large visual indicator for overall skill score
- **Health Breakdown**: Stacked sections with progress bars and color coding
- **Action Buttons**: Full-width responsive button layout

### Color Coding

#### Verification Status
- **Active**: Green (`#10b981`)
- **Pending**: Yellow (`#f59e0b`)
- **Expired**: Red (`#ef4444`)
- **None**: Gray (`#6b7280`)

#### Skill Score
- **>75%**: Green (`#10b981`)
- **50-75%**: Yellow (`#f59e0b`)
- **<50%**: Red (`#ef4444`)

#### Skill Health
- **Healthy (>75%)**: Green (`#10b981`)
- **Upskill (50-75%)**: Yellow (`#f59e0b`)
- **Critical (<50%)**: Red (`#ef4444`)

### Responsive Design
- **Mobile (<768px)**: Single column, stacked layout
- **Tablet (768px-1024px)**: Optimized spacing, readable metrics
- **Desktop (>1024px)**: Full feature display, 3-column grid

## Dependencies

### UI Components (from `@/shared/ui`)
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Badge`
- `ProgressBar`
- `CircularProgress`
- `Button`

### Utilities
- `calculateSkillHealth` from `@/shared/lib/calculations/skillHealth`
- `framer-motion` for animations
- `lucide-react` for icons

### Icons Used
- `Shield`: Main passport icon
- `CheckCircle`: Active verification, verified skills metric
- `Clock`: Pending verification
- `AlertTriangle`: Expired verification
- `Info`: No verification
- `Award`: Certificates metric
- `TrendingUp`: Skill score metric, Upskill Now button
- `ExternalLink`: View Details button

## Testing

The component includes comprehensive unit tests covering:

### Rendering Tests
- Component renders without errors
- Card title and description display
- Gradient background decoration

### Metrics Display (Requirements 5.1-5.3)
- Verified skills count display
- Skill score with /100 suffix
- Certificates count display
- Circular progress indicator

### Verification Status (Requirements 5.4-5.5)
- Active badge with checkmark icon
- Last verified date display (active only)
- Pending badge with clock icon
- Expired badge with alert icon
- None badge with info icon
- No date display for non-active status

### Skill Health Breakdown (Requirements 5.6-5.7, 10.1-10.7)
- Health breakdown section display
- Healthy skills count and percentage
- Upskill skills count and percentage
- Critical skills count and percentage
- Proficiency threshold labels
- Progress bars for each category

### Action Buttons (Requirements 5.8-5.9)
- Upskill Now button rendering and callback
- View Details button rendering and callback

### Edge Cases
- Zero skills handling
- Maximum skill score (100)
- Minimum skill score (0)
- Missing callbacks (optional props)
- Undefined lastVerified date

### Accessibility
- ARIA labels for buttons
- Progressbar roles
- Semantic icons

### Color Coding
- Green for skill score >75
- Yellow for skill score 50-75
- Red for skill score <50

## Examples

See `SkillPassportCard.example.tsx` for complete usage examples including:
1. Active verification with mixed skill levels
2. Pending verification status
3. Expired verification status
4. No verification (beginner)
5. High achiever with excellent skill score
6. Empty skills array edge case
7. Component without callbacks

## Validation

### Data Validation
- Skill score must be 0-100
- Proficiency values must be 0-100
- Verification status must be one of: 'active', 'pending', 'expired', 'none'
- Skills array properly handles empty state

### Business Rules
- Skills automatically categorized by proficiency thresholds
- Health percentages calculated from skill distribution
- Circular progress color matches skill score ranges
- Verification badge matches status
- Last verified date only shown for active status

## Architecture

### FSD Layers
- **Widget**: `src/widgets/learner-dashboard/ui/SkillPassportCard.tsx`
- **Types**: `src/widgets/learner-dashboard/model/types.ts`
- **Shared Logic**: `src/shared/lib/calculations/skillHealth.ts`
- **Shared UI**: `src/shared/ui/` (Card, Badge, ProgressBar, etc.)

### Calculations
The component uses `calculateSkillHealth()` from shared utilities to automatically categorize skills:
- Input: Array of skills with proficiency values
- Output: Breakdown with healthy/upskill/critical percentages, counts, and skill names
- Handles edge cases: empty arrays, zero skills

## Future Enhancements

Potential improvements for future iterations:
1. **Skill Recommendations**: AI-powered skill improvement suggestions
2. **Trend Indicators**: Show skill proficiency trends (improving/declining)
3. **Export Functionality**: Download skill passport as PDF
4. **Share Feature**: Share skill passport via link or social media
5. **Skill Details Modal**: Click on skill category to view detailed breakdown
6. **Interactive Charts**: Hover tooltips showing individual skills in each category
7. **Gamification**: Add achievement badges for skill milestones
8. **Comparison View**: Compare skill levels with industry benchmarks

## Related Components

- **StudentProfileCard**: Displays learner profile with enrollability score
- **AchievementStats**: Shows streak, badges, and certificates
- **SkillsSnapshot**: Displays top 5 skills with proficiency bars
- **CurrentLearningPath**: Shows active learning path progress

## Troubleshooting

### Skills not categorizing correctly
- Ensure proficiency values are between 0-100
- Check that skills have either `name` or `skillName` property
- Verify `calculateSkillHealth()` is imported correctly

### Verification date not displaying
- Verify `verificationStatus` is set to `'active'`
- Check that `lastVerified` is a valid Date object
- Ensure date formatting is working (check browser locale)

### Buttons not working
- Verify callbacks are passed: `onUpskill` and `onViewDetails`
- Check console for navigation errors
- Ensure routing is configured correctly

### Progress bars not showing
- Check that skill health breakdown has valid percentages
- Verify `ProgressBar` component is imported correctly
- Ensure CSS classes are loaded

## License

Part of the SkillPassport platform. All rights reserved.
