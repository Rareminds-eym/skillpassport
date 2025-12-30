/**
 * Subscription Plans Configuration
 * Commercially Strong Version with 4 Tiers
 * 
 * Tiers:
 * - Basic: Pilot & Individual Learning
 * - Professional: Team Enablement
 * - Enterprise: Governance & Scale
 * - Enterprise Ecosystem: Extended & Regulated Scale
 */

import { getPlanPrice } from './payment';

// Plan IDs
export const PLAN_IDS = {
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
  ECOSYSTEM: 'ecosystem'
};

// Plan hierarchy for comparison
export const PLAN_HIERARCHY = {
  [PLAN_IDS.BASIC]: 1,
  [PLAN_IDS.PROFESSIONAL]: 2,
  [PLAN_IDS.ENTERPRISE]: 3,
  [PLAN_IDS.ECOSYSTEM]: 4
};

// Core plan limits
export const PLAN_LIMITS = {
  [PLAN_IDS.BASIC]: {
    learners: 1000,
    admins: 2,
    storage: 'Shared storage (documents & light media)',
    idealFor: 'Individuals, pilots, small teams validating learning'
  },
  [PLAN_IDS.PROFESSIONAL]: {
    learners: 2000,
    admins: 5,
    storage: 'Expanded shared storage',
    idealFor: 'Growing teams and L&D functions running active programs'
  },
  [PLAN_IDS.ENTERPRISE]: {
    learners: 5000,
    admins: 10,
    storage: 'Up to 5 TB (expandable)',
    idealFor: 'Large organizations with multi-department rollout'
  },
  [PLAN_IDS.ECOSYSTEM]: {
    learners: 'Unlimited / Contracted',
    admins: 'Unlimited roles',
    storage: 'Unlimited / negotiated',
    idealFor: 'Large enterprises, regulated orgs, external ecosystems'
  }
};

