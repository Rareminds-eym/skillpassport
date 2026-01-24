import { TourConfig } from '../types';

export const studentDashboardTour: TourConfig = {
  id: 'student_dashboard_main',
  name: 'Student Dashboard Tour',
  steps: [
    // Navigation Tour Steps
    {
      target: '[data-tour="nav-training"]',
      content: 'Navigate to your learning section to view courses, training programs, and track your educational progress. This is where you manage all your learning activities.',
      title: 'My Learning Navigation',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '[data-tour="nav-courses"]',
      content: 'Access the courses marketplace to discover and enroll in new courses. Browse through various categories and find courses that match your interests.',
      title: 'Courses Navigation',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '[data-tour="nav-digital-portfolio"]',
      content: 'Create and manage your professional digital portfolio. Showcase your work, projects, and achievements to potential employers.',
      title: 'Digital Portfolio Navigation',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '[data-tour="nav-opportunities"]',
      content: 'Explore job opportunities, internships, and career openings. Find positions that match your skills and career goals.',
      title: 'Opportunities Navigation',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '[data-tour="nav-career-ai"]',
      content: 'Get personalized career guidance from our AI assistant. Ask questions about career paths, skill development, and job search strategies.',
      title: 'Career AI Navigation',
      placement: 'bottom',
      disableBeacon: true
    },
    // Dashboard/Analytics Tabs
    {
      target: '[data-tour="dashboard-tab"]',
      content: 'The Dashboard view shows your complete profile overview with all sections organized in an easy-to-navigate grid. This is your main hub for managing your professional profile.',
      title: 'Dashboard View',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '[data-tour="analytics-tab"]',
      content: 'Switch to Analytics view to track your learning progress, performance insights, and career development metrics. Monitor your growth over time.',
      title: 'Analytics View',
      placement: 'bottom',
      disableBeacon: true
    },
    // Dashboard Cards
    {
      target: '[data-tour="assessment-card"]',
      content: 'Take our comprehensive career assessment to discover your strengths, interests, and get personalized career recommendations. This is your starting point for career exploration.\n\n💡 Next Action: Click "Start Assessment" to begin your career discovery journey',
      title: 'Assessment Center',
      placement: 'right',
      disableBeacon: true
    },
    {
      target: '[data-tour="training-card"]',
      content: 'Track your learning progress, view enrolled courses, and discover new training opportunities. All your educational activities are organized here.\n\n💡 Next Action: Click the eye icon to view all your learning activities or "Add Training" to log new courses',
      title: 'My Learning',
      placement: 'right',
      disableBeacon: true
    },
    {
      target: '[data-tour="opportunities-card"]',
      content: 'Discover job openings, internships, and career opportunities matched to your skills and interests. AI-powered recommendations help you find the best fits.\n\n💡 Next Action: Browse opportunities and click "Apply" on positions that interest you',
      title: 'Opportunities Hub',
      placement: 'left',
      disableBeacon: true
    },
    {
      target: '[data-tour="projects-card"]',
      content: 'Showcase your projects, internships, and practical work experience. Add GitHub links, live demos, and detailed descriptions to impress potential employers.\n\n💡 Next Action: Click "Add Project" to showcase your work or edit existing projects to add more details',
      title: 'Projects & Internships',
      placement: 'right',
      disableBeacon: true
    },
    {
      target: '[data-tour="certificates-card"]',
      content: 'Display your professional certificates, course completions, and industry credentials. These validate your skills and boost your profile credibility.\n\n💡 Next Action: Upload certificate images or add credential details to strengthen your profile',
      title: 'Certificates & Credentials',
      placement: 'right',
      disableBeacon: true
    },
    {
      target: '[data-tour="experience-card"]',
      content: 'Document your professional work history, part-time jobs, and volunteer experiences. Include achievements and responsibilities to highlight your growth.\n\n💡 Next Action: Add your work experiences with detailed descriptions and key accomplishments',
      title: 'Work Experience',
      placement: 'left',
      disableBeacon: true
    },
    {
      target: '[data-tour="education-card"]',
      content: 'Maintain your academic records including degrees, schools, grades, and graduation dates. Keep this updated as you progress through your education.\n\n💡 Next Action: Verify your education details are complete and up-to-date',
      title: 'Education Background',
      placement: 'right',
      disableBeacon: true
    },
    {
      target: '[data-tour="technical-skills-card"]',
      content: 'List your programming languages, software tools, and technical competencies. Rate your proficiency levels to help employers understand your capabilities.\n\n💡 Next Action: Add technical skills and honestly rate your proficiency levels (Beginner to Expert)',
      title: 'Technical Skills',
      placement: 'right',
      disableBeacon: true
    },
    {
      target: '[data-tour="soft-skills-card"]',
      content: 'Highlight your interpersonal abilities like communication, leadership, teamwork, and problem-solving. These skills are crucial for career success.\n\n💡 Next Action: Add soft skills that represent your strengths and working style',
      title: 'Soft Skills',
      placement: 'left',
      disableBeacon: true
    },
    {
      target: '[data-tour="floating-ai-button"]',
      content: 'Your personal AI career coach is always available! Get instant help with job searches, skill development, interview preparation, and career guidance.\n\n💡 Next Action: Click this button anytime you need career advice or have questions about your professional development\n\n🎉 Tour Complete! You\'re now ready to build an amazing professional profile. Start with the Assessment to get personalized recommendations!',
      title: 'AI Career Assistant',
      placement: 'top',
      disableBeacon: true
    }
  ],
  options: {
    continuous: true,
    showProgress: true,
    showSkipButton: true,
    spotlightClicks: true, // Allow clicks on highlighted elements
    disableOverlayClose: true, // Prevent accidental tour closure
    hideCloseButton: true, // Hide the X close button
    // Scrolling configuration - custom centering for dashboard
    scrollToFirstStep: true,
    scrollOffset: 80, // Offset for better positioning with indicator
    disableScrolling: false, // Enable custom scrolling
    disableScrollParentFix: true, // Prevent scroll parent issues
    customScrolling: true, // Enable custom scroll centering
    styles: {
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
        zIndex: 85, // Spotlight should be behind tooltip but above overlay
      },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 80, // Overlay should be at the bottom of tour elements
      }
    }
  }
};