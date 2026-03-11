# Design Document: Digital Passport Profile Completion Prompt

## Overview

This design document outlines the technical approach for implementing a profile completion prompt feature in the Digital Passport system. The feature will detect incomplete profile sections, display a themed modal to prompt users, and persist user preferences. The implementation will integrate seamlessly with the existing React/TypeScript codebase, leveraging existing hooks for data fetching and the ThemeContext for styling consistency.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PassportPage Component                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         useProfileCompletionPrompt Hook              │  │
│  │  - Fetches student data                              │  │
│  │  - Checks profile completeness                       │  │
│  │  - Manages modal visibility                          │  │
│  │  - Handles user preferences                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      ProfileCompletionModal Component                │  │
│  │  - Displays incomplete sections                      │  │
│  │  - Provides action buttons                           │  │
│  │  - Adapts to theme                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Dependencies                     │
│  - PortfolioContext (student data)                          │
│  - ThemeContext (light/dark mode)                           │
│  - localStorage (user preferences)                          │
│  - react-hot-toast (notifications)                          │
│  - framer-motion (animations)                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
PassportPage
├── useProfileCompletionPrompt (custom hook)
│   ├── usePortfolio (existing hook)
│   ├── useTheme (existing hook)
│   └── localStorage operations
└── ProfileCompletionModal
    ├── Modal backdrop
    ├── Modal content
    │   ├── Header
    │   ├── Incomplete sections list
    │   └── Action buttons
    └── Animations (framer-motion)
```

## Components and Interfaces

### 1. ProfileCompletionModal Component

**Purpose:** Display a modal dialog showing incomplete profile sections with action buttons.

**Props Interface:**
```typescript
interface ProfileCompletionModalProps {
  isOpen: boolean;
  incompleteSections: string[];
  onComplete: () => void;
  onSkip: () => void;
  onNeverShow: () => void;
  onClose: () => void;
}
```

**Responsibilities:**
- Render modal with backdrop
- Display list of incomplete sections
- Provide three action buttons
- Handle click outside to close
- Handle Escape key to close
- Apply theme-aware styling
- Animate entrance and exit

**Theme Styling:**
- Light mode: White background, gray text, blue accents
- Dark mode: Dark gray background, light text, blue accents
- Uses Tailwind CSS classes with `dark:` prefix

### 2. useProfileCompletionPrompt Hook

**Purpose:** Manage the logic for profile completeness checking and modal state.

**Return Interface:**
```typescript
interface UseProfileCompletionPromptReturn {
  showModal: boolean;
  incompleteSections: string[];
  handleComplete: () => void;
  handleSkip: () => void;
  handleNeverShow: () => void;
  handleClose: () => void;
}
```

**Internal Logic:**
1. Fetch student data from PortfolioContext
2. Check each profile section for completeness
3. Read user preference from localStorage
4. Determine if modal should be shown
5. Provide handlers for user actions
6. Update localStorage when needed
7. Log operations in development mode

### 3. Profile Completeness Checker

**Purpose:** Analyze student data to identify incomplete sections.

**Function Signature:**
```typescript
function checkProfileCompleteness(student: Student | null): {
  incompleteSections: string[];
  isComplete: boolean;
}
```

**Section Checks:**
- **Personal Info**: Check if name, email, contact_number, and location exist
- **Education**: Check if profile.education array has entries
- **Skills**: Check if profile.skills array has entries
- **Languages**: Check if profile.languages array has entries
- **Projects**: Check if profile.projects array has entries
- **Achievements**: Check if profile.achievements array has entries
- **Hobbies**: Check if profile.hobbies array has entries
- **Interests**: Check if profile.interests array has entries

**Return Value:**
- Array of section names that are incomplete
- Boolean indicating if profile is fully complete

## Data Models

### Student Data Structure (from PortfolioContext)

```typescript
interface Student {
  id: string;
  name: string;
  email: string;
  contact_number?: string;
  city?: string;
  state?: string;
  country?: string;
  district_name?: string;
  school_id?: string;
  college_id?: string;
  grade?: string;
  section?: string;
  branch_field?: string;
  approval_status: 'approved' | 'pending' | 'rejected';
  profile: {
    profileImage?: string;
    passportId?: string;
    education?: Education[];
    skills?: Skill[];
    languages?: (string | Language)[];
    projects?: Project[];
    achievements?: Achievement[];
    certifications?: Certification[];
    hobbies?: string[];
    interests?: string[];
  };
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  field: string;
  startDate: string;
  endDate?: string;
  grade?: string;
}

