# CareerAITools Widget

A responsive widget component that displays a grid of 7 AI-powered career tools with premium indicators, access control, and upgrade prompts.

## Overview

The CareerAITools widget is part of the college dashboard redesign (Phase 4) and provides learners with quick access to AI-powered career development tools including skill gap analysis, resume review, interview preparation, learning paths, networking tips, career guidance, and career advice.

## Features

✅ **7 AI Career Tools** - Complete suite of career development tools  
✅ **Responsive Grid Layout** - 3 columns (desktop), 2 columns (tablet), 1 column (mobile)  
✅ **Premium Indicators** - Visual distinction for subscription-based tools  
✅ **Access Control** - Checks user permissions before navigation  
✅ **Upgrade Prompts** - Elegant modal for premium features without access  
✅ **Analytics Tracking** - Built-in support for Google Analytics (gtag)  
✅ **Animated Interactions** - Smooth hover effects and transitions  
✅ **Category Badges** - Color-coded badges for assessment/preparation/guidance  
✅ **Time Estimates** - Shows estimated completion time for each tool  

## Requirements Fulfilled

This component validates Requirements **4.1-4.11** from the college dashboard redesign spec:

- **4.1**: Display grid of 7 AI-powered career tools ✓
- **4.2**: Skill Gap Analysis tool (/learner/career-ai/skill-gap) ✓
- **4.3**: Resume Review tool (/learner/career-ai/resume) ✓
- **4.4**: Interview Prep tool (/learner/career-ai/interview) ✓
- **4.5**: Learning Path tool (/learner/career-ai/path) ✓
- **4.6**: Networking Tips tool (/learner/career-ai/networking) ✓
- **4.7**: Career Guidance tool (/learner/career-ai/guidance) ✓
- **4.8**: Career Advice tool (/learner/career-ai/advice) ✓
- **4.9**: Navigate to corresponding tool page on click ✓
- **4.10**: Display premium indicator for subscription tools ✓
- **4.11**: Show upgrade prompt for premium tools without access ✓

## Installation

The component is already integrated into the learner-dashboard widget. Import it from:

```typescript
import { CareerAITools } from '@/widgets/learner-dashboard/ui';
```

## Usage

### Basic Example

```tsx
import { CareerAITools } from '@/widgets/learner-dashboard/ui';
import { CAREER_TOOLS } from '@/entities/opportunity/model/types';

function Dashboard() {
  const handleToolSelect = (toolId: string) => {
    console.log('Tool selected:', toolId);
  };

  return (
    <CareerAITools
      tools={CAREER_TOOLS}
      onToolSelect={handleToolSelect}
      userAccess={{
        hasAIAccess: true,
        remainingCredits: 10,
        planType: 'pro'
      }}
    />
  );
}
```

### With Free User (Limited Access)

```tsx
<CareerAITools
  tools={CAREER_TOOLS}
  onToolSelect={handleToolSelect}
  userAccess={{
    hasAIAccess: false,
    planType: 'free'
  }}
/>
```

When a free user clicks on a premium tool (Resume Review, Interview Prep, or Career Advice), they will see an upgrade prompt instead of navigating to the tool.

### Custom Tools Subset

```tsx
// Show only assessment tools
const assessmentTools = CAREER_TOOLS.filter(t => t.category === 'assessment');

<CareerAITools
  tools={assessmentTools}
  onToolSelect={handleToolSelect}
  userAccess={{
    hasAIAccess: true,
    remainingCredits: 5,
    planType: 'pro'
  }}
/>
```

## Props

### `CareerAIToolsProps`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tools` | `CareerTool[]` | Yes | Array of career tools to display (use `CAREER_TOOLS` constant) |
| `onToolSelect` | `(toolId: string) => void` | Yes | Callback fired when a tool is selected |
| `userAccess` | `UserAccessInfo` | Yes | User's access level and subscription information |

### `UserAccessInfo`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `hasAIAccess` | `boolean` | Yes | Whether user has access to premium AI tools |
| `remainingCredits` | `number` | No | Number of AI tool credits remaining (displayed as badge) |
| `planType` | `string` | Yes | User's subscription plan ('free', 'pro', 'enterprise') |

### `CareerTool`

Each tool in the `tools` array should have:

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier (e.g., 'skill-gap') |
| `name` | `string` | Display name (e.g., 'Skill Gap Analysis') |
| `description` | `string` | Brief description of the tool |
| `icon` | `string` | Icon identifier ('target', 'document', 'chat', etc.) |
| `category` | `'assessment' \| 'preparation' \| 'guidance'` | Tool category |
| `requiresSubscription` | `boolean` | Whether tool requires premium access |
| `path` | `string` | Navigation route (e.g., '/learner/career-ai/skill-gap') |
| `estimatedTime` | `string` (optional) | Time estimate (e.g., '10 mins') |

## Career Tools Available

The widget displays 7 AI-powered tools by default (from `CAREER_TOOLS` constant):

### Free Tools (No Subscription Required)
1. **Skill Gap Analysis** - Identify skills needed for target career
2. **Learning Path** - Get personalized learning recommendations
3. **Networking Tips** - Build professional network strategies
4. **Career Guidance** - Explore career paths aligned with skills

### Premium Tools (Subscription Required)
5. **Resume Review** - AI-powered resume feedback
6. **Interview Prep** - Practice interview questions with AI
7. **Career Advice** - Personalized career coaching

## Styling

The component uses Tailwind CSS and integrates with the existing design system:

- **Colors**: Purple/Indigo gradient theme
- **Layout**: Responsive grid with CSS Grid
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React icon library
- **Components**: Uses shared `Card` and `Badge` components

### Category Colors

