import { getSubscriptionPlans, PLAN_IDS } from '../config/subscriptionPlans';

/**
 * Parse student type to extract entity and role
 * @param {string} studentType - e.g., "college-student", "admin", "university-educator", "recruitment-admin"
 * @returns {object} { entity, role }
 */
export function parseStudentType(studentType) {
    if (!studentType) {
        return { entity: 'school', role: 'student' };
    }

    // Handle simple types
    if (studentType === 'student' || studentType === 'school') return { entity: 'school', role: 'student' };
    if (studentType === 'college') return { entity: 'college', role: 'student' };
    if (studentType === 'university') return { entity: 'university', role: 'student' };
    if (studentType === 'educator') return { entity: 'school', role: 'educator' };
    if (studentType === 'admin') return { entity: 'school', role: 'admin' };

    // Handle entity-specific types
    if (studentType.includes('-')) {
        const parts = studentType.split('-');
        if (parts.length === 2) {
            return { entity: parts[0], role: parts[1] };
        }
    }

    return { entity: 'school', role: 'student' };
}

/**
 * Get entity-specific content for subscription plans
 * @param {string} studentType - The student type from URL params
 * @returns {object} Content configuration
 */
export function getEntityContent(studentType) {
    const { entity, role } = parseStudentType(studentType);

    // Entity display names
    const entityNames = {
        school: 'School',
        college: 'College',
        university: 'University',
        recruitment: 'Recruitment'
    };

    // Role display names
    const roleNames = {
        student: 'Student',
        educator: 'Educator',
        admin: 'Admin',
        recruiter: 'Recruiter'
    };

    const entityName = entityNames[entity] || 'School';
    const roleName = roleNames[role] || 'Student';

    // Generate title - special handling for recruitment
    let title;
    if (entity === 'recruitment') {
        title = role === 'admin' ? 'Recruitment Admin Subscription Plans' : 'Recruiter Subscription Plans';
    } else {
        title = `${entityName} ${roleName} Subscription Plans`;
    }

    // Generate subtitle based on role and entity
    let subtitle;
    if (entity === 'recruitment') {
        if (role === 'admin') {
            subtitle = 'Manage your recruitment team effectively with comprehensive tools built for recruitment administrators';
        } else if (role === 'recruiter') {
            subtitle = 'Access verified candidates and streamline your hiring process with powerful recruitment tools';
        } else {
            subtitle = 'Select the plan that best suits your needs';
        }
    } else if (entity === 'university' && role === 'admin') {
        subtitle = 'Manage your university college with powerful tools for student management, placements, and analytics';
    } else if (entity === 'university' && role === 'student') {
        subtitle = 'Access skill assessments, build your portfolio, and connect with top recruiters through your university';
    } else {
        const subtitles = {
            student: `Unlock your potential with skill assessments and career opportunities tailored for ${entityName.toLowerCase()} students`,
            educator: `Empower your students with powerful teaching tools and analytics designed for ${entityName.toLowerCase()} educators`,
            admin: `Manage your institution effectively with comprehensive tools built for ${entityName.toLowerCase()} administrators`
        };
        subtitle = subtitles[role] || 'Select the plan that best suits your needs';
    }

    // Generate hero message - removed per user request
    const heroMessage = null;

    // Generate role-specific plans
    const plans = getPlansForRole(role, entity);

    // Generate CTA text
    const ctaTexts = {
        student: 'Start Learning',
        educator: 'Empower Students',
        admin: 'Manage Institution'
    };

    const ctaText = ctaTexts[role] || 'Select Plan';

    return {
        title,
        subtitle,
        heroMessage,
        plans,
        ctaText,
        entity,
        role
    };
}

/**
 * Get entity-specific content for signup/login modals
 * @param {string} studentType - The student type (e.g., "college-student", "admin")
 * @returns {object} Modal content configuration
 */