interface Skill {
  name: string;
  level: string;
  category?: string;
}

interface Language {
  name: string;
  proficiency: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  technologies?: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}
```

### User Preference Storage

**localStorage Key:** `digitalPassport_completionPrompt_dismissed_${userId}`

**Value:** `"true"` or `"false"` (string)

**Purpose:** Store whether the user has permanently dismissed the prompt

## Data Flow

### 1. Initial Load Flow

```
User navigates to Digital Passport
         │
         ▼
PassportPage component mounts
         │
         ▼
useProfileCompletionPrompt hook executes
         │
         ├─► Fetch student data from PortfolioContext
         │
         ├─► Check localStorage for dismissal preference
         │
         ├─► Run profile completeness check
         │
         └─► Determine if modal should show
                  │
                  ▼
         If should show: setShowModal(true)
                  │
                  ▼
         ProfileCompletionModal renders
```

### 2. User Action Flow

```
User clicks action button
         │
         ├─► "Complete Now"
         │        │
         │        ├─► Close modal
         │        └─► Keep user on page
         │
         ├─► "Skip for now"
         │        │
         │        └─► Close modal (no preference change)
         │
         └─► "Never show this again"
                  │
                  ├─► Close modal
                  └─► Save dismissal to localStorage
```

### 3. Profile Update Flow

```
User updates profile section
         │
         ▼
Update handler called
         │
         ├─► Save data to backend
         │
         ├─► Show toast notification
         │
         └─► Re-run completeness check (optional)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Profile completeness check identifies all incomplete sections

*For any* student profile data, when the completeness check runs, all sections that are empty or missing should be included in the returned incomplete sections list.

**Validates: Requirements 1.2, 1.5**

### Property 2: Profile completeness check identifies all complete sections

*For any* student profile data, when the completeness check runs, sections that contain data should NOT be included in the incomplete sections list.

**Validates: Requirements 1.3**

### Property 3: Modal displays when user has not dismissed and profile is incomplete

*For any* user without a dismissal preference stored in localStorage and with an incomplete profile, the modal should be displayed when the Digital Passport page loads.

**Validates: Requirements 2.2, 2.4**

### Property 4: Modal does not display when user has dismissed permanently

*For any* user with a dismissal preference set to "true" in localStorage, the modal should NOT be displayed regardless of profile completeness.

**Validates: Requirements 2.3**

### Property 5: Modal lists all incomplete sections

*For any* set of incomplete profile sections, when the modal is displayed, all incomplete section names should appear in the modal's list.

**Validates: Requirements 3.2**

### Property 6: Modal styling adapts to theme mode

*For any* theme mode (light or dark), the modal's CSS classes should include the appropriate theme-specific classes.

**Validates: Requirements 3.3**

### Property 7: Complete Now button closes modal without preference change

*For any* modal state, when the "Complete Now" button is clicked, the modal should close and no value should be written to localStorage.

**Validates: Requirements 4.4**

### Property 8: Skip button closes modal without preference change

*For any* modal state, when the "Skip for now" button is clicked, the modal should close and no value should be written to localStorage.

**Validates: Requirements 4.5**

### Property 9: Never show again button stores dismissal preference

*For any* user, when the "Never show this again" button is clicked, the value "true" should be stored in localStorage with a user-specific key.

**Validates: Requirements 4.6, 5.1**

### Property 10: Dismissal preference is user-specific

