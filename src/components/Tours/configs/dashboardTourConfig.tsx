import { TourStep } from '../types';

/**
 * Student Dashboard Tour Configuration - Professional Solution
 * Contains all steps, content, and styling for the dashboard onboarding tour
 * Features custom scroll management for optimal user experience
 */

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  // Welcome Step
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Welcome to Your Student Dashboard! 🎉
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Let's take a quick tour to help you get the most out of your dashboard.
          This will only take a minute and will show you the key features.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Click "Next" to begin the tour, or "Skip Tour" if you'd prefer to explore on your own.
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

  // Navigation Tour Steps (1-5)
  {
    target: '[data-tour="my-learning-nav"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          My Learning Navigation
        </h3>
        <p className="text-gray-600 mb-3">
          Navigate to your learning section to view courses, training programs, and track your educational progress.
          This is where you manage all your learning activities.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Access your personalized learning dashboard from here.
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="courses-nav"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Courses Navigation
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Access the courses marketplace to discover and enroll in new courses.
          Browse through various categories and find courses that match your interests.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Explore new learning opportunities and expand your skillset.
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="digital-portfolio-nav"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Digital Portfolio Navigation
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Create and manage your professional digital portfolio.
          Showcase your work, projects, and achievements to potential employers.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Build a compelling portfolio that stands out to recruiters.
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="opportunities-nav"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Opportunities Navigation
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Explore job opportunities, internships, and career openings.
          Find positions that match your skills and career goals.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Discover your next career opportunity with AI-powered matching.
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="career-ai-nav"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Career AI Navigation
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Get personalized career guidance from our AI assistant.
          Ask questions about career paths, skill development, and job search strategies.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Your personal AI career coach is always ready to help.
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: true,
    styles: {
      tooltip: {
      },
    },
  },

  // Dashboard/Analytics Tabs (6-7) - Professional scroll management
  {
    target: '[data-tour="dashboard-tab"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Dashboard View
        </h3>
        <p className="text-gray-600 text-md mb-3">
          The Dashboard view shows your complete profile overview with all sections organized in an easy-to-navigate grid.
          This is your main hub for managing your professional profile.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Your central command center for profile management.
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
    floaterProps: {
      disableAnimation: false,
      hideArrow: false,
      placement: 'bottom',
      offset: 15,
      options: {
        preventOverflow: {
          enabled: false,
        },
        flip: {
          enabled: false,
        },
        shift: {
          enabled: false,
        },
      },
    },
  },
  {
    target: '[data-tour="analytics-tab"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Analytics View
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Switch to Analytics view to track your learning progress, performance insights, and career development metrics.
          Monitor your growth over time.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Data-driven insights to guide your career development.
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
    floaterProps: {
      disableAnimation: false,
      hideArrow: false,
      placement: 'bottom',
      offset: 15,
      options: {
        preventOverflow: {
          enabled: false,
        },
        flip: {
          enabled: false,
        },
        shift: {
          enabled: false,
        },
      },
    },
  },

  // Dashboard Cards (8-17)
  {
    target: '[data-tour="assessment-card"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Assessment Center
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Take our comprehensive career assessment to discover your strengths, interests, and get personalized career recommendations.
          This is your starting point for career exploration.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Next Action: Click "Start Assessment" to begin your career discovery journey
        </p>
      </div>
    ),
    placement: 'right',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="training-card"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Training
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Your personalized training hub featuring AI-recommended courses based on your assessment results and career goals. 
          Track your learning progress, view enrolled courses, and discover new training opportunities tailored specifically for you. 
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Next Action: Click the eye icon to view all your learning activities or "Add Training" to log new courses
        </p>
      </div>
    ),
    placement: 'left',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="opportunities-card"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Opportunities
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Discover job openings, internships, and career opportunities available to you. 
          Browse through various positions across different industries and find roles that match your skills and career interests.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Next Action: Browse available opportunities and click "Apply" on positions that interest you
        </p>
      </div>
    ),
    placement: 'right',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="projects-card"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Projects & Internships
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Showcase your projects, internships, and practical work experience.
          Add GitHub links, live demos, and detailed descriptions to impress potential employers.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Next Action: Click "Add Project" to showcase your work or edit existing projects to add more details
        </p>
      </div>
    ),
    placement: 'right',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="certificates-card"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Certificates & Credentials
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Display your professional certificates, course completions, and industry credentials.
          These validate your skills and boost your profile credibility.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Next Action: Upload certificate images or add credential details to strengthen your profile
        </p>
      </div>
    ),
    placement: 'right',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="experience-card"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Work Experience
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Document your professional work history, part-time jobs, and volunteer experiences.
          Include achievements and responsibilities to highlight your growth.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Next Action: Add your work experiences with detailed descriptions and key accomplishments
        </p>
      </div>
    ),
    placement: 'left',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="education-card"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Education Background
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Maintain your academic records including degrees, schools, grades, and graduation dates.
          Keep this updated as you progress through your education.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Next Action: Verify your education details are complete and up-to-date
        </p>
      </div>
    ),
    placement: 'right',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="technical-skills-card"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Technical Skills
        </h3>
        <p className="text-gray-600 text-md mb-3">
          List your programming languages, software tools, and technical competencies.
          Rate your proficiency levels to help employers understand your capabilities.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Next Action: Add technical skills and honestly rate your proficiency levels (Beginner to Expert)
        </p>
      </div>
    ),
    placement: 'left',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="soft-skills-card"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Soft Skills
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Highlight your interpersonal abilities like communication, leadership, teamwork, and problem-solving.
          These skills are crucial for career success.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Next Action: Add soft skills that represent your strengths and working style
        </p>
      </div>
    ),
    placement: 'right',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
  },
  {
    target: '[data-tour="floating-ai-button"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          AI Career Assistant
        </h3>
        <p className="text-gray-600 text-md mb-3">
          Your personal AI career coach is always available.
          Get instant help with job searches, skill development, interview preparation, and career guidance.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Next Action: Click this floating button anytime you need career advice or have questions about your professional development
        </p>
      </div>
    ),
    placement: 'top',
    spotlightClicks: true,
    disableBeacon: true,
    styles: {
      tooltip: {
      },
    },
  },

  // Tour Complete
{
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🎉 Tour Complete - You're Ready!
        </h3>
        <p className="text-gray-600 mb-3">
          Congratulations! You now know how to navigate and use all the key features of your dashboard. 
          You're ready to build an amazing professional profile.
        </p>
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-blue-700 font-medium">
            🚀 Recommended Next Steps:
          </p>
          <ol className="list-decimal list-inside text-sm text-blue-600 mt-2 space-y-1">
            <li>Start with the Assessment to get personalized recommendations</li>
            <li>Complete your profile sections one by one</li>
            <li>Upload your projects and certificates</li>
            <li>Browse and apply to relevant opportunities</li>
          </ol>
        </div>
        <p className="text-sm text-blue-600 font-medium">
          Ready to begin your career journey? Click on the Assessment card to get started!
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
    styles: {
      tooltip: {
        width: '480px',
      }
    },
  },
];

// Professional tour options with custom scroll management
export const DASHBOARD_TOUR_OPTIONS = {
  continuous: true,
  showProgress: true,
  showSkipButton: true,
  spotlightClicks: true,
  disableOverlayClose: true,
  hideCloseButton: true, // Remove close button
  scrollToFirstStep: false, // Disable automatic scrolling
  scrollOffset: 0, // No automatic offset
  scrollDuration: 0, // No automatic scroll duration
  disableScrolling: true, // Disable Joyride's scrolling completely
  disableScrollParentFix: true, // Disable scroll parent fix
  customScrolling: true, // We handle scrolling manually
  allowClicksThruHole: false,
  autoStart: false,
};

export const DASHBOARD_TOUR_STYLES = {
  options: {
    primaryColor: '#2563eb', // Blue-600 to match theme
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

export const DASHBOARD_TOUR_LOCALE = {
  back: 'Back',
  close: 'Close',
  last: 'Finish Tour',
  next: 'Next',
  skip: 'Skip Tour',
};