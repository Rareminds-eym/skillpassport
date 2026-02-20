import { AbilityBuilder, createMongoAbility } from '@casl/ability';

/**
 * Define abilities for actual users based on their role
 * This is for PRODUCTION use - real permissions
 */
export const defineAbilitiesFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (!user) {
    return build();
  }

  // All authenticated users get student permissions
  can('read', 'Profile');
  can('update', 'Profile');
  can('read', 'Dashboard');
  can('read', 'Applications');
  can('create', 'Applications');
  can('read', 'Messages');
  can('send', 'Messages');
  can('read', 'Skills');
  can('update', 'Skills');
  can('read', 'Learning');
  can('read', 'Courses');
  can('read', 'Opportunities');
  can('read', 'Jobs');
  can('read', 'Analytics');
  can('read', 'Settings');
  can('update', 'Settings');
  can('read', 'Assessment');
  can('view', 'AssessmentResults');
  can('access', 'CareerAI');

  return build();
};

/**
 * Define abilities for DEMO mode
 */
export const defineAbilitiesForDemo = (demoPersona) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  switch (demoPersona) {
    case 'demo_view_only':
      can('read', 'Profile');
      can('read', 'Dashboard');
      can('read', 'Applications');
      can('read', 'Messages');
      can('read', 'Skills');
      cannot('update', 'Profile');
      cannot('create', 'Applications');
      cannot('send', 'Messages');
      break;

    case 'demo_basic_student':
      can('read', 'Profile');
      can('update', 'Profile');
      can('read', 'Dashboard');
      can('read', 'Applications');
      can('create', 'Applications');
      can('read', 'Messages');
      can('send', 'Messages');
      can('read', 'Skills');
      can('update', 'Skills');
      cannot('access', 'CareerAI');
      cannot('read', 'Analytics');
      break;

    case 'demo_premium_student':
      can('manage', 'all');
      break;

    case 'demo_restricted':
      can('read', 'Profile');
      can('read', 'Dashboard');
      cannot('update', 'Profile');
      cannot('read', 'Applications');
      break;

    default:
      can('read', 'Profile');
      can('read', 'Dashboard');
  }

  return build();
};

export const getDemoPersonaInfo = (personaId) => {
  const personas = {
    demo_view_only: {
      name: 'View-Only Student',
      description: 'Can view all content but cannot make changes',
      icon: '👁️',
      color: 'bg-gray-100 text-gray-700'
    },
    demo_basic_student: {
      name: 'Basic Student',
      description: 'Free tier with limited features',
      icon: '🎓',
      color: 'bg-blue-100 text-blue-700'
    },
    demo_premium_student: {
      name: 'Premium Student',
      description: 'Full access including Career AI',
      icon: '⭐',
      color: 'bg-purple-100 text-purple-700'
    },
    demo_restricted: {
      name: 'Restricted Student',
      description: 'Limited access (suspended account)',
      icon: '🔒',
      color: 'bg-red-100 text-red-700'
    }
  };

  return personas[personaId] || personas.demo_basic_student;
};