*For any* two different users, their dismissal preference keys in localStorage should be different and include their respective user IDs.

**Validates: Requirements 5.5**

### Property 11: Page load checks localStorage for preference

*For any* page load of the Digital Passport, the system should query localStorage for the dismissal preference before deciding to show the modal.

**Validates: Requirements 2.1, 5.3**

### Property 12: Profile updates trigger toast notifications

*For any* profile section update, a toast notification should be displayed using react-hot-toast.

**Validates: Requirements 6.1**

### Property 13: Toast notifications adapt to theme

*For any* theme mode, toast notifications should use styling that matches the current theme.

**Validates: Requirements 6.4**

### Property 14: Completeness check runs on page load

*For any* Digital Passport page load, the profile completeness check function should be executed.

**Validates: Requirements 8.2**

### Property 15: Check completes before modal display

*For any* page load, the profile completeness check should finish execution and return results before the modal visibility state is set.

**Validates: Requirements 8.3**

## Error Handling

### 1. Missing Student Data

**Scenario:** Student data fails to load from PortfolioContext

**Handling:**
- Check if `student` is null or undefined
- If null, do not show modal
- Log error in development mode
- Gracefully degrade: assume profile is complete to avoid false prompts

### 2. localStorage Access Errors

**Scenario:** localStorage is unavailable (private browsing, quota exceeded)

**Handling:**
- Wrap localStorage operations in try-catch blocks
- If read fails, assume preference is not set (show modal)
- If write fails, log error in development mode
- Continue execution without crashing

### 3. Invalid Student Data Structure

**Scenario:** Student data has unexpected structure or missing fields

**Handling:**
- Use optional chaining (`?.`) when accessing nested properties
- Provide default values (empty arrays) for missing sections
- Validate data structure before processing
- Log warnings in development mode

### 4. Theme Context Unavailable

**Scenario:** ThemeContext is not available or returns undefined

**Handling:**
- Default to light theme styling
- Log warning in development mode
- Modal should still function with default styling

### 5. Modal Rendering Errors

**Scenario:** Modal component throws error during render

**Handling:**
- Wrap modal in error boundary
- Log error details
- Fail gracefully: hide modal and allow page to function
- Show fallback UI if possible

## Testing Strategy

### Unit Testing

**Focus Areas:**
- Profile completeness checker function with various data inputs
- localStorage read/write operations
- User action handlers (complete, skip, never show)
- Theme class application logic
- Development mode logging conditionals

**Example Unit Tests:**
- Test completeness checker with empty profile (all sections incomplete)
- Test completeness checker with fully complete profile
- Test completeness checker with partially complete profile
- Test localStorage key generation with different user IDs
- Test modal close handlers update state correctly
- Test theme classes are applied based on theme prop

### Property-Based Testing

**Configuration:**
- Use a property-based testing library for TypeScript (e.g., fast-check)
- Run minimum 100 iterations per property test
- Tag each test with feature name and property number

**Property Tests:**
- **Property 1**: Generate random student profiles, verify incomplete sections are correctly identified
- **Property 2**: Generate random complete sections, verify they're not flagged as incomplete
- **Property 3**: Generate random user states, verify modal shows when appropriate
- **Property 9**: Generate random user IDs, verify localStorage writes with correct keys
- **Property 10**: Generate pairs of user IDs, verify keys are unique
- **Property 12**: Generate random profile updates, verify toasts are triggered

**Test Tags Format:**
```typescript
// Feature: digital-passport-profile-completion-prompt, Property 1: Profile completeness check identifies all incomplete sections
```

### Integration Testing

**Focus Areas:**
- Modal display on page load with various data states
- User interactions with all three buttons
- Theme switching while modal is open
- localStorage persistence across component remounts
- Toast notifications appearing after profile updates

**Example Integration Tests:**
- Load page with incomplete profile, verify modal appears
- Load page with dismissal preference, verify modal does not appear
- Click "Never show this again", reload page, verify modal stays hidden
- Switch theme while modal is open, verify styling updates
- Update profile section, verify toast appears

