/**
 * Assessment Scoring and Analysis Utilities
 *
 * @module features/assessment/data/questions/scoringUtils
 */

import type { RIASECType } from './riasecQuestions';

export interface RIASECResult {
  scores: Record<RIASECType, number>;
  topThree: RIASECType[];
  code: string;
}

export interface BigFiveResult {
  O: number;
  C: number;
  E: number;
  A: number;
  N: number;
}

export interface WorkValuesResult {
  scores: Record<string, number>;
  topThree: Array<{ value: string; score: number }>;
}

export interface EmployabilityResult {
  skillScores: Record<string, number>;
  sjtScore: number;
}

export interface CareerCluster {
  title: string;
  description: string;
  fit: 'High' | 'Medium' | 'Low';
}

export interface SkillLevel {
  level: 'Strong' | 'Developing' | 'Needs Focus';
  color: 'green' | 'blue' | 'orange';
}

export const calculateRIASEC = (answers: Record<string, number>): RIASECResult => {
  const scores: Record<RIASECType, number[]> = { R: [], I: [], A: [], S: [], E: [], C: [] };

  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('riasec_')) {
      const questionId = key.split('_')[1];
      const type = questionId.charAt(0).toUpperCase() as RIASECType;
      if (scores[type]) {
        scores[type].push(value);
      }
    }
  });

  const averages: Record<RIASECType, number> = {} as Record<RIASECType, number>;
  (Object.keys(scores) as RIASECType[]).forEach((type) => {
    averages[type] =
      scores[type].length > 0 ? scores[type].reduce((a, b) => a + b, 0) / scores[type].length : 0;
  });

  const sorted = (Object.entries(averages) as [RIASECType, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return {
    scores: averages,
    topThree: sorted.map(([type]) => type),
    code: sorted.map(([type]) => type).join(''),
  };
};

export const calculateBigFive = (answers: Record<string, number>): BigFiveResult => {
  const traits: Record<keyof BigFiveResult, number[]> = { O: [], C: [], E: [], A: [], N: [] };

  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('bigfive_')) {
      const questionId = key.split('_')[1];
      const type = questionId.charAt(0).toUpperCase() as keyof BigFiveResult;
      if (traits[type]) {
        traits[type].push(value);
      }
    }
  });

  const averages: BigFiveResult = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  (Object.keys(traits) as (keyof BigFiveResult)[]).forEach((trait) => {
    averages[trait] =
      traits[trait].length > 0
        ? traits[trait].reduce((a, b) => a + b, 0) / traits[trait].length
        : 0;
  });

  return averages;
};

export const calculateWorkValues = (answers: Record<string, number>): WorkValuesResult => {
  const values: Record<string, number[]> = {
    Security: [],
    Autonomy: [],
    Creativity: [],
    Status: [],
    Impact: [],
    Financial: [],
    Leadership: [],
    Lifestyle: [],
  };

  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('values_')) {
      const questionId = key.split('_')[1];
      if (questionId.startsWith('sec')) values.Security.push(value);
      else if (questionId.startsWith('aut')) values.Autonomy.push(value);
      else if (questionId.startsWith('cre')) values.Creativity.push(value);
      else if (questionId.startsWith('sta')) values.Status.push(value);
      else if (questionId.startsWith('imp')) values.Impact.push(value);
      else if (questionId.startsWith('fin')) values.Financial.push(value);
      else if (questionId.startsWith('lea')) values.Leadership.push(value);
      else if (questionId.startsWith('lif')) values.Lifestyle.push(value);
    }
  });

  const averages: Record<string, number> = {};
  Object.keys(values).forEach((val) => {
    averages[val] =
      values[val].length > 0 ? values[val].reduce((a, b) => a + b, 0) / values[val].length : 0;
  });

  const sorted = Object.entries(averages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return {
    scores: averages,
    topThree: sorted.map(([val, score]) => ({ value: val, score })),
  };
};

