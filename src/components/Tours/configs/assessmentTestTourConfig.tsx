import { TourStep } from '../types';

/**
 * Assessment Test Tour Configuration
 * Contains all steps, content, and styling for the assessment test guidance tour
 */

/**
 * Generate dynamic tour steps based on actual section count
 */
export const getAssessmentTestTourSteps = (sectionCount?: number): TourStep[] => {
  // Get actual section count from DOM if not provided
  // Count the numbered circles (they have the step number as text content)
  let actualSectionCount = sectionCount;
  
  if (!actualSectionCount) {
    const progressContainer = document.querySelector('[data-tour="section-progress"]');
    if (progressContainer) {
      // Count circles that have numbers (1, 2, 3, etc.) or checkmarks
      const circles = progressContainer.querySelectorAll('.w-8.h-8.rounded-full');
      actualSectionCount = circles.length;
    }
  }
  
  // Default to 6 if still not found
  actualSectionCount = actualSectionCount || 6;
  
  return [
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🧠 Assessment Test Guide
        </h3>
        <p className="text-gray-600 mb-3">
          Welcome to your comprehensive career assessment! This test will help us understand 
          your interests, personality, and strengths to provide personalized career recommendations.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Let's quickly walk through how the assessment works.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    styles: {
      tooltip: {
        width: '450px',
      },
    },
  },
  {
    target: '[data-tour="section-progress"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Assessment Sections Overview
        </h3>
        <p className="text-gray-600">
          This shows your progress through the {actualSectionCount} assessment sections. Each section evaluates different aspects of your career profile, including interests, personality, values, skills, and aptitudes.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightClicks: false,
    spotlightPadding: 10,
    styles: {
      tooltip: {
        width: '450px',
      },
      spotlight: {
        borderRadius: '12px',
      },
    },
  },
  {
   target: '[data-tour="section-info"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Section & Question Progress
        </h3>
        <p className="text-gray-600">
          Here you can see which section you're currently in and your progress within that section. This helps you track your progress through each assessment phase.
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: false,
    styles: {
      tooltip: {
        width: '400px',
      },
    },
  },
  {
    target: '[data-tour="timer-display"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Time Tracking
        </h3>
        <p className="text-gray-600">
          The timer shows how long you've been working on the current section. Don't worry, there's no time pressure. Take your time to answer thoughtfully and honestly.
        </p>
      </div>
    ),
    placement: 'top',
    spotlightClicks: false,
    styles: {
      tooltip: {
        width: '400px',
      },
    },
  },
  {
    target: '[data-tour="question-content"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Question Text
        </h3>
        <p className="text-gray-600">
          Read each question carefully. This shows the activity or statement you need to rate. Answer based on your genuine preferences and feelings, not what you think sounds "correct".
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: false,
    spotlightPadding: 10,
    styles: {
      tooltip: {
        width: '400px',
      },
      spotlight: {
        borderRadius: '8px',
      },
    },
  },
  {
    target: '[data-tour="answer-options"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Response Options
        </h3>
        <p className="text-gray-600">
          Choose from the available response options. Be honest in your responses. This assessment works best when you answer based on your genuine preferences and feelings, not what you think sounds "correct".
        </p>
      </div>
    ),
    placement: 'left',
    spotlightClicks: true,
    spotlightPadding: 15,
    styles: {
      tooltip: {
        width: '420px',
      },
      spotlight: {
        borderRadius: '16px',
      },
    },
  },
  {
    target: '[data-tour="navigation-controls"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Navigation Controls
        </h3>
        <p className="text-gray-600">
          Use these buttons to move between questions. You can go back to review previous answers or move forward once you've selected a response. The "Next" button will be enabled after answering the current question.
        </p>
      </div>
    ),
    placement: 'top',
    spotlightClicks: false,
    styles: {
      tooltip: {
        width: '400px',
      },
    },
  },
  {
    target: '[data-tour="progress-percentage"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Overall Progress
        </h3>
        <p className="text-gray-600">
          This shows your overall completion percentage across all assessment sections. You're making great progress toward receiving your personalized career insights.
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: false,
    styles: {
      tooltip: {
        width: '420px',
      },
    },
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🎉 Tour Complete - You're Ready!
        </h3>
        <p className="text-gray-600 mb-3">
          Great! You now understand how the assessment works. Remember, there are no right or wrong answers — just honest ones.
        </p>
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-blue-700 font-medium">
            💡 Tips for Best Results:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-600 mt-2 space-y-1">
            <li>Answer based on your genuine preferences, not what sounds "correct"</li>
            <li>Take your time — there's no rush</li>
            <li>You can navigate back to review previous answers</li>
            <li>Your honest responses lead to better career recommendations</li>
          </ul>
        </div>
        <p className="text-sm text-blue-600 font-medium">
          Ready to discover your ideal career path? Let's begin!
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    styles: {
      tooltip: {
        width: '480px',
      },
    },
  },
];
};

// Default export for backward compatibility
export const ASSESSMENT_TEST_TOUR_STEPS = getAssessmentTestTourSteps();

export const ASSESSMENT_TEST_TOUR_OPTIONS = {
  continuous: true,
  showProgress: true,
  showSkipButton: true,
  disableOverlayClose: true,
  disableCloseOnEsc: false,
  hideCloseButton: true, // Remove close button
  scrollToFirstStep: false, // Disable automatic scroll - we handle it manually
  spotlightPadding: 4,
};

export const ASSESSMENT_TEST_TOUR_STYLES = {
  options: {
    primaryColor: '#2563eb', // Blue-600 to match dashboard theme
    width: 380,
    zIndex: 90, // Below header (z-100) but above content
  },
  tooltip: {
    borderRadius: 12,
    fontSize: 14,
    padding: 20,
    zIndex: 95, // Tooltip should be above overlay but below header
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: 8,
  },
  tooltipContent: {
    fontSize: 14,
    lineHeight: 1.5,
    color: '#374151',
    whiteSpace: 'pre-line' as const, // This allows \n to create line breaks
  },
  buttonNext: {
    backgroundColor: '#3B82F6',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    pointerEvents: 'auto',
  },
  buttonBack: {
    backgroundColor: 'transparent',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    color: '#6B7280',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    cursor: 'pointer',
    marginRight: '8px',
    transition: 'all 0.2s',
  },
  buttonSkip: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: 500,
  },
  spotlight: {
    borderRadius: 8,
    zIndex: 85, // Spotlight should be behind tooltip but above overlay
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 80, // Overlay should be at the bottom of tour elements
  }
};

export const ASSESSMENT_TEST_TOUR_LOCALE = {
  back: 'Back',
  close: 'Close',
  last: 'Start Assessment',
  next: 'Next',
  skip: 'Skip Guide',
};