# Student Onboarding Tours - Configuration System

## 📁 File Structure

```
src/components/Tours/
├── configs/                          # Tour Configuration Files
│   ├── index.ts                     # Configuration exports
│   ├── dashboardTourConfig.tsx      # Dashboard tour config
│   ├── assessmentTestTourConfig.tsx # Assessment test tour config
│   └── assessmentResultTourConfig.tsx # Assessment result tour config
├── StudentDashboardTour.tsx         # Dashboard tour component
├── AssessmentTestTour.tsx          # Assessment test tour component
├── AssessmentResultTour.tsx        # Assessment result tour component
├── TourProvider.tsx                # Context provider
├── types.ts                        # TypeScript interfaces
├── constants.ts                    # Global constants
├── utils.ts                        # Helper functions
├── index.ts                        # Main exports
└── README.md                       # This documentation
```

## 🎯 Configuration System

Each tour has its own dedicated configuration file with four main exports:

### 1. Tour Steps (`TOUR_STEPS`)
Array of step objects defining the tour content and behavior:

```tsx
export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    target: 'body',                    // CSS selector for target element
    content: <JSX.Element>,           // React component for tooltip content
    placement: 'center',              // Tooltip position
    disableBeacon: true,              // Disable animated beacon
    styles: { tooltip: { width: '450px' } }, // Custom styles for this step
  },
  // ... more steps
];
```

### 2. Tour Options (`TOUR_OPTIONS`)
Configuration object for tour behavior:

```tsx
export const DASHBOARD_TOUR_OPTIONS = {
  continuous: true,                   // Auto-advance through steps
  showProgress: true,                 // Show progress indicator
  showSkipButton: true,              // Show skip tour button
  disableOverlayClose: true,         // Prevent closing by clicking overlay
  disableCloseOnEsc: false,          // Allow ESC key to close
  hideCloseButton: false,            // Show close button
  scrollToFirstStep: true,           // Auto-scroll to first step
  spotlightPadding: 4,               // Padding around highlighted element
};
```

### 3. Tour Styles (`TOUR_STYLES`)
Complete styling configuration for the tour:

```tsx
export const DASHBOARD_TOUR_STYLES = {
  options: {
    arrowColor: '#fff',              // Tooltip arrow color
    backgroundColor: '#fff',         // Tooltip background
    overlayColor: 'rgba(0, 0, 0, 0.4)', // Overlay color
    primaryColor: '#3B82F6',         // Primary theme color
    textColor: '#374151',            // Text color
    width: 400,                      // Default tooltip width
    zIndex: 1000,                    // Z-index for layering
  },
  tooltip: {
    borderRadius: '12px',            // Rounded corners
    boxShadow: '...',                // Drop shadow
    fontSize: '14px',                // Base font size
    padding: '20px',                 // Internal padding
  },
  // Button styles, title styles, etc.
};
```

### 4. Tour Locale (`TOUR_LOCALE`)
Text labels for tour controls:

```tsx
export const DASHBOARD_TOUR_LOCALE = {
  back: 'Back',
  close: 'Close',
  last: 'Finish Tour',              // Text for final step button
  next: 'Next',
  skip: 'Skip Tour',
};
```

## 🎨 Theme Customization

Each tour has its own color theme:

- **Dashboard Tour**: Blue theme (`#3B82F6`)
- **Assessment Test Tour**: Green theme (`#059669`)
- **Assessment Result Tour**: Purple theme (`#7C3AED`)

## 📝 Content Guidelines

### Step Content Structure
Each step should include:

```tsx
content: (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      🎯 Step Title with Emoji
    </h3>
    <p className="text-gray-600 mb-3">
      Main explanation paragraph describing what the user is seeing
      and why it's important for their journey.
    </p>
    <p className="text-sm text-blue-600 font-medium">
      💡 Action-oriented tip or next step guidance.
    </p>
  </div>
)
```

### Content Best Practices
- **Clear Titles**: Use descriptive titles with relevant emojis
- **Concise Explanations**: Keep descriptions focused and actionable
- **Student-Friendly Language**: Avoid technical jargon
- **Visual Hierarchy**: Use consistent text sizing and colors
- **Action Guidance**: Include specific next steps or tips

