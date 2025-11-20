// Mock data generator for different time periods
// This simulates what would come from API endpoints with date range filters

type TimeRange = '7d' | '30d' | '90d' | 'ytd';

interface PeriodData {
  funnel: {
    sourced: number;
    screened: number;
    interviewed: number;
    offered: number;
    hired: number;
  };
  speedMetrics: {
    median_time_to_first_response: number;
    median_time_to_hire: number;
    avg_interview_to_offer: number;
    fastest_hire: number;
  };
  qualityMetrics: {
    total_hired: number;
    avg_cgpa: number;
    external_audited_percentage: number;
    avg_ai_score_hired: number;
    rubric_pass_rate: number;
    top_skills_hired: string[];
    gender_diversity: {
      male_percentage: number;
      female_percentage: number;
    };
    ageDemographics: {
      averageAge: number;
      distribution: Array<{
        range: string;
        count: number;
        percentage: number;
      }>;
    };
    topCourses: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
  };
  geography: {
    locations: Array<{ city: string; count: number; percentage: number }>;
    colleges: Array<{ name: string; count: number }>;
  };
  attribution: {
    hackathons: Array<{ name: string; applications: number; hires: number }>;
    courses: Array<{ name: string; applications: number; hires: number }>;
  };
  trends: {
    hires: number[];
    applications: number[];
    timeToHire: number[];
  };
}