- **Assessment**: Blue (`bg-blue-100`, `text-blue-700`)
- **Preparation**: Purple (`bg-purple-100`, `text-purple-700`)
- **Guidance**: Indigo (`bg-indigo-100`, `text-indigo-700`)

## Behavior

### Access Control Flow

1. User clicks on a tool
2. Component calls `onToolSelect(toolId)` callback
3. Component checks `requiresSubscription` AND `userAccess.hasAIAccess`
4. **If access granted**: Navigate to tool path via `react-router-dom`
5. **If access denied**: Show upgrade prompt modal

### Upgrade Prompt

When a user without premium access clicks a premium tool, a modal appears with:

- Crown icon and "Premium Feature" heading
- Tool name and upgrade message
- List of premium benefits
- Two action buttons:
  - "Maybe Later" - Closes the modal
  - "Upgrade Now" - Navigates to `/learner/subscription`

### Analytics Tracking

The component automatically tracks tool clicks using Google Analytics (gtag) if available:

```javascript
gtag('event', 'career_tool_click', {
  tool_id: 'skill-gap',
  tool_name: 'Skill Gap Analysis',
  has_access: true
});
```

## Responsive Design

The grid layout adapts to screen size:

- **Mobile** (`< 768px`): 1 column
- **Tablet** (`768px - 1023px`): 2 columns  
- **Desktop** (`>= 1024px`): 3 columns

## Accessibility

- Semantic HTML with proper heading hierarchy
- Clickable cards with cursor pointer
- Color indicators supplemented with icons (Crown/Lock)
- Focus states for keyboard navigation
- High contrast text for readability

## Testing

Comprehensive unit tests are available in `CareerAITools.test.tsx` covering:

- Grid layout rendering (34 tests, 100% passing)
- Tool card display
- Premium indicators
- Access control logic
- Navigation behavior
- Upgrade prompt functionality
- Analytics tracking
- Edge cases and error handling

Run tests with:

```bash
npm test -- CareerAITools.test.tsx --run
```

## Examples

See `CareerAITools.example.tsx` for additional usage examples including:

- Basic usage with full access
- Free user with limited access
- Pro user with credits
- Custom tools subset
- Enterprise user
- Analytics integration
- Dashboard integration
- Mobile-optimized view

## Troubleshooting

### Tools not appearing

Ensure you're importing and passing the `CAREER_TOOLS` constant:

```typescript
import { CAREER_TOOLS } from '@/entities/opportunity/model/types';
```

### Upgrade prompt not showing

Check that:
1. The tool has `requiresSubscription: true`
2. `userAccess.hasAIAccess` is `false`
3. You're clicking on a premium tool (Resume Review, Interview Prep, Career Advice)

### Navigation not working

Verify:
1. Component is wrapped in `<BrowserRouter>` or similar router context
2. Routes are properly defined in your routing configuration
3. `onToolSelect` callback is provided

### Credits badge not visible

The credits badge only appears when:
- `userAccess.hasAIAccess` is `true` AND
- `userAccess.remainingCredits` is defined (not `undefined`)

## Architecture

### File Structure

```
src/widgets/learner-dashboard/ui/
├── CareerAITools.tsx          # Main component
├── CareerAITools.test.tsx     # Unit tests (34 tests)
├── CareerAITools.example.tsx  # Usage examples
└── CareerAITools.README.md    # This file
```

### Dependencies

- `react` - Core React library
- `react-router-dom` - Navigation (`useNavigate`)
- `framer-motion` - Animations
- `lucide-react` - Icon library
- `@/shared/ui/Card` - Card component
- `@/shared/ui/Badge` - Badge component
- `@/shared/lib/utils` - Utility functions (cn)
- `@/entities/opportunity/model/types` - CAREER_TOOLS constant

### Type Definitions

Types are defined in:
- `src/widgets/learner-dashboard/model/types.ts` - `CareerAIToolsProps`
- `src/entities/opportunity/model/types.ts` - `CareerTool`, `CAREER_TOOLS`

## Related Components

- **StudentProfileCard** - Student profile with enrollability score
- **AchievementStats** - Streak, badges, certificates
- **LearningMetrics** - Course statistics
- **SkillPassportCard** - Skill health breakdown
- **OpportunitiesWidget** - Job opportunities with AI matching

## Maintenance

### Adding a New Tool

To add a new career tool:

1. Update `CAREER_TOOLS` constant in `src/entities/opportunity/model/types.ts`:

```typescript
{
  id: 'new-tool',
  name: 'New Tool',
  description: 'Description of new tool',
  icon: 'star', // lucide-react icon name
  category: 'guidance',
  requiresSubscription: false,
  path: '/learner/career-ai/new-tool',
  estimatedTime: '5 mins'
}
```

2. Add the icon to `TOOL_ICONS` mapping in `CareerAITools.tsx` if using a new icon
3. Create the tool route in your routing configuration
4. Update tests if necessary

### Modifying Access Control

Access control logic is in the `handleToolClick` function. To customize:

```typescript
const handleToolClick = (toolId: string, toolPath: string, requiresSubscription: boolean) => {
  // Add custom logic here
  if (requiresSubscription && !userAccess.hasAIAccess) {
    // Show upgrade prompt
    return;
  }
  
  // Navigate to tool
  navigate(toolPath);
};
```

## License

Part of the SkillPassport college dashboard redesign project.

## Support

For issues or questions about this component, refer to:
- Design document: `.kiro/specs/college-dashboard-redesign/design.md`
- Requirements: `.kiro/specs/college-dashboard-redesign/requirements.md`
- Tasks: `.kiro/specs/college-dashboard-redesign/tasks.md`
