/**
 * Subscription Plans Configuration - Commercially Strong Version
 * Centralized configuration for all subscription tiers
 */

export const PLAN_IDS = {
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
  ECOSYSTEM: 'enterprise_ecosystem',
};

export const PLAN_HIERARCHY = [
  PLAN_IDS.BASIC,
  PLAN_IDS.PROFESSIONAL,
  PLAN_IDS.ENTERPRISE,
  PLAN_IDS.ECOSYSTEM,
];

/**
 * Get all subscription plans with full feature details
 */
export function getSubscriptionPlans() {
  return {
    [PLAN_IDS.BASIC]: {
      id: PLAN_IDS.BASIC,
      name: 'Basic',
      subtitle: 'Pilot & Individual Learning',
      description: 'Validate learning outcomes with minimal setup',
      idealFor: 'Individuals, pilots, small teams validating learning',
      price: 499,
      currency: '₹',
      period: 'month',
      popular: false,
      limits: {
        learners: 1000,
        admins: 2,
        storage: 'Shared storage',
      },
      features: {
        brandingExperience: {
          branding: 'Logo + primary color',
          skillCatalog: 'Standard catalog',
          learningPathways: 'Pre-built pathways',
        },
        programManagement: {
          cohortManagement: false,
          contentUploads: 'Shared storage (documents & light media)',
          assessments: 'Quizzes',
          certificates: 'Standard completion',
        },
        analyticsInsights: {
          learnerAnalytics: 'Basic dashboards',
          dataExport: false,
        },
        engagementAutomation: {
          notificationsNudges: 'Basic reminders',
        },
        integrationsExtensibility: {
          sso: false,
          userProvisioning: false,
          apiWebhooks: false,
          lmsHrIntegrations: false,
        },
        securityCompliance: {
          auditLogs: false,
          dataResidency: false,
        },
        supportSuccess: {
          support: 'Email (business hours)',
          customerSuccessManager: false,
          implementationServices: false,
        },
      },
      featureList: [
        'Up to 1,000 learners',
        '2 admins',
        'Logo + primary color branding',
        'Standard skill catalog',
        'Pre-built learning pathways',
        'Shared storage for documents',
        'Quizzes & assessments',
        'Standard completion certificates',
        'Basic learner dashboards',
        'Basic reminders & notifications',
        'Email support (business hours)',
      ],
    },
    [PLAN_IDS.PROFESSIONAL]: {
      id: PLAN_IDS.PROFESSIONAL,
      name: 'Professional',
      subtitle: 'Team Enablement',
      description: 'Actively manage cohorts, skills, and engagement',
      idealFor: 'Growing teams and L&D functions running active programs',
      price: 999,
      currency: '₹',
      period: 'month',
      popular: true,
      limits: {
        learners: 2000,
        admins: 5,
        storage: 'Expanded shared storage',
      },
      features: {
        brandingExperience: {
          branding: 'Advanced branding',
          skillCatalog: 'Standard + curated',
          learningPathways: 'Custom pathway builder',
        },
        programManagement: {
          cohortManagement: true,
          contentUploads: 'Expanded shared storage',
          assessments: 'Question banks, graded assignments',
          certificates: 'Custom templates + expiry',
        },
        analyticsInsights: {
          learnerAnalytics: 'Cohort & skill-gap analytics',
          dataExport: 'CSV exports',
        },
        engagementAutomation: {
          notificationsNudges: 'Campaigns & nudges',
        },
        integrationsExtensibility: {
          sso: 'Available as add-on',
          userProvisioning: false,
          apiWebhooks: 'Limited / Add-on',
          lmsHrIntegrations: 'Lightweight integrations',
        },
        securityCompliance: {
          auditLogs: false,
          dataResidency: false,
        },
        supportSuccess: {
          support: 'Priority support + onboarding',
          customerSuccessManager: false,
          implementationServices: false,
        },
      },
      featureList: [
        'Up to 2,000 learners',
        'Up to 5 admins/managers',
        'Advanced branding options',
        'Standard + curated skill catalog',
        'Custom pathway builder',
        'Cohort management',
        'Expanded shared storage',
        'Question banks & graded assignments',
        'Custom certificate templates + expiry',
        'Cohort & skill-gap analytics',
        'CSV data exports',
        'Campaigns & smart nudges',
        'SSO available as add-on',
        'Lightweight LMS/HR integrations',
        'Priority support + onboarding',
      ],
    },
    [PLAN_IDS.ENTERPRISE]: {
      id: PLAN_IDS.ENTERPRISE,
      name: 'Enterprise',
      subtitle: 'Governance & Scale',
      description: 'Govern learning at scale with automation and compliance',
      idealFor: 'Large organizations with multi-department rollout',
      price: 2999,
      currency: '₹',
      period: 'month',
      popular: false,
      limits: {
        learners: 5000,
        admins: 10,
        storage: 'Up to 5 TB (expandable)',
      },
      features: {
        brandingExperience: {
          branding: 'Advanced branding + sub-portals',
          skillCatalog: 'Role-based catalog, custom taxonomy',
          learningPathways: 'Rules & prerequisites',
        },
        programManagement: {
          cohortManagement: 'Multi-department cohorts',
          contentUploads: 'Up to 5 TB (expandable)',
          assessments: 'Rubrics + project evaluation',
          certificates: 'Custom certificates + verification',
        },
        analyticsInsights: {
          learnerAnalytics: 'Skill-gap heatmaps + benchmarks',
          dataExport: 'BI-ready exports (optional)',
        },
        engagementAutomation: {
          notificationsNudges: 'Automation + smart nudges',
        },
        integrationsExtensibility: {
          sso: true,
          userProvisioning: 'Included / Add-on',
          apiWebhooks: 'Full API + webhooks',
          lmsHrIntegrations: 'Standard HRIS / LMS',
        },
        securityCompliance: {
          auditLogs: true,
          dataResidency: 'DPA support available',
        },
        supportSuccess: {
          support: 'Dedicated support, SLA 24×5',
          customerSuccessManager: 'Named CSM',
          implementationServices: 'Implementation & migration support',
        },
      },
      featureList: [
        'Up to 5,000 learners',
        'Up to 10 admins/managers',
        'Advanced branding + sub-portals',
        'Role-based catalog, custom taxonomy',
        'Rules & prerequisites for pathways',
        'Multi-department cohorts',
        'Up to 5 TB storage (expandable)',
        'Rubrics + project evaluation',
        'Custom certificates + verification',
        'Skill-gap heatmaps + benchmarks',
        'BI-ready data exports',
        'Automation + smart nudges',
        'SSO (SAML / OIDC) included',
        'SCIM user provisioning',
        'Full API + webhooks access',
        'Standard HRIS / LMS integrations',
        'Audit logs & retention',
        'DPA support available',
        'Dedicated support, SLA 24×5',
        'Named Customer Success Manager',
        'Implementation & migration support',
      ],
    },
    [PLAN_IDS.ECOSYSTEM]: {
      id: PLAN_IDS.ECOSYSTEM,
      name: 'Enterprise Ecosystem',
      subtitle: 'Extended & Regulated Scale',
      description: 'Power extended learning across organizations, partners, and regulated environments',
      idealFor: 'Large enterprises, regulated orgs, external ecosystems',
      price: null, // Contact Sales
      currency: '₹',
      period: 'month',
      popular: false,
      contactSales: true,
      limits: {
        learners: 'Unlimited / Contracted',
        admins: 'Unlimited roles',
        storage: 'Unlimited / negotiated',
      },
      features: {
        brandingExperience: {
          branding: 'Multi-brand, multi-portal',
          skillCatalog: 'Custom enterprise skill framework',
          learningPathways: 'Advanced pathways & automation',
        },
        programManagement: {
          cohortManagement: 'Multi-LOB cohorts',
          contentUploads: 'Unlimited / negotiated',
          assessments: 'Advanced assessments & rubrics',
          certificates: 'Verified credentials & digital badges',
        },
        analyticsInsights: {
          learnerAnalytics: 'Advanced analytics & benchmarking',
          dataExport: 'BI connectors (Power BI / Tableau)',
        },
        engagementAutomation: {
          notificationsNudges: 'Intelligent automation',
        },
        integrationsExtensibility: {
          sso: true,
          userProvisioning: true,
          apiWebhooks: 'Full access',
          lmsHrIntegrations: 'Full HRIS / LMS integrations',
        },
        securityCompliance: {
          auditLogs: true,
          dataResidency: 'Contractual / regional residency',
        },
        supportSuccess: {
          support: '24/7 support + SLA',
          customerSuccessManager: 'Named CSM',
          implementationServices: 'Included / Optional',
        },
      },
      featureList: [
        'Unlimited learners (contracted)',
        'Unlimited admin roles',
        'Multi-brand, multi-portal support',
        'Custom enterprise skill framework',
        'Advanced pathways & automation',
        'Multi-LOB cohorts',
        'Unlimited storage (negotiated)',
        'Advanced assessments & rubrics',
        'Verified credentials & digital badges',
        'Advanced analytics & benchmarking',
        'BI connectors (Power BI / Tableau)',
        'Intelligent automation',
        'SSO (SAML / OIDC) included',
        'SCIM user provisioning included',
        'Full API + webhooks access',
        'Full HRIS / LMS integrations',
        'Audit logs & retention',
        'Contractual / regional data residency',
        '24/7 support + SLA',
        'Named Customer Success Manager',
        'Implementation services included',
      ],
    },
  };
}