## 🎯 Target Selectors

Use `data-tour` attributes for reliable element targeting:

```tsx
// In component JSX
<Card data-tour="assessment-card" className="...">

// In tour config
{
  target: '[data-tour="assessment-card"]',
  // ...
}
```

### Standard Target Selectors
- `[data-tour="assessment-card"]` - Assessment card
- `[data-tour="opportunities-card"]` - Opportunities card
- `[data-tour="technical-skills-card"]` - Technical skills card
- `[data-tour="projects-card"]` - Projects card
- `[data-tour="education-card"]` - Education card
- `[data-tour="training-card"]` - Training card
- `[data-tour="question-area"]` - Assessment question display
- `[data-tour="answer-options"]` - Answer selection area
- `[data-tour="progress-indicator"]` - Progress tracker
- `[data-tour="navigation-buttons"]` - Navigation controls
- `[data-tour="timer-display"]` - Timer information
- `[data-tour="report-header"]` - Results header
- `[data-tour="career-recommendations"]` - Career suggestions
- `[data-tour="skills-analysis"]` - Skills analysis section
- `[data-tour="learning-roadmap"]` - Learning roadmap
- `[data-tour="download-report"]` - Download button

## 🔧 Adding New Tours

### 1. Create Configuration File
```tsx
// src/components/Tours/configs/newTourConfig.tsx
import React from 'react';
import { TourStep } from '../types';

export const NEW_TOUR_STEPS: TourStep[] = [
  // Define your steps
];

export const NEW_TOUR_OPTIONS = {
  // Define tour options
};

export const NEW_TOUR_STYLES = {
  // Define custom styles
};

export const NEW_TOUR_LOCALE = {
  // Define button labels
};
```

### 2. Create Tour Component
```tsx
// src/components/Tours/NewTour.tsx
import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { useTour } from './TourProvider';
import { TOUR_KEYS } from './constants';
import { waitForElement } from './utils';
import {
  NEW_TOUR_STEPS,
  NEW_TOUR_OPTIONS,
  NEW_TOUR_STYLES,
  NEW_TOUR_LOCALE,
} from './configs';

const NewTour: React.FC = () => {
  // Implementation similar to existing tours
};

export default NewTour;
```

### 3. Update Exports
```tsx
// src/components/Tours/configs/index.ts
export {
  NEW_TOUR_STEPS,
  NEW_TOUR_OPTIONS,
  NEW_TOUR_STYLES,
  NEW_TOUR_LOCALE,
} from './newTourConfig';

// src/components/Tours/index.ts
export { default as NewTour } from './NewTour';
```

### 4. Add Tour Key
```tsx
// src/components/Tours/constants.ts
export const TOUR_KEYS: Record<string, TourKey> = {
  DASHBOARD: 'dashboard',
  ASSESSMENT_TEST: 'assessment_test',
  ASSESSMENT_RESULT: 'assessment_result',
  NEW_TOUR: 'new_tour', // Add new key
} as const;

// src/components/Tours/types.ts
export type TourKey = 'dashboard' | 'assessment_test' | 'assessment_result' | 'new_tour';
```

## 🧪 Testing Tours

### Reset Tour Progress
```javascript
// In browser console
localStorage.removeItem('student_tour_progress');

// Or update database
UPDATE students SET tour_progress = '{}' WHERE id = 'student_id';
```

### Manual Tour Trigger
```javascript
// Access tour context in component
const { startTour } = useTour();
startTour('dashboard'); // Manually start specific tour
```

## 📊 Analytics & Monitoring

Track tour effectiveness by monitoring:
- Tour completion rates
- Step drop-off points
- Skip vs. complete ratios
- Time spent per step

## 🔒 Security Considerations

- Tour content is static and contains no sensitive data
- User progress is stored securely in database
- Tours can be disabled/skipped at any time
- No external dependencies for tour content

## 🚀 Performance Optimization

- Tours are lazy-loaded only when needed
- Element waiting prevents blocking UI
- Minimal DOM manipulation
- Efficient re-render prevention
- Lightweight configuration system

This configuration system provides maximum flexibility while maintaining consistency across all tours!