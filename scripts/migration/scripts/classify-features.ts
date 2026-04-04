#!/usr/bin/env tsx
/**
 * Feature Classification Script
 * Identifies remaining feature components in src/components/ for Phase 3 migration
 */

interface FeatureMapping {
  featureName: string;
  sourceComponents: string[];
  description: string;
  targetPath: string;
}

const featureMappings: FeatureMapping[] = [
  {
    featureName: 'opportunities',
    sourceComponents: [
      'src/components/JobRecommendations.tsx',
      'src/components/SimpleOpportunitiesTest.jsx'
    ],
    description: 'Job recommendations and opportunities matching',
    targetPath: 'src/features/opportunities'
  },
  {
    featureName: 'college-admin',
    sourceComponents: [
      'src/components/admin/collegeAdmin/'
    ],
    description: 'College administration management',
    targetPath: 'src/features/college-admin'
  },
  {
    featureName: 'school-admin',
    sourceComponents: [
      'src/components/admin/schoolAdmin/'
    ],
    description: 'School administration management',
    targetPath: 'src/features/school-admin'
  },
  {
    featureName: 'digital-portfolio',
    sourceComponents: [
      'src/components/digital-pp/passport/',
      'src/components/digital-pp/portfolio/',
      'src/components/digital-pp/ui/'
    ],
    description: 'Digital passport and portfolio management',
    targetPath: 'src/features/digital-portfolio'
  },
  {
    featureName: 'ai-tutor',
    sourceComponents: [
      'src/components/ai-tutor/AITutorButton.tsx',
      'src/components/ai-tutor/AITutorChat.tsx',
      'src/components/ai-tutor/AITutorPanel.tsx',
      'src/components/ai-tutor/VideoLearningPanel.tsx',
      'src/components/ai-tutor/VideoSummarizer.tsx'
    ],
    description: 'AI tutoring and video learning features',
    targetPath: 'src/features/ai-tutor'
  },
  {
    featureName: 'counselling',
    sourceComponents: [
      'src/components/counselling/ChatWindow.tsx',
      'src/components/counselling/SessionList.tsx',
      'src/components/counselling/TopicSelector.tsx'
    ],
    description: 'AI counselling and chat sessions',
    targetPath: 'src/features/counselling'
  },
  {
    featureName: 'placement',
    sourceComponents: [
      'src/components/Recruiter/components/',
      'src/components/Recruiter/filters/',
      'src/components/Recruiter/modals/',
      'src/components/Recruiter/Projects/'
    ],
    description: 'Placement and recruitment management',
    targetPath: 'src/features/placement'
  }
];

console.log('📋 Feature Migration Plan - Phase 3\n');
console.log(`Total features to migrate: ${featureMappings.length}\n`);

featureMappings.forEach((feature, index) => {
  console.log(`${index + 1}. ${feature.featureName}`);
  console.log(`   Description: ${feature.description}`);
  console.log(`   Target: ${feature.targetPath}`);
  console.log(`   Components:`);
  feature.sourceComponents.forEach(comp => {
    console.log(`     - ${comp}`);
  });
  console.log('');
});

console.log('\n✅ Classification complete');