export function getModalContent(studentType) {
    const { entity, role } = parseStudentType(studentType);

    // Entity display names
    const entityNames = {
        school: 'School',
        college: 'College',
        university: 'University',
        recruitment: 'Recruitment'
    };

    // Role display names
    const roleNames = {
        student: 'Student',
        educator: 'Educator',
        admin: 'Admin',
        recruiter: 'Recruiter'
    };

    const entityName = entityNames[entity] || 'School';
    const roleName = roleNames[role] || 'Student';

    // Generate signup title - special handling for recruitment
    let signupTitle;
    if (entity === 'recruitment') {
        signupTitle = role === 'admin' ? 'Sign Up as Recruitment Admin' : 'Sign Up as Recruiter';
    } else {
        signupTitle = `Sign Up as ${entityName} ${roleName}`;
    }
    
    // Generate login title - special handling for recruitment
    let loginTitle;
    if (entity === 'recruitment') {
        loginTitle = role === 'admin' ? 'Login as Recruitment Admin' : 'Login as Recruiter';
    } else {
        loginTitle = `Login as ${entityName} ${roleName}`;
    }

    // Generate descriptions
    let description;
    if (entity === 'recruitment') {
        if (role === 'admin') {
            description = 'Create your company workspace, manage your recruitment team, and access verified candidates.';
        } else if (role === 'recruiter') {
            description = 'Join your company workspace and start hiring with AI-powered candidate matching.';
        } else {
            description = 'Create your account to get started.';
        }
    } else {
        const descriptions = {
            student: `Create your account to access skill assessments, build your portfolio, and connect with recruiters.`,
            educator: `Create your account to manage students, track progress, and enhance learning outcomes.`,
            admin: `Create your account to manage your institution, access analytics, and streamline operations.`
        };
        description = descriptions[role] || 'Create your account to get started.';
    }

    return {
        signupTitle,
        loginTitle,
        description,
        entity,
        role,
        entityName,
        roleName
    };
}

/**
 * Get plans with role-specific features
 * Uses the new 4-tier commercially strong subscription model
 */
function getPlansForRole(role, entity) {
    // Get base plans from the new subscription config
    const basePlansObj = getSubscriptionPlans();
    
    // Convert to array and sort by hierarchy
    const basePlans = [
        basePlansObj[PLAN_IDS.BASIC],
        basePlansObj[PLAN_IDS.PROFESSIONAL],
        basePlansObj[PLAN_IDS.ENTERPRISE],
        basePlansObj[PLAN_IDS.ECOSYSTEM]
    ];
    
    // Role-specific feature overrides for display purposes
    const roleFeatureOverrides = getRoleSpecificFeatures(role, entity);
    
    // Map base plans with role-specific features and format for display
    return basePlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        tagline: plan.subtitle,
        positioning: plan.description,
        price: plan.price ? String(plan.price) : null,
        duration: plan.period,
        recommended: plan.popular,
        contactSales: plan.contactSales || false,
        features: roleFeatureOverrides[plan.id] || plan.featureList,
        limits: plan.limits
    }));
}

/**
 * Get role-specific feature descriptions
 * These customize the generic plan features for specific user roles
 */