// Generate realistic data based on time period
export const getDataForPeriod = (range: TimeRange): PeriodData => {
  const multipliers = {
    '7d': 0.15,   // ~15% of yearly data
    '30d': 0.65,  // ~65% of monthly average
    '90d': 2.0,   // 3 months of data
    'ytd': 8.5    // Year to date (assuming ~10.5 months)
  };

  const baseMultiplier = multipliers[range];

  // Generate funnel data
  const sourced = Math.round(150 * baseMultiplier);
  const screened = Math.round(sourced * 0.59); // 59% conversion
  const interviewed = Math.round(screened * 0.51); // 51% conversion
  const offered = Math.round(interviewed * 0.27); // 27% conversion
  const hired = Math.round(offered * 0.67); // 67% conversion

  // Adjust speed metrics based on period
  const speedVariation = {
    '7d': { median_time_to_first_response: 1.8, median_time_to_hire: 15, avg_interview_to_offer: 4, fastest_hire: 8 },
    '30d': { median_time_to_first_response: 2.5, median_time_to_hire: 18, avg_interview_to_offer: 5, fastest_hire: 12 },
    '90d': { median_time_to_first_response: 3.2, median_time_to_hire: 21, avg_interview_to_offer: 6, fastest_hire: 14 },
    'ytd': { median_time_to_first_response: 3.8, median_time_to_hire: 23, avg_interview_to_offer: 7, fastest_hire: 16 }
  };

  // Quality metrics (tend to be more stable)
  const qualityVariation = {
    '7d': { audited: 22, score: 89.5, pass: 78, hired: Math.round(hired), cgpa: 8.2 },
    '30d': { audited: 18, score: 87.3, pass: 73, hired: Math.round(hired), cgpa: 7.9 },
    '90d': { audited: 16, score: 86.1, pass: 71, hired: Math.round(hired), cgpa: 7.8 },
    'ytd': { audited: 15, score: 85.2, pass: 69, hired: Math.round(hired), cgpa: 7.7 }
  };

  // Geography data varies by period
  const geoData = {
    '7d': {
      locations: [
        { city: 'Chennai', count: Math.round(hired * 0.4), percentage: 40 },
        { city: 'Bangalore', count: Math.round(hired * 0.35), percentage: 35 },
        { city: 'Coimbatore', count: Math.round(hired * 0.15), percentage: 15 },
        { city: 'Pune', count: Math.round(hired * 0.1), percentage: 10 }
      ],
      colleges: [
        { name: 'Anna University', count: Math.round(hired * 0.3) },
        { name: 'PSG College of Technology', count: Math.round(hired * 0.25) },
        { name: 'VIT University', count: Math.round(hired * 0.25) },
        { name: 'Bharathiar University', count: Math.round(hired * 0.2) }
      ]
    },
    '30d': {
      locations: [
        { city: 'Chennai', count: Math.round(hired * 0.38), percentage: 37.5 },
        { city: 'Coimbatore', count: Math.round(hired * 0.25), percentage: 25 },
        { city: 'Bangalore', count: Math.round(hired * 0.25), percentage: 25 },
        { city: 'Pune', count: Math.round(hired * 0.12), percentage: 12.5 }
      ],
      colleges: [
        { name: 'Anna University', count: Math.round(hired * 0.25) },
        { name: 'PSG College of Technology', count: Math.round(hired * 0.25) },
        { name: 'Bharathiar University', count: Math.round(hired * 0.25) },
        { name: 'VIT University', count: Math.round(hired * 0.25) }
      ]
    },
    '90d': {
      locations: [
        { city: 'Bangalore', count: Math.round(hired * 0.35), percentage: 35 },
        { city: 'Chennai', count: Math.round(hired * 0.30), percentage: 30 },
        { city: 'Pune', count: Math.round(hired * 0.20), percentage: 20 },
        { city: 'Coimbatore', count: Math.round(hired * 0.15), percentage: 15 }
      ],
      colleges: [
        { name: 'VIT University', count: Math.round(hired * 0.28) },
        { name: 'Anna University', count: Math.round(hired * 0.26) },
        { name: 'PSG College of Technology', count: Math.round(hired * 0.24) },
        { name: 'Bharathiar University', count: Math.round(hired * 0.22) }
      ]
    },
    'ytd': {
      locations: [
        { city: 'Chennai', count: Math.round(hired * 0.32), percentage: 32 },
        { city: 'Bangalore', count: Math.round(hired * 0.28), percentage: 28 },
        { city: 'Coimbatore', count: Math.round(hired * 0.22), percentage: 22 },
        { city: 'Pune', count: Math.round(hired * 0.18), percentage: 18 }
      ],
      colleges: [
        { name: 'Anna University', count: Math.round(hired * 0.27) },
        { name: 'PSG College of Technology', count: Math.round(hired * 0.25) },
        { name: 'Bharathiar University', count: Math.round(hired * 0.24) },
        { name: 'VIT University', count: Math.round(hired * 0.24) }
      ]
    }
  };

  // Attribution data varies
  const attributionData = {
    '7d': {
      hackathons: [
        { name: 'TechFest 2024', applications: 3, hires: 1 },
        { name: 'AgriHack 2025', applications: 2, hires: 0 }
      ],
      courses: [
        { name: 'GMP', applications: Math.round(sourced * 0.4), hires: Math.round(hired * 0.4) },
        { name: 'FSQM', applications: Math.round(sourced * 0.35), hires: Math.round(hired * 0.35) },
        { name: 'MC', applications: Math.round(sourced * 0.25), hires: Math.round(hired * 0.25) }
      ]
    },
    '30d': {
      hackathons: [
        { name: 'TechFest 2024', applications: 15, hires: 2 },
        { name: 'AgriHack 2025', applications: 8, hires: 1 },
        { name: 'MechAthon 2024', applications: 12, hires: 1 }
      ],
      courses: [
        { name: 'GMP', applications: Math.round(sourced * 0.38), hires: Math.round(hired * 0.38) },
        { name: 'FSQM', applications: Math.round(sourced * 0.32), hires: Math.round(hired * 0.32) },
        { name: 'MC', applications: Math.round(sourced * 0.30), hires: Math.round(hired * 0.30) }
      ]
    },
    '90d': {
      hackathons: [
        { name: 'TechFest 2024', applications: 42, hires: 5 },
        { name: 'AgriHack 2025', applications: 28, hires: 3 },
        { name: 'MechAthon 2024', applications: 35, hires: 4 }
      ],
      courses: [
        { name: 'GMP', applications: Math.round(sourced * 0.35), hires: Math.round(hired * 0.36) },
        { name: 'FSQM', applications: Math.round(sourced * 0.33), hires: Math.round(hired * 0.32) },
        { name: 'MC', applications: Math.round(sourced * 0.32), hires: Math.round(hired * 0.32) }
      ]
    },
    'ytd': {
      hackathons: [
        { name: 'TechFest 2024', applications: 125, hires: 18 },
        { name: 'AgriHack 2025', applications: 89, hires: 12 },
        { name: 'MechAthon 2024', applications: 98, hires: 14 }
      ],
      courses: [
        { name: 'GMP', applications: Math.round(sourced * 0.36), hires: Math.round(hired * 0.35) },
        { name: 'FSQM', applications: Math.round(sourced * 0.34), hires: Math.round(hired * 0.33) },
        { name: 'MC', applications: Math.round(sourced * 0.30), hires: Math.round(hired * 0.32) }
      ]
    }
  };

  // Trend data (number of points varies by period)
  const trendPoints = {
    '7d': 7,   // Daily data
    '30d': 12, // ~Every 2-3 days
    '90d': 12, // Weekly data
    'ytd': 12  // Monthly data
  };

  const points = trendPoints[range];
  const trendData = {
    hires: Array.from({ length: points }, (_, i) => {
      const base = hired / points;
      const variation = Math.random() * 0.4 - 0.2; // ±20% variation
      return Math.max(1, Math.round(base * (1 + variation)));
    }),
    applications: Array.from({ length: points }, (_, i) => {
      const base = sourced / points;
      const variation = Math.random() * 0.3 - 0.15; // ±15% variation
      return Math.max(1, Math.round(base * (1 + variation)));
    }),
    timeToHire: Array.from({ length: points }, (_, i) => {
      const base = speedVariation[range].median_time_to_hire;
      const variation = Math.random() * 0.2 - 0.1; // ±10% variation
      return Math.max(1, Math.round(base * (1 + variation)));
    })
  };

  // Top skills vary slightly by period
  const topSkills = {
    '7d': ['React', 'Python', 'Node.js', 'TypeScript', 'AWS'],
    '30d': ['Python', 'React', 'HACCP', 'Six Sigma', 'AutoCAD'],
    '90d': ['Python', 'Java', 'React', 'AWS', 'Docker'],
    'ytd': ['Python', 'React', 'Java', 'Node.js', 'SQL']
  };

  return {
    funnel: {
      sourced,
      screened,
      interviewed,
      offered,
      hired
    },
    speedMetrics: speedVariation[range],
    qualityMetrics: {
      total_hired: qualityVariation[range].hired,
      avg_cgpa: qualityVariation[range].cgpa,
      external_audited_percentage: qualityVariation[range].audited,
      avg_ai_score_hired: qualityVariation[range].score,
      rubric_pass_rate: qualityVariation[range].pass,
      top_skills_hired: topSkills[range],
      gender_diversity: {
        male_percentage: 58,
        female_percentage: 42
      },
      ageDemographics: {
        averageAge: 23,
        distribution: [
          { range: '18-21', count: Math.round(hired * 0.3), percentage: 30 },
          { range: '22-25', count: Math.round(hired * 0.45), percentage: 45 },
          { range: '26-30', count: Math.round(hired * 0.20), percentage: 20 },
          { range: '30+', count: Math.round(hired * 0.05), percentage: 5 }
        ]
      },
      topCourses: [
        { name: 'GMP', count: Math.round(hired * 0.35), percentage: 35 },
        { name: 'FSQM', count: Math.round(hired * 0.30), percentage: 30 },
        { name: 'MC', count: Math.round(hired * 0.25), percentage: 25 },
        { name: 'Others', count: Math.round(hired * 0.10), percentage: 10 }
      ]
    },
    geography: geoData[range],
    attribution: attributionData[range],
    trends: trendData
  };
};

