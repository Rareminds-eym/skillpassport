import { getPlanPrice } from '../config/payment';

/**
 * Parse student type to extract entity and role
 * @param {string} studentType - e.g., "college-student", "admin", "university-educator"
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
        university: 'University'
    };

    // Role display names
    const roleNames = {
        student: 'Student',
        educator: 'Educator',
        admin: 'Admin'
    };

    const entityName = entityNames[entity] || 'School';
    const roleName = roleNames[role] || 'Student';

    // Generate title
    const title = `${entityName} ${roleName} Subscription Plans`;

    // Generate subtitle based on role
    const subtitles = {
        student: `Unlock your potential with skill assessments and career opportunities tailored for ${entityName.toLowerCase()} students`,
        educator: `Empower your students with powerful teaching tools and analytics designed for ${entityName.toLowerCase()} educators`,
        admin: `Manage your institution effectively with comprehensive tools built for ${entityName.toLowerCase()} administrators`
    };

    const subtitle = subtitles[role] || 'Select the plan that best suits your needs';

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
        university: 'University'
    };

    // Role display names
    const roleNames = {
        student: 'Student',
        educator: 'Educator',
        admin: 'Admin'
    };

    const entityName = entityNames[entity] || 'School';
    const roleName = roleNames[role] || 'Student';

    // Generate signup title
    const signupTitle = `Sign Up as ${entityName} ${roleName}`;
    
    // Generate login title
    const loginTitle = `Login as ${entityName} ${roleName}`;

    // Generate descriptions
    const descriptions = {
        student: `Create your account to access skill assessments, build your portfolio, and connect with recruiters.`,
        educator: `Create your account to manage students, track progress, and enhance learning outcomes.`,
        admin: `Create your account to manage your institution, access analytics, and streamline operations.`
    };

    const description = descriptions[role] || 'Create your account to get started.';

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
 */
function getPlansForRole(role, entity) {
    const basePrice = {
        basic: getPlanPrice('basic'),
        pro: getPlanPrice('pro'),
        enterprise: getPlanPrice('enterprise')
    };

    // Student-specific features
    const studentFeatures = {
        basic: [
            'Access to basic skill assessments',
            'Create digital portfolio',
            'Limited profile visibility to recruiters',
            'Basic career resources',
            'Email support'
        ],
        pro: [
            'All Basic features',
            'Advanced skill assessments & certifications',
            'Priority profile visibility to recruiters',
            'Personalized career recommendations',
            'Resume builder & templates',
            'Interview preparation resources',
            'Priority support'
        ],
        enterprise: [
            'All Professional features',
            'Custom skill assessment creation',
            'Premium recruiter visibility',
            'One-on-one career counseling sessions',
            'Exclusive job opportunities',
            'LinkedIn profile optimization',
            '24/7 Premium support',
            'Dedicated career advisor'
        ]
    };

    // Educator-specific features
    const educatorFeatures = {
        basic: [
            'Manage up to 50 students',
            'Basic student analytics',
            'Assignment tracking',
            'Grade management',
            'Email support'
        ],
        pro: [
            'All Basic features',
            'Manage up to 200 students',
            'Advanced student analytics & insights',
            'Custom assignment creation',
            'Progress tracking & reports',
            'Parent communication tools',
            'Curriculum planning resources',
            'Priority support'
        ],
        enterprise: [
            'All Professional features',
            'Unlimited student management',
            'Institution-wide analytics',
            'Custom curriculum builder',
            'Automated grading & feedback',
            'Integration with LMS platforms',
            'Professional development resources',
            '24/7 Premium support',
            'Dedicated account manager'
        ]
    };

    // Admin-specific features
    const adminFeatures = {
        basic: [
            'Manage up to 100 users',
            'Basic institution analytics',
            'User role management',
            'Basic reporting',
            'Email support'
        ],
        pro: [
            'All Basic features',
            'Manage up to 500 users',
            'Advanced institution-wide analytics',
            'Bulk user operations',
            'Custom branding & white-labeling',
            'Compliance & audit reports',
            'API access for integrations',
            'Priority support'
        ],
        enterprise: [
            'All Professional features',
            'Unlimited user management',
            'Enterprise-grade analytics & BI',
            'Multi-campus management',
            'Advanced security & SSO',
            'Custom integrations & workflows',
            'Dedicated infrastructure',
            '24/7 Premium support',
            'Dedicated account manager',
            'SLA guarantees'
        ]
    };

    const featureMap = {
        student: studentFeatures,
        educator: educatorFeatures,
        admin: adminFeatures
    };

    const features = featureMap[role] || studentFeatures;

    return [
        {
            id: 'basic',
            name: 'Basic',
            price: basePrice.basic,
            duration: 'month',
            features: features.basic,
            color: 'bg-blue-600',
            recommended: false
        },
        {
            id: 'pro',
            name: 'Professional',
            price: basePrice.pro,
            duration: 'month',
            features: features.pro,
            color: 'bg-blue-600',
            recommended: true
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: basePrice.enterprise,
            duration: 'month',
            features: features.enterprise,
            color: 'bg-blue-600',
            recommended: false
        }
    ];
}
