import { TourConfig } from '../types';

export const assessmentTestTour: TourConfig = {
  id: 'assessment_test_main',
  name: 'Assessment Test Tour',
  steps: [
    // 1. Section Progress Overview
    {
      target: '[data-tour="section-progress"]',
      content: 'This shows your progress through the 6 assessment sections: Career Interests, Big Five Personality, Work Values & Motivators, Employability Skills, Multi-Aptitude, and Stream Knowledge. Each section evaluates different aspects of your career profile.',
      title: 'Assessment Sections Overview',
      placement: 'bottom',
      disableBeacon: true
    },
    // 2. Current Section & Question Info
    {
      target: '[data-tour="section-info"]',
      content: 'Here you can see which section you\'re currently in (Section 1 of 6) and your progress within that section (Question 1 / 48). This helps you track your progress through each assessment phase.',
      title: 'Section & Question Progress',
      placement: 'bottom',
      disableBeacon: true
    },
    // 3. Timer Display
    {
      target: '[data-tour="timer-display"]',
      content: 'The timer shows how long you\'ve been working on the current section. Don\'t worry - there\'s no time pressure! Take your time to answer thoughtfully and honestly.',
      title: 'Time Tracking',
      placement: 'bottom',
      disableBeacon: true
    },
    // 4. Question Content
    {
      target: '[data-tour="question-content"]',
      content: 'This is the main question area. Read each question carefully and select the response that best represents your true feelings or preferences. Remember, there are no right or wrong answers.',
      title: 'Question Area',
      placement: 'left',
      disableBeacon: true
    },
    // 5. Answer Options
    {
      target: '[data-tour="answer-options"]',
      content: 'Choose from the response options (1-5 scale). Be honest in your responses - this assessment works best when you answer based on your genuine preferences and feelings, not what you think sounds "correct".',
      title: 'Response Options',
      placement: 'top',
      disableBeacon: true
    },
    // 6. Navigation Controls
    {
      target: '[data-tour="navigation-controls"]',
      content: 'Use these buttons to navigate between questions. You can go back to review previous answers or move forward once you\'ve selected a response. The "Next" button will be enabled once you answer the current question.',
      title: 'Navigation Controls',
      placement: 'top',
      disableBeacon: true
    },
    // 7. Progress Percentage
    {
      target: '[data-tour="progress-percentage"]',
      content: 'This shows your overall completion percentage across all assessment sections. You\'re making great progress toward getting your personalized career insights!\n\n🎉 You\'re now ready to complete your assessment. Answer honestly and take your time - your future career insights depend on authentic responses!',
      title: 'Overall Progress',
      placement: 'bottom',
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
    styles: {
      options: {
        primaryColor: '#2563eb',
        width: 400,
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
        borderRadius: 8,
        zIndex: 85,
      },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 80,
      }
    }
  }
};