// Feature categories with plan availability
export const FEATURE_CATEGORIES = {
  brandingExperience: {
    name: 'Branding & Experience',
    features: {
      branding: {
        name: 'Branding',
        [PLAN_IDS.BASIC]: 'Logo + primary color',
        [PLAN_IDS.PROFESSIONAL]: 'Advanced branding',
        [PLAN_IDS.ENTERPRISE]: 'Advanced branding + sub-portals',
        [PLAN_IDS.ECOSYSTEM]: 'Multi-brand, multi-portal'
      },
      skillCatalog: {
        name: 'Skill Catalog',
        [PLAN_IDS.BASIC]: 'Standard catalog',
        [PLAN_IDS.PROFESSIONAL]: 'Standard + curated',
        [PLAN_IDS.ENTERPRISE]: 'Role-based catalog, custom taxonomy',
        [PLAN_IDS.ECOSYSTEM]: 'Custom enterprise skill framework'
      },
      learningPathways: {
        name: 'Learning Pathways',
        [PLAN_IDS.BASIC]: 'Pre-built pathways',
        [PLAN_IDS.PROFESSIONAL]: 'Custom pathway builder',
        [PLAN_IDS.ENTERPRISE]: 'Rules & prerequisites',
        [PLAN_IDS.ECOSYSTEM]: 'Advanced pathways & automation'
      }
    }
  },
  programManagement: {
    name: 'Program Management',
    features: {
      cohortManagement: {
        name: 'Cohort Management',
        [PLAN_IDS.BASIC]: false,
        [PLAN_IDS.PROFESSIONAL]: true,
        [PLAN_IDS.ENTERPRISE]: 'Multi-department cohorts',
        [PLAN_IDS.ECOSYSTEM]: 'Multi-LOB cohorts'
      },
      contentUploads: {
        name: 'Content Uploads',
        [PLAN_IDS.BASIC]: 'Shared storage (documents & light media)',
        [PLAN_IDS.PROFESSIONAL]: 'Expanded shared storage',
        [PLAN_IDS.ENTERPRISE]: 'Up to 5 TB (expandable)',
        [PLAN_IDS.ECOSYSTEM]: 'Unlimited / negotiated'
      },
      assessments: {
        name: 'Assessments',
        [PLAN_IDS.BASIC]: 'Quizzes',
        [PLAN_IDS.PROFESSIONAL]: 'Question banks, graded assignments',
        [PLAN_IDS.ENTERPRISE]: 'Rubrics + project evaluation',
        [PLAN_IDS.ECOSYSTEM]: 'Advanced assessments & rubrics'
      },
      certificates: {
        name: 'Certificates',
        [PLAN_IDS.BASIC]: 'Standard completion',
        [PLAN_IDS.PROFESSIONAL]: 'Custom templates + expiry',
        [PLAN_IDS.ENTERPRISE]: 'Custom certificates + verification',
        [PLAN_IDS.ECOSYSTEM]: 'Verified credentials & digital badges'
      }
    }
  },
  analyticsInsights: {
    name: 'Analytics & Insights',
    features: {
      learnerAnalytics: {
        name: 'Learner Analytics',
        [PLAN_IDS.BASIC]: 'Basic dashboards',
        [PLAN_IDS.PROFESSIONAL]: 'Cohort & skill-gap analytics',
        [PLAN_IDS.ENTERPRISE]: 'Skill-gap heatmaps + benchmarks',
        [PLAN_IDS.ECOSYSTEM]: 'Advanced analytics & benchmarking'
      },
      dataExport: {
        name: 'Data Export',
        [PLAN_IDS.BASIC]: false,
        [PLAN_IDS.PROFESSIONAL]: 'CSV exports',
        [PLAN_IDS.ENTERPRISE]: 'BI-ready exports (optional)',
        [PLAN_IDS.ECOSYSTEM]: 'BI connectors (Power BI / Tableau)'
      }
    }
  },
  engagementAutomation: {
    name: 'Engagement & Automation',
    features: {
      notificationsNudges: {
        name: 'Notifications & Nudges',
        [PLAN_IDS.BASIC]: 'Basic reminders',
        [PLAN_IDS.PROFESSIONAL]: 'Campaigns & nudges',
        [PLAN_IDS.ENTERPRISE]: 'Automation + smart nudges',
        [PLAN_IDS.ECOSYSTEM]: 'Intelligent automation'
      }
    }
  },
  integrationsExtensibility: {
    name: 'Integrations & Extensibility',
    features: {
      sso: {
        name: 'SSO (SAML / OIDC)',
        [PLAN_IDS.BASIC]: false,
        [PLAN_IDS.PROFESSIONAL]: 'Available as add-on',
        [PLAN_IDS.ENTERPRISE]: true,
        [PLAN_IDS.ECOSYSTEM]: true
      },
      userProvisioning: {
        name: 'User Provisioning (SCIM)',
        [PLAN_IDS.BASIC]: false,
        [PLAN_IDS.PROFESSIONAL]: false,
        [PLAN_IDS.ENTERPRISE]: 'Included / Add-on',
        [PLAN_IDS.ECOSYSTEM]: true
      },
      apiWebhooks: {
        name: 'API & Webhooks',
        [PLAN_IDS.BASIC]: false,
        [PLAN_IDS.PROFESSIONAL]: 'Limited / Add-on',
        [PLAN_IDS.ENTERPRISE]: 'Full API + webhooks',
        [PLAN_IDS.ECOSYSTEM]: 'Full access'
      },
      lmsHrIntegrations: {
        name: 'LMS / HR Integrations',
        [PLAN_IDS.BASIC]: false,
        [PLAN_IDS.PROFESSIONAL]: 'Lightweight integrations',
        [PLAN_IDS.ENTERPRISE]: 'Standard HRIS / LMS',
        [PLAN_IDS.ECOSYSTEM]: 'Full HRIS / LMS integrations'
      }
    }
  },
  securityCompliance: {
    name: 'Security, Compliance & Governance',
    features: {
      auditLogs: {
        name: 'Audit Logs & Retention',
        [PLAN_IDS.BASIC]: false,
        [PLAN_IDS.PROFESSIONAL]: false,
        [PLAN_IDS.ENTERPRISE]: true,
        [PLAN_IDS.ECOSYSTEM]: true
      },
      dataResidency: {
        name: 'Data Residency / DPA',
        [PLAN_IDS.BASIC]: false,
        [PLAN_IDS.PROFESSIONAL]: false,
        [PLAN_IDS.ENTERPRISE]: 'DPA support available',
        [PLAN_IDS.ECOSYSTEM]: 'Contractual / regional residency'
      }
    }
  },
  supportSuccess: {
    name: 'Support & Success',
    features: {
      support: {
        name: 'Support',
        [PLAN_IDS.BASIC]: 'Email (business hours)',
        [PLAN_IDS.PROFESSIONAL]: 'Priority support + onboarding',
        [PLAN_IDS.ENTERPRISE]: 'Dedicated support, SLA 24×5',
        [PLAN_IDS.ECOSYSTEM]: '24/7 support + SLA'
      },
      customerSuccessManager: {
        name: 'Customer Success Manager',
        [PLAN_IDS.BASIC]: false,
        [PLAN_IDS.PROFESSIONAL]: false,
        [PLAN_IDS.ENTERPRISE]: 'Named CSM',
        [PLAN_IDS.ECOSYSTEM]: 'Named CSM'
      },
      implementationServices: {
        name: 'Implementation Services',
        [PLAN_IDS.BASIC]: false,
        [PLAN_IDS.PROFESSIONAL]: false,
        [PLAN_IDS.ENTERPRISE]: 'Implementation & migration support',
        [PLAN_IDS.ECOSYSTEM]: 'Included / Optional'
      }
    }
  }
};

