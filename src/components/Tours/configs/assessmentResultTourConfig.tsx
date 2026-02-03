import { TourStep } from '../types';

/**
 * Assessment Result Tour Configuration
 * Contains all steps, content, and styling for the assessment results explanation tour
 * Updated to use existing data-tour attributes from the assessment result page
 */

export const ASSESSMENT_RESULT_TOUR_STEPS: TourStep[] = [
  // Welcome Step
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🎉 Your Assessment Results Are Ready!
        </h3>
        <p className="text-gray-600 mb-3">
          Congratulations on completing your assessment! Your personalized career insights
          are now ready. Let's explore what your results mean and how to use them effectively.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          This tour will guide you through your results and help you understand your career potential.
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

  // Step 1: Navigation & Actions (using download-report as proxy)
  {
    target: '[data-tour="navigation-actions"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🧭 Navigation & Actions
        </h3>
        <p className="text-gray-600 mb-3">
          Use these navigation and action buttons to manage your assessment results.
          You can go back to your dashboard, download your results as a PDF, or retake the assessment if needed.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          💡 Keep these handy for managing your results and taking next steps.
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

  // Step 2: Report Header (AI-Powered Summary proxy)
  {
    target: '[data-tour="ai-summary"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🤖 AI-Powered Summary
        </h3>
        <p className="text-gray-600 mb-3">
          This is your personalized AI-generated summary based on your complete assessment.
          It provides key insights about your personality, interests, and career potential in an easy-to-understand overview.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          💡 This summary captures the essence of your assessment results in a digestible format.
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: false,
    styles: {
      tooltip: {
        width: '440px',
      },
    },
  },

  // Step 3: Career Track 1 - Best Fit
  {
    target: '[data-tour="career-track-1"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🥇 Track 1 – Your Best Fit
        </h3>
        <p className="text-gray-600 mb-3">
          This is your <strong>top career match</strong> based on your interests, personality, and strengths.
          Careers in this track align most closely with your assessment results.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          💡 Click this track to explore roles, salary ranges, and growth opportunities.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightClicks: true,
    spotlightPadding: 15,
    styles: {
      tooltip: {
        width: '440px',
      },
      spotlight: {
        borderRadius: '16px',
      },
    },
  },
  // Step 4: Career Track 2 - Strong Alternative
  {
    target: '[data-tour="career-track-2"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🥈 Track 2 – Strong Alternative
        </h3>
        <p className="text-gray-600 mb-3">
          This track represents a <strong>strong alternative career path</strong>.
          While not your top match, these careers still align well with your profile and offer solid opportunities.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          💡 Consider this as a backup or complementary career option.
        </p>
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
    spotlightClicks: true,
    spotlightPadding: 15,
    styles: {
      tooltip: {
        width: '440px',
      },
      spotlight: {
        borderRadius: '16px',
      },
    },
  },
  // Step 5: Career Track 3 - Worth Exploring
  {
    target: '[data-tour="career-track-3"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🥉 Track 3 – Worth Exploring
        </h3>
        <p className="text-gray-600 mb-3">
          These career paths are <strong>worth exploring</strong> for the future.
          They may require additional skill development or represent emerging opportunities.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          💡 Ideal for long-term planning and career exploration.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
    spotlightClicks: true,
    spotlightPadding: 15,
    styles: {
      tooltip: {
        width: '440px',
      },
      spotlight: {
        borderRadius: '16px',
      },
    },
  },


  // Tour Complete
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🚀 Ready to Launch Your Career Journey!
        </h3>
        <p className="text-gray-600 mb-3">
          You now have a comprehensive understanding of your assessment results and career tracks.
          Here's how to make the most of these insights:
        </p>
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-blue-700 font-medium mb-2">
            🎯 Recommended Next Steps:
          </p>
          <ol className="list-decimal list-inside text-sm text-blue-600 space-y-1">
            <li>Explore your career tracks in detail - Track 1 is your best match</li>
            <li>Research specific roles, requirements, and salary expectations</li>
            <li>Download your results PDF for future reference</li>
            <li>Update your dashboard profile with relevant skills and interests</li>
            <li>Look for opportunities that align with your recommended tracks</li>
          </ol>
        </div>
        <p className="text-sm text-blue-600 font-medium">
          Remember: These results will enhance your dashboard recommendations and help guide your career decisions!
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

export const ASSESSMENT_RESULT_TOUR_OPTIONS = {
  continuous: true,
  showProgress: true,
  showSkipButton: true,
  disableOverlayClose: true,
  disableCloseOnEsc: false,
  hideCloseButton: true, // Remove close button
  scrollToFirstStep: true,
  scrollDuration: 800,
  scrollOffset: 120,
  spotlightPadding: 10,
};

export const ASSESSMENT_RESULT_TOUR_STYLES = {
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

export const ASSESSMENT_RESULT_TOUR_LOCALE = {
  back: 'Back',
  close: 'Close',
  last: 'Explore Results',
  next: 'Next',
  skip: 'Skip Tour',
};