export const calculateEmployability = (answers: Record<string, unknown>): EmployabilityResult => {
  const skills: Record<string, number[]> = {
    Communication: [],
    Teamwork: [],
    ProblemSolving: [],
    Adaptability: [],
    Leadership: [],
    DigitalFluency: [],
    Professionalism: [],
    CareerReadiness: [],
  };

  let sjtScore = 0;
  let sjtCount = 0;

  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('employability_')) {
      const questionId = key.split('_')[1];

      if (questionId.startsWith('sjt')) {
        sjtCount++;
        if (
          typeof value === 'string' &&
          (value.includes('privately') ||
            value.includes('renegotiate') ||
            value.includes('Inform mentor') ||
            value.includes('Facilitate') ||
            value.includes('Learn basics') ||
            value.includes('Practice'))
        ) {
          sjtScore += 2;
        } else {
          sjtScore += 1;
        }
      } else {
        const numValue = typeof value === 'number' ? value : 0;
        if (questionId.startsWith('com')) skills.Communication.push(numValue);
        else if (questionId.startsWith('tm')) skills.Teamwork.push(numValue);
        else if (questionId.startsWith('ps')) skills.ProblemSolving.push(numValue);
        else if (questionId.startsWith('ad')) skills.Adaptability.push(numValue);
        else if (questionId.startsWith('ld')) skills.Leadership.push(numValue);
        else if (questionId.startsWith('df')) skills.DigitalFluency.push(numValue);
        else if (questionId.startsWith('pr')) skills.Professionalism.push(numValue);
        else if (questionId.startsWith('cr')) skills.CareerReadiness.push(numValue);
      }
    }
  });

  const averages: Record<string, number> = {};
  Object.keys(skills).forEach((skill) => {
    averages[skill] =
      skills[skill].length > 0
        ? skills[skill].reduce((a, b) => a + b, 0) / skills[skill].length
        : 0;
  });

  return {
    skillScores: averages,
    sjtScore: sjtCount > 0 ? (sjtScore / (sjtCount * 2)) * 100 : 0,
  };
};

export const getCareerClusters = (riasecCode: string): CareerCluster[] => {
  const clusterMap: Record<string, CareerCluster> = {
    IRS: {
      title: 'Software Engineering',
      description: 'Core Development & Engineering',
      fit: 'High',
    },
    IRC: {
      title: 'Data Science & AI',
      description: 'Analytics, ML & Data Engineering',
      fit: 'High',
    },
    RIC: {
      title: 'Cybersecurity / Cloud / DevOps',
      description: 'Infrastructure & Security',
      fit: 'High',
    },
    EIC: {
      title: 'Product / Tech Consulting',
      description: 'Business & Technology Intersection',
      fit: 'High',
    },
    ESC: {
      title: 'Marketing / Sales / Business Development',
      description: 'Growth & Revenue',
      fit: 'High',
    },
    ECS: { title: 'Operations / Finance / Admin', description: 'Business Operations', fit: 'High' },
    AIE: {
      title: 'UI/UX Design / Product Design',
      description: 'User Experience & Design',
      fit: 'High',
    },
    AIS: {
      title: 'Content Creation / Media',
      description: 'Digital Content & Communication',
      fit: 'High',
    },
    SAE: { title: 'HR / Training / L&D', description: 'People Development', fit: 'High' },
    SIA: { title: 'Education / Counseling', description: 'Teaching & Guidance', fit: 'High' },
  };

  if (clusterMap[riasecCode]) {
    return [clusterMap[riasecCode]];
  }

  const firstLetter = riasecCode[0];
  const matches = Object.entries(clusterMap)
    .filter(([code]) => code[0] === firstLetter)
    .map(([, cluster]) => cluster);

  return matches.length > 0
    ? matches
    : [
        {
          title: 'Exploratory Path',
          description: 'Multiple career options available',
          fit: 'Medium',
        },
      ];
};

export const getSkillLevel = (score: number): SkillLevel => {
  if (score >= 4) return { level: 'Strong', color: 'green' };
  if (score >= 3) return { level: 'Developing', color: 'blue' };
  return { level: 'Needs Focus', color: 'orange' };
};

export const getTraitInterpretation = (trait: keyof BigFiveResult, score: number): string => {
  const interpretations: Record<keyof BigFiveResult, { high: string; low: string }> = {
    O: {
      high: 'You are curious, creative, and open to new experiences. You enjoy learning and exploring innovative ideas.',
      low: 'You prefer practical, conventional approaches and value stability and familiarity.',
    },
    C: {
      high: 'You are organized, disciplined, and reliable. You plan ahead and follow through on commitments.',
      low: 'You are flexible and spontaneous, preferring to adapt as situations unfold.',
    },
    E: {
      high: 'You are sociable, energetic, and enjoy being around people. You thrive in interactive environments.',
      low: 'You prefer quieter settings and recharge through solitary activities.',
    },
    A: {
      high: 'You are cooperative, empathetic, and value harmony in relationships.',
      low: 'You are competitive and direct, focusing on results over relationships.',
    },
    N: {
      high: 'You experience emotions intensely and may be more sensitive to stress.',
      low: 'You are emotionally stable and resilient under pressure.',
    },
  };

  return score >= 3.5 ? interpretations[trait].high : interpretations[trait].low;
};
