import { TourConfig } from '../types';

export const assessmentResultTour: TourConfig = {
  id: 'assessment_result_main',
  name: 'Assessment Result Tour',
  steps: [
    // 1. Navigation & Actions
    {
      target: '[data-tour="navigation-actions"]',
      content: 'Use these navigation and action buttons to manage your assessment results. You can go back to your dashboard, download your results as a PDF, or retake the assessment if needed.',
      title: 'Navigation & Actions',
      placement: 'bottom',
      disableBeacon: true
    },
    // 2. AI Summary
    {
      target: '[data-tour="ai-summary"]',
      content: 'This is your personalized AI-generated summary based on your complete assessment. It provides key insights about your personality, interests, and career potential in an easy-to-understand overview.',
      title: 'AI-Powered Summary',
      placement: 'bottom',
      disableBeacon: true
    },
    // 3. Track 1 - Best Fit Career
    {
      target: '[data-tour="career-track-1"]',
      content: '**Track 1** is your best career fit based on your assessment results. This track shows careers that align most closely with your interests, personality, and strengths. Click on the track to explore specific roles, salary ranges, and growth opportunities.',
      title: 'Track 1 - Your Best Fit',
      placement: 'right',
      disableBeacon: true
    },
    // 4. Track 2 - Strong Alternative
    {
      target: '[data-tour="career-track-2"]',
      content: '**Track 2** represents a strong alternative career path. While not your top match, this track offers excellent opportunities that still align well with your profile. Consider exploring these options as backup or complementary career choices.',
      title: 'Track 2 - Strong Alternative',
      placement: 'left',
      disableBeacon: true
    },
    // 5. Track 3 - Worth Exploring
    {
      target: '[data-tour="career-track-3"]',
      content: '**Track 3** shows additional career paths worth exploring. These careers may require some skill development or represent emerging opportunities in your areas of interest. Great for long-term career planning and exploration.',
      title: 'Track 3 - Worth Exploring',
      placement: 'right',
      disableBeacon: true
    }
  ],
  options: {
    continuous: true,
    showProgress: true,
    showSkipButton: true,
    spotlightClicks: false,
    disableOverlayClose: false,
    hideCloseButton: true,
    // Scrolling configuration - reduce aggressive scrolling
    scrollToFirstStep: true,
    scrollOffset: 10, // Reduced offset to prevent over-scrolling
    disableScrolling: false, // Keep scrolling enabled but controlled
    disableScrollParentFix: true, // Disable scroll parent fix to prevent issues
    styles: {
      options: {
        primaryColor: '#2563eb',
        width: 420,
        zIndex: 1000,
      },
      tooltip: {
        borderRadius: 12,
        fontSize: 14,
        padding: 20,
        zIndex: 1005,
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
        backgroundColor: '#2563eb',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        padding: '10px 20px',
      },
      buttonBack: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: 500,
        marginRight: 'auto',
      },
      buttonSkip: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: 500,
      },
      spotlight: {
        borderRadius: 12,
        zIndex: 50, // Lower z-index so it appears behind the career cards
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle white highlight
      },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 40, // Lower than spotlight
      }
    }
  }
};