// Positioning summaries
export const PLAN_POSITIONING = {
  [PLAN_IDS.BASIC]: 'Validate learning outcomes with minimal setup.',
  [PLAN_IDS.PROFESSIONAL]: 'Actively manage cohorts, skills, and engagement.',
  [PLAN_IDS.ENTERPRISE]: 'Govern learning at scale with automation and compliance.',
  [PLAN_IDS.ECOSYSTEM]: 'Power extended learning across organizations, partners, and regulated environments.'
};

/**
 * Get feature list for a specific plan (for display in plan cards)
 */
export function getPlanFeatureList(planId) {
  const limits = PLAN_LIMITS[planId];
  const features = [];

  // Add limits
  features.push(`Up to ${typeof limits.learners === 'number' ? limits.learners.toLocaleString() : limits.learners} learners`);
  features.push(`${typeof limits.admins === 'number' ? `Up to ${limits.admins}` : limits.admins} admins/managers`);

  // Add key features from each category
  Object.values(FEATURE_CATEGORIES).forEach(category => {
    Object.values(category.features).forEach(feature => {
      const value = feature[planId];
      if (value && value !== false) {
        if (typeof value === 'string') {
          features.push(`${feature.name}: ${value}`);
        } else if (value === true) {
          features.push(feature.name);
        }
      }
    });
  });

  return features;
}

/**
 * Get simplified feature list for plan cards (most important features)
 */
export function getSimplifiedPlanFeatures(planId) {
  const limits = PLAN_LIMITS[planId];
  
  const featuresByPlan = {
    [PLAN_IDS.BASIC]: [
      `Up to ${limits.learners.toLocaleString()} learners`,
      `${limits.admins} admin accounts`,
      'Logo + primary color branding',
      'Standard skill catalog',
      'Pre-built learning pathways',
      'Basic quizzes & assessments',
      'Standard completion certificates',
      'Basic analytics dashboards',
      'Basic reminders & notifications',
      'Email support (business hours)'
    ],
    [PLAN_IDS.PROFESSIONAL]: [
      `Up to ${limits.learners.toLocaleString()} learners`,
      `Up to ${limits.admins} admins/managers`,
      'Advanced branding options',
      'Standard + curated skill catalog',
      'Custom pathway builder',
      'Cohort management',
      'Question banks & graded assignments',
      'Custom certificate templates + expiry',
      'Cohort & skill-gap analytics',
      'CSV data exports',
      'Campaigns & nudges',
      'SSO available as add-on',
      'Lightweight LMS/HR integrations',
      'Priority support + onboarding'
    ],
    [PLAN_IDS.ENTERPRISE]: [
      `Up to ${limits.learners.toLocaleString()} learners`,
      `Up to ${limits.admins} admins/managers`,
      'Advanced branding + sub-portals',
      'Role-based catalog, custom taxonomy',
      'Rules & prerequisites for pathways',
      'Multi-department cohorts',
      'Up to 5 TB storage (expandable)',
      'Rubrics + project evaluation',
      'Custom certificates + verification',
      'Skill-gap heatmaps + benchmarks',
      'BI-ready exports',
      'Automation + smart nudges',
      'SSO (SAML/OIDC) included',
      'User provisioning (SCIM)',
      'Full API + webhooks',
      'Standard HRIS/LMS integrations',
      'Audit logs & retention',
      'DPA support available',
      'Dedicated support, SLA 24×5',
      'Named Customer Success Manager',
      'Implementation & migration support'
    ],
    [PLAN_IDS.ECOSYSTEM]: [
      'Unlimited / Contracted learners',
      'Unlimited admin roles',
      'Multi-brand, multi-portal',
      'Custom enterprise skill framework',
      'Advanced pathways & automation',
      'Multi-LOB cohorts',
      'Unlimited storage (negotiated)',
      'Advanced assessments & rubrics',
      'Verified credentials & digital badges',
      'Advanced analytics & benchmarking',
      'BI connectors (Power BI / Tableau)',
      'Intelligent automation',
      'SSO (SAML/OIDC) included',
      'User provisioning (SCIM) included',
      'Full API access',
      'Full HRIS/LMS integrations',
      'Audit logs & retention',
      'Contractual / regional data residency',
      '24/7 support + SLA',
      'Named Customer Success Manager',
      'Implementation services included'
    ]
  };

  return featuresByPlan[planId] || [];
}

/**
 * Get all subscription plans with pricing
 */
export function getSubscriptionPlans() {
  return [
    {
      id: PLAN_IDS.BASIC,
      name: 'Basic',
      tagline: 'Pilot & Individual Learning',
      price: getPlanPrice(PLAN_IDS.BASIC),
      duration: 'month',
      features: getSimplifiedPlanFeatures(PLAN_IDS.BASIC),
      limits: PLAN_LIMITS[PLAN_IDS.BASIC],
      positioning: PLAN_POSITIONING[PLAN_IDS.BASIC],
      color: 'bg-slate-600',
      recommended: false,
      contactSales: false
    },
    {
      id: PLAN_IDS.PROFESSIONAL,
      name: 'Professional',
      tagline: 'Team Enablement',
      price: getPlanPrice(PLAN_IDS.PROFESSIONAL),
      duration: 'month',
      features: getSimplifiedPlanFeatures(PLAN_IDS.PROFESSIONAL),
      limits: PLAN_LIMITS[PLAN_IDS.PROFESSIONAL],
      positioning: PLAN_POSITIONING[PLAN_IDS.PROFESSIONAL],
      color: 'bg-blue-600',
      recommended: true,
      contactSales: false
    },
    {
      id: PLAN_IDS.ENTERPRISE,
      name: 'Enterprise',
      tagline: 'Governance & Scale',
      price: getPlanPrice(PLAN_IDS.ENTERPRISE),
      duration: 'month',
      features: getSimplifiedPlanFeatures(PLAN_IDS.ENTERPRISE),
      limits: PLAN_LIMITS[PLAN_IDS.ENTERPRISE],
      positioning: PLAN_POSITIONING[PLAN_IDS.ENTERPRISE],
      color: 'bg-purple-600',
      recommended: false,
      contactSales: false
    },
    {
      id: PLAN_IDS.ECOSYSTEM,
      name: 'Enterprise Ecosystem',
      tagline: 'Extended & Regulated Scale',
      price: null, // Contact sales
      duration: 'custom',
      features: getSimplifiedPlanFeatures(PLAN_IDS.ECOSYSTEM),
      limits: PLAN_LIMITS[PLAN_IDS.ECOSYSTEM],
      positioning: PLAN_POSITIONING[PLAN_IDS.ECOSYSTEM],
      color: 'bg-gradient-to-r from-purple-600 to-indigo-600',
      recommended: false,
      contactSales: true
    }
  ];
}

/**
 * Check if a plan is higher than another
 */
export function isPlanHigher(planA, planB) {
  return (PLAN_HIERARCHY[planA] || 0) > (PLAN_HIERARCHY[planB] || 0);
}

/**
 * Get plan by ID
 */
export function getPlanById(planId) {
  return getSubscriptionPlans().find(p => p.id === planId);
}

export default {
  PLAN_IDS,
  PLAN_HIERARCHY,
  PLAN_LIMITS,
  FEATURE_CATEGORIES,
  PLAN_POSITIONING,
  getSubscriptionPlans,
  getPlanFeatureList,
  getSimplifiedPlanFeatures,
  isPlanHigher,
  getPlanById
};