// Get previous period data for comparison
export const getPreviousPeriodData = (range: TimeRange): PeriodData => {
  // For comparison, generate slightly lower/different data
  const currentData = getDataForPeriod(range);
  
  // Apply a reduction factor (simulating growth over time)
  const reductionFactor = 0.88; // ~12% growth
  
  return {
    funnel: {
      sourced: Math.round(currentData.funnel.sourced * reductionFactor),
      screened: Math.round(currentData.funnel.screened * reductionFactor),
      interviewed: Math.round(currentData.funnel.interviewed * reductionFactor),
      offered: Math.round(currentData.funnel.offered * reductionFactor),
      hired: Math.round(currentData.funnel.hired * reductionFactor)
    },
    speedMetrics: {
      median_time_to_first_response: currentData.speedMetrics.median_time_to_first_response + 0.5,
      median_time_to_hire: currentData.speedMetrics.median_time_to_hire + 3,
      avg_interview_to_offer: currentData.speedMetrics.avg_interview_to_offer + 1,
      fastest_hire: currentData.speedMetrics.fastest_hire + 2
    },
    qualityMetrics: {
      total_hired: Math.round(currentData.qualityMetrics.total_hired * reductionFactor),
      avg_cgpa: Math.max(6.0, currentData.qualityMetrics.avg_cgpa - 0.2),
      external_audited_percentage: Math.max(10, currentData.qualityMetrics.external_audited_percentage - 2),
      avg_ai_score_hired: currentData.qualityMetrics.avg_ai_score_hired - 1.5,
      rubric_pass_rate: Math.max(60, currentData.qualityMetrics.rubric_pass_rate - 3),
      top_skills_hired: currentData.qualityMetrics.top_skills_hired,
      gender_diversity: currentData.qualityMetrics.gender_diversity,
      ageDemographics: currentData.qualityMetrics.ageDemographics,
      topCourses: currentData.qualityMetrics.topCourses
    },
    geography: currentData.geography,
    attribution: currentData.attribution,
    trends: currentData.trends
  };
};

// Get label format based on period
export const getTrendLabels = (range: TimeRange): string[] => {
  switch (range) {
    case '7d':
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    case '30d':
      return ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5'];
    case '90d':
      return ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
    case 'ytd':
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }
};

// Get period display name
export const getPeriodDisplayName = (range: TimeRange): string => {
  switch (range) {
    case '7d': return 'Last 7 Days';
    case '30d': return 'Last 30 Days';
    case '90d': return 'Last 90 Days';
    case 'ytd': return 'Year to Date';
  }
};
