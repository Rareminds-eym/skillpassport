import { TourStep } from '../types';

/**
 * AFTER-12 Assessment Result Tour Configuration
 * 
 * Independent tour system for Grade 12+ students
 * Flow: Welcome → Navigation → Summary → Programs → Auto-switch → Career Tracks
 * 
 * CRITICAL: Completely isolated from AFTER-10 tour
 */

export const AFTER12_TOUR_STEPS: TourStep[] = [
  // Step 1: Welcome
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🎉 Your Assessment Results Are Ready!
        </h3>
        <p className="text-gray-600 mb-3">
          Congratulations on completing your assessment! Your personalized career insights
          are now ready. Let's explore your recommended degree programs and career paths.
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

  // Step 2: Navigation Overview
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

  // Step 3: AI Summary
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

  // Step 4: Top 3 Recommended Programs
  {
    target: '[data-tour="recommended-programs"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🎓 Top 3 Recommended Programs
        </h3>
        <p className="text-gray-600 mb-3">
          These are your <strong>best-fit degree programs</strong> based on your assessment results.
          Each program shows match scores, why it fits you, career roles, top universities, and more.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          💡 Click "Next" to automatically switch to Career Recommendations and explore career tracks!
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    spotlightClicks: false,
    spotlightPadding: 15,
    styles: {
      tooltip: {
        width: '460px',
      },
      spotlight: {
        borderRadius: '16px',
      },
    },
  },

  // Step 5: Career Track 1 - Best Fit
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

  // Step 6: Career Track 2 - Strong Alternative
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

  // Step 7: Career Track 3 - Worth Exploring
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

  // Step 8: Tour Complete
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

export const AFTER12_TOUR_OPTIONS = {
  continuous: true,
  showProgress: true,
  showSkipButton: true,
  disableOverlayClose: true,
  disableCloseOnEsc: false,
  hideCloseButton: true,
  scrollToFirstStep: true,
  scrollDuration: 800,
  scrollOffset: 120,
  spotlightPadding: 10,
};

export const AFTER12_TOUR_STYLES = {
  options: {
    primaryColor: '#2563eb',
    width: 380,
    zIndex: 90,
  },
  tooltip: {
    borderRadius: 12,
    fontSize: 14,
    padding: 20,
    zIndex: 95,
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
    whiteSpace: 'pre-line' as const,
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
    zIndex: 85,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 80,
  }
};

export const AFTER12_TOUR_LOCALE = {
  back: 'Back',
  close: 'Close',
  last: 'Explore Results',
  next: 'Next',
  skip: 'Skip Tour',
};