/**
 * Feature comparison matrix for display
 */
export const FEATURE_CATEGORIES = {
  limits: {
    label: 'Capacity',
    features: [
      { key: 'learners', label: 'Learners' },
      { key: 'admins', label: 'Admins / Managers' },
      { key: 'storage', label: 'Storage' },
    ],
  },
  brandingExperience: {
    label: 'Branding & Experience',
    features: [
      { key: 'branding', label: 'Branding' },
      { key: 'skillCatalog', label: 'Skill Catalog' },
      { key: 'learningPathways', label: 'Learning Pathways' },
    ],
  },
  programManagement: {
    label: 'Program Management',
    features: [
      { key: 'cohortManagement', label: 'Cohort Management' },
      { key: 'contentUploads', label: 'Content Uploads' },
      { key: 'assessments', label: 'Assessments' },
      { key: 'certificates', label: 'Certificates' },
    ],
  },
  analyticsInsights: {
    label: 'Analytics & Insights',
    features: [
      { key: 'learnerAnalytics', label: 'Learner Analytics' },
      { key: 'dataExport', label: 'Data Export' },
    ],
  },
  engagementAutomation: {
    label: 'Engagement & Automation',
    features: [
      { key: 'notificationsNudges', label: 'Notifications & Nudges' },
    ],
  },
  integrationsExtensibility: {
    label: 'Integrations & Extensibility',
    features: [
      { key: 'sso', label: 'SSO (SAML / OIDC)' },
      { key: 'userProvisioning', label: 'User Provisioning (SCIM)' },
      { key: 'apiWebhooks', label: 'API & Webhooks' },
      { key: 'lmsHrIntegrations', label: 'LMS / HR Integrations' },
    ],
  },
  securityCompliance: {
    label: 'Security, Compliance & Governance',
    features: [
      { key: 'auditLogs', label: 'Audit Logs & Retention' },
      { key: 'dataResidency', label: 'Data Residency / DPA' },
    ],
  },
  supportSuccess: {
    label: 'Support & Success',
    features: [
      { key: 'support', label: 'Support' },
      { key: 'customerSuccessManager', label: 'Customer Success Manager' },
      { key: 'implementationServices', label: 'Implementation Services' },
    ],
  },
};

/**
 * Check if a plan has access to a specific feature
 */
export function hasFeatureAccess(planId, category, featureKey) {
  const plans = getSubscriptionPlans();
  const plan = plans[planId];
  if (!plan) return false;
  
  if (category === 'limits') {
    return plan.limits?.[featureKey];
  }
  
  const featureValue = plan.features?.[category]?.[featureKey];
  return featureValue !== false && featureValue !== undefined;
}

/**
 * Get feature value for display
 */
export function getFeatureValue(planId, category, featureKey) {
  const plans = getSubscriptionPlans();
  const plan = plans[planId];
  if (!plan) return null;
  
  if (category === 'limits') {
    return plan.limits?.[featureKey];
  }
  
  return plan.features?.[category]?.[featureKey];
}

/**
 * Check if user's plan meets minimum required plan
 */
export function meetsMinimumPlan(userPlanId, requiredPlanId) {
  const userIndex = PLAN_HIERARCHY.indexOf(userPlanId);
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlanId);
  return userIndex >= requiredIndex;
}

export default {
  PLAN_IDS,
  PLAN_HIERARCHY,
  FEATURE_CATEGORIES,
  getSubscriptionPlans,
  hasFeatureAccess,
  getFeatureValue,
  meetsMinimumPlan,
};