function getRoleSpecificFeatures(role, entity) {
    // Student-specific features (school/college/university)
    const studentFeatures = {
        [PLAN_IDS.BASIC]: [
            'Access to basic skill assessments',
            'Create digital portfolio',
            'Standard skill catalog access',
            'Pre-built learning pathways',
            'Basic career resources',
            'Standard completion certificates',
            'Basic analytics dashboard',
            'Email support (business hours)'
        ],
        [PLAN_IDS.PROFESSIONAL]: [
            'All Basic features',
            'Advanced skill assessments & certifications',
            'Custom learning pathway builder',
            'Priority profile visibility to recruiters',
            'Personalized career recommendations',
            'Resume builder & templates',
            'Custom certificate templates',
            'Cohort & skill-gap analytics',
            'Interview preparation resources',
            'Priority support + onboarding'
        ],
        [PLAN_IDS.ENTERPRISE]: [
            'All Professional features',
            'Custom skill assessment creation',
            'Role-based catalog access',
            'Premium recruiter visibility',
            'One-on-one career counseling sessions',
            'Exclusive job opportunities',
            'Custom certificates + verification',
            'Skill-gap heatmaps & benchmarks',
            'LinkedIn profile optimization',
            'Dedicated support, SLA 24×5',
            'Named Customer Success Manager'
        ],
        [PLAN_IDS.ECOSYSTEM]: [
            'All Enterprise features',
            'Custom enterprise skill framework',
            'Advanced pathways & automation',
            'Verified credentials & digital badges',
            'Advanced analytics & benchmarking',
            'Multi-institution access',
            'Full API access for integrations',
            '24/7 support + SLA',
            'Named Customer Success Manager',
            'Custom implementation support'
        ]
    };

    // Educator-specific features
    const educatorFeatures = {
        [PLAN_IDS.BASIC]: [
            'Manage up to 50 students',
            'Basic student analytics',
            'Assignment tracking',
            'Grade management',
            'Standard skill catalog',
            'Pre-built learning pathways',
            'Basic reminders',
            'Email support (business hours)'
        ],
        [PLAN_IDS.PROFESSIONAL]: [
            'All Basic features',
            'Manage up to 200 students',
            'Cohort management',
            'Advanced student analytics & insights',
            'Custom assignment creation',
            'Question banks & graded assignments',
            'Progress tracking & reports',
            'Custom pathway builder',
            'Parent communication tools',
            'Campaigns & nudges',
            'Priority support + onboarding'
        ],
        [PLAN_IDS.ENTERPRISE]: [
            'All Professional features',
            'Manage up to 500 students',
            'Multi-department cohorts',
            'Institution-wide analytics',
            'Custom curriculum builder',
            'Rubrics + project evaluation',
            'Automated grading & feedback',
            'Skill-gap heatmaps + benchmarks',
            'Integration with LMS platforms',
            'Automation + smart nudges',
            'Dedicated support, SLA 24×5',
            'Named Customer Success Manager'
        ],
        [PLAN_IDS.ECOSYSTEM]: [
            'All Enterprise features',
            'Unlimited student management',
            'Multi-LOB cohorts',
            'Advanced assessments & rubrics',
            'Verified credentials & digital badges',
            'Advanced analytics & benchmarking',
            'Full HRIS/LMS integrations',
            'Intelligent automation',
            '24/7 support + SLA',
            'Named Customer Success Manager',
            'Implementation services included'
        ]
    };

    // Admin-specific features (school/college/university)
    const adminFeatures = {
        [PLAN_IDS.BASIC]: [
            'Up to 1,000 learners',
            '2 admin accounts',
            'Logo + primary color branding',
            'Basic institution analytics',
            'User role management',
            'Standard skill catalog',
            'Basic reporting',
            'Email support (business hours)'
        ],
        [PLAN_IDS.PROFESSIONAL]: [
            'All Basic features',
            'Up to 2,000 learners',
            'Up to 5 admins/managers',
            'Advanced branding options',
            'Cohort management',
            'Advanced institution-wide analytics',
            'Bulk user operations',
            'Custom pathway builder',
            'CSV data exports',
            'Campaigns & nudges',
            'SSO available as add-on',
            'Priority support + onboarding'
        ],
        [PLAN_IDS.ENTERPRISE]: [
            'All Professional features',
            'Up to 5,000 learners',
            'Up to 10 admins/managers',
            'Advanced branding + sub-portals',
            'Multi-department cohorts',
            'Up to 5 TB storage',
            'Enterprise-grade analytics & BI',
            'Multi-campus management',
            'Advanced security & SSO',
            'User provisioning (SCIM)',
            'Full API + webhooks',
            'Standard HRIS/LMS integrations',
            'Audit logs & retention',
            'Dedicated support, SLA 24×5',
            'Named Customer Success Manager',
            'Implementation & migration support'
        ],
        [PLAN_IDS.ECOSYSTEM]: [
            'All Enterprise features',
            'Unlimited learners (contracted)',
            'Unlimited admin roles',
            'Multi-brand, multi-portal',
            'Multi-LOB cohorts',
            'Unlimited storage (negotiated)',
            'Custom enterprise skill framework',
            'Advanced analytics & benchmarking',
            'BI connectors (Power BI / Tableau)',
            'Full HRIS/LMS integrations',
            'Contractual data residency',
            'Intelligent automation',
            '24/7 support + SLA',
            'Named Customer Success Manager',
            'Custom SLA agreements'
        ]
    };

    // University Admin-specific features
    const universityAdminFeatures = {
        [PLAN_IDS.BASIC]: [
            'Manage single college under university',
            'Up to 1,000 students',
            '2 admin accounts',
            'Basic student management',
            'Standard course management',
            'Basic analytics dashboard',
            'Email support (business hours)'
        ],
        [PLAN_IDS.PROFESSIONAL]: [
            'All Basic features',
            'Up to 2,000 students',
            'Up to 5 admins/managers',
            'Advanced student analytics',
            'Faculty management tools',
            'Custom course creation',
            'Cohort management',
            'Placement tracking',
            'Parent communication portal',
            'Priority support + onboarding'
        ],
        [PLAN_IDS.ENTERPRISE]: [
            'All Professional features',
            'Up to 5,000 students',
            'Up to 10 admins/managers',
            'Multi-department management',
            'Advanced placement analytics',
            'Industry partnership tools',
            'Skill-gap heatmaps + benchmarks',
            'SSO (SAML/OIDC) included',
            'Full API + webhooks',
            'Audit logs & retention',
            'Dedicated support, SLA 24×5',
            'Named Customer Success Manager'
        ],
        [PLAN_IDS.ECOSYSTEM]: [
            'All Enterprise features',
            'Unlimited students (contracted)',
            'Unlimited admin roles',
            'Multi-campus, multi-portal',
            'Advanced analytics & benchmarking',
            'Full HRIS/LMS integrations',
            'Verified credentials & digital badges',
            'Contractual data residency',
            '24/7 support + SLA',
            'Named Customer Success Manager',
            'Custom SLA agreements'
        ]
    };

    // Recruitment Admin-specific features
    const recruitmentAdminFeatures = {
        [PLAN_IDS.BASIC]: [
            'Create company workspace',
            'Up to 1,000 candidate profiles',
            '2 admin accounts',
            'Basic candidate database access',
            'Standard job posting',
            'Basic analytics dashboard',
            'Email support (business hours)'
        ],
        [PLAN_IDS.PROFESSIONAL]: [
            'All Basic features',
            'Up to 2,000 candidate profiles',
            'Up to 5 admins/managers',
            'Advanced candidate search & filters',
            'AI-powered candidate matching',
            'Custom hiring workflows',
            'Team collaboration tools',
            'Cohort & skill-gap analytics',
            'CSV data exports',
            'Priority support + onboarding'
        ],
        [PLAN_IDS.ENTERPRISE]: [
            'All Professional features',
            'Up to 5,000 candidate profiles',
            'Up to 10 admins/managers',
            'Premium candidate database access',
            'Advanced branding + sub-portals',
            'Multi-department hiring',
            'Skill-gap heatmaps + benchmarks',
            'SSO (SAML/OIDC) included',
            'Full API + webhooks',
            'Standard HRIS integrations',
            'Audit logs & retention',
            'Dedicated support, SLA 24×5',
            'Named Customer Success Manager'
        ],
        [PLAN_IDS.ECOSYSTEM]: [
            'All Enterprise features',
            'Unlimited candidate profiles',
            'Unlimited admin roles',
            'Multi-brand, multi-portal',
            'Advanced analytics & benchmarking',
            'BI connectors (Power BI / Tableau)',
            'Full HRIS integrations',
            'Contractual data residency',
            '24/7 support + SLA',
            'Named Customer Success Manager',
            'Custom SLA agreements'
        ]
    };

    // Recruiter-specific features
    const recruiterFeatures = {
        [PLAN_IDS.BASIC]: [
            'Join company workspace',
            'Basic candidate search',
            'Up to 10 active job postings',
            'Limited AI recommendations',
            'Standard application tracking',
            'Basic analytics',
            'Email support (business hours)'
        ],
        [PLAN_IDS.PROFESSIONAL]: [
            'All Basic features',
            'Advanced search filters',
            'Unlimited job postings',
            'Unlimited AI-powered matching',
            'Priority candidate visibility',
            'Resume parsing & analysis',
            'Interview scheduling tools',
            'Cohort analytics',
            'Priority support + onboarding'
        ],
        [PLAN_IDS.ENTERPRISE]: [
            'All Professional features',
            'Custom hiring workflows',
            'Bulk candidate operations',
            'Advanced analytics dashboard',
            'Skill-gap heatmaps',
            'Integration with ATS systems',
            'Automation + smart nudges',
            'Dedicated support, SLA 24×5',
            'Named Customer Success Manager'
        ],
        [PLAN_IDS.ECOSYSTEM]: [
            'All Enterprise features',
            'Advanced assessments & rubrics',
            'Advanced analytics & benchmarking',
            'Full ATS/HRIS integrations',
            'Intelligent automation',
            '24/7 support + SLA',
            'Named Customer Success Manager',
            'Custom reporting'
        ]
    };

    // Determine which feature set to use based on entity and role
    if (entity === 'recruitment') {
        if (role === 'admin') {
            return recruitmentAdminFeatures;
        } else if (role === 'recruiter') {
            return recruiterFeatures;
        }
    } else if (entity === 'university' && role === 'admin') {
        return universityAdminFeatures;
    }
    
    const featureMap = {
        student: studentFeatures,
        educator: educatorFeatures,
        admin: adminFeatures
    };
    
    return featureMap[role] || studentFeatures;
}