### Manual Testing Checklist

- [ ] Navigate to Digital Passport with incomplete profile
- [ ] Verify modal appears with correct incomplete sections listed
- [ ] Click "Complete Now" and verify modal closes
- [ ] Reload page and verify modal appears again
- [ ] Click "Skip for now" and verify modal closes
- [ ] Reload page and verify modal appears again
- [ ] Click "Never show this again" and verify modal closes
- [ ] Reload page and verify modal does NOT appear
- [ ] Clear localStorage and verify modal appears again
- [ ] Test in light mode and verify styling
- [ ] Test in dark mode and verify styling
- [ ] Switch theme while modal is open
- [ ] Update a profile section and verify toast appears
- [ ] Test on mobile viewport
- [ ] Test keyboard navigation (Tab, Escape)
- [ ] Test clicking outside modal to close
- [ ] Open browser console and verify dev logs appear (in dev mode)
- [ ] Build for production and verify no console logs

## Implementation Notes

### Development Mode Detection

Use environment variable to detect development mode:

```typescript
const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
```

### localStorage Key Format

```typescript
const STORAGE_KEY = `digitalPassport_completionPrompt_dismissed_${userId}`;
```

### Theme Class Application

Use Tailwind's `dark:` prefix for dark mode styles:

```typescript
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
```

### Animation Configuration

Use framer-motion for smooth animations:

```typescript
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};
```

### Toast Configuration

Configure react-hot-toast with theme awareness:

```typescript
toast.success('Profile updated!', {
  style: {
    background: theme === 'dark' ? '#374151' : '#ffffff',
    color: theme === 'dark' ? '#f3f4f6' : '#111827',
  },
});
```

## Performance Considerations

### 1. Memoization

- Memoize profile completeness check results to avoid recalculation
- Use `useMemo` for expensive computations
- Cache incomplete sections list

### 2. Lazy Loading

- Modal component can be lazy loaded if not immediately needed
- Consider code splitting for modal component

### 3. Debouncing

- If profile updates trigger re-checks, debounce the check function
- Avoid excessive localStorage reads/writes

### 4. Render Optimization

- Use `React.memo` for modal component if it receives stable props
- Avoid unnecessary re-renders when modal is not visible

## Security Considerations

### 1. localStorage Data

- Store only boolean preference, no sensitive data
- Validate data read from localStorage before use
- Handle malicious or corrupted localStorage data gracefully

### 2. XSS Prevention

- Sanitize any user-generated content displayed in modal
- Use React's built-in XSS protection (JSX escaping)
- Avoid dangerouslySetInnerHTML

### 3. User Privacy

- Preference is stored locally, not sent to server
- No tracking of user dismissal actions
- User can clear preference by clearing browser data

## Accessibility

### 1. Keyboard Navigation

- Modal should be keyboard accessible
- Tab order should be logical (buttons in order)
- Escape key should close modal
- Focus should trap within modal when open

### 2. Screen Readers

- Modal should have appropriate ARIA labels
- Use `role="dialog"` and `aria-modal="true"`
- Announce modal content to screen readers
- Provide descriptive button labels

### 3. Focus Management

- Focus should move to modal when it opens
- Focus should return to trigger element when modal closes
- First focusable element should receive focus

### 4. Color Contrast

- Ensure sufficient contrast in both light and dark modes
- Test with accessibility tools (axe, Lighthouse)
- Provide visual indicators beyond color alone

## Future Enhancements

### 1. Progress Indicator

- Show percentage of profile completion
- Visual progress bar in modal

### 2. Section-Specific Actions

- Allow users to jump directly to incomplete sections
- Provide "Complete this section" links

### 3. Reminder Frequency

- Instead of "never show", offer "remind me later" options
- Allow users to set reminder intervals

### 4. Gamification

- Award badges for profile completion milestones
- Show completion streaks

### 5. Smart Prompting

- Only prompt for sections relevant to user's grade level
- Prioritize important sections over optional ones
