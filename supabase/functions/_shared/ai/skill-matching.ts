// Skill Matching Algorithm for Career AI

import type { Opportunity, JobMatchResult } from '../types/career-ai.ts';

/**
 * Normalize a skill name for comparison
 */
export function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim()
    .replace(/[^a-z0-9\s\+\#\.]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate similarity between two skill names (0-1)
 * Uses word overlap and common abbreviation matching
 */
export function calculateSkillSimilarity(skill1: string, skill2: string): number {
  const s1 = normalizeSkill(skill1);
  const s2 = normalizeSkill(skill2);
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;
  
  // Common abbreviation mappings
  const abbreviations: Record<string, string[]> = {
    'javascript': ['js', 'node', 'nodejs', 'node.js'],
    'typescript': ['ts'],
    'python': ['py'],
    'react': ['reactjs', 'react.js'],
    'angular': ['angularjs', 'angular.js'],
    'vue': ['vuejs', 'vue.js'],
    'database': ['db', 'sql', 'mysql', 'postgresql', 'postgres', 'mongodb'],
    'machine learning': ['ml', 'ai', 'artificial intelligence'],
    'data science': ['data analysis', 'analytics', 'data analytics'],
    'quality assurance': ['qa', 'testing', 'test'],
    'user interface': ['ui', 'frontend', 'front-end'],
    'user experience': ['ux', 'design'],
    'devops': ['ci/cd', 'deployment', 'docker', 'kubernetes'],
    'amazon web services': ['aws', 'cloud'],
    'google cloud': ['gcp', 'cloud'],
    'microsoft azure': ['azure', 'cloud'],
    'communication': ['communication skills', 'verbal', 'written'],
    'problem solving': ['analytical', 'critical thinking', 'logic'],
    'programming': ['coding', 'development', 'software development'],
  };

  // Check abbreviation matches
  for (const [full, abbrevs] of Object.entries(abbreviations)) {
    const allVariants = [full, ...abbrevs];
    const s1Match = allVariants.some(v => s1.includes(v) || v.includes(s1));
    const s2Match = allVariants.some(v => s2.includes(v) || v.includes(s2));
    if (s1Match && s2Match) return 0.75;
  }
  
  // Word overlap
  const words1 = s1.split(' ').filter(w => w.length > 2);
  const words2 = s2.split(' ').filter(w => w.length > 2);
  const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
  
  if (commonWords.length > 0) {
    return 0.5 * (commonWords.length / Math.max(words1.length, words2.length));
  }
  
  return 0;
}

/**
 * Calculate match score between student profile and job opportunity
 */
export function calculateJobMatch(
  studentSkills: { name: string; level: number; type: string; verified: boolean }[],
  studentDepartment: string,
  opportunity: Opportunity
): JobMatchResult {
  const jobSkills = opportunity.skills_required || [];
  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];
  const partialMatches: { studentSkill: string; jobSkill: string; similarity: number }[] = [];
  const matchReasons: string[] = [];
  
  // Normalize student skills
  const studentSkillNames = studentSkills.map(s => ({
    original: s.name,
    normalized: normalizeSkill(s.name),
    level: s.level,
    verified: s.verified
  }));
  
  let skillMatchScore = 0;
  let totalJobSkills = jobSkills.length || 1;
  
  // Match each job skill against student skills
  for (const jobSkill of jobSkills) {
    const normalizedJobSkill = normalizeSkill(jobSkill);
    let bestMatch = { skill: '', similarity: 0, level: 0, verified: false };
    
    for (const studentSkill of studentSkillNames) {
      const similarity = calculateSkillSimilarity(studentSkill.normalized, normalizedJobSkill);
      if (similarity > bestMatch.similarity) {
        bestMatch = {
          skill: studentSkill.original,
          similarity,
          level: studentSkill.level,
          verified: studentSkill.verified
        };
      }
    }

    if (bestMatch.similarity >= 0.75) {
      matchingSkills.push(jobSkill);
      const levelWeight = bestMatch.level / 5;
      const verifiedBonus = bestMatch.verified ? 0.1 : 0;
      skillMatchScore += (0.7 + (0.3 * levelWeight) + verifiedBonus) * bestMatch.similarity;
      
      if (bestMatch.similarity < 1.0) {
        partialMatches.push({
          studentSkill: bestMatch.skill,
          jobSkill: jobSkill,
          similarity: bestMatch.similarity
        });
      }
    } else if (bestMatch.similarity >= 0.4) {
      partialMatches.push({
        studentSkill: bestMatch.skill,
        jobSkill: jobSkill,
        similarity: bestMatch.similarity
      });
      skillMatchScore += 0.3 * bestMatch.similarity;
    } else {
      missingSkills.push(jobSkill);
    }
  }
  
  // Calculate field/department alignment
  let fieldAlignment = 0;
  const jobSector = (opportunity.sector || opportunity.department || '').toLowerCase();
  const studentField = (studentDepartment || '').toLowerCase();
  
  const fieldMappings: Record<string, string[]> = {
    'computer science': ['it', 'software', 'technology', 'tech', 'engineering', 'development'],
    'information technology': ['it', 'software', 'technology', 'tech', 'computer'],
    'biotechnology': ['biotech', 'life sciences', 'pharma', 'healthcare', 'biology'],
    'mechanical': ['manufacturing', 'automotive', 'engineering', 'production'],
    'electrical': ['electronics', 'power', 'engineering', 'embedded'],
    'commerce': ['finance', 'accounting', 'business', 'banking', 'management'],
    'management': ['business', 'hr', 'marketing', 'operations', 'admin'],
  };
  
  for (const [field, related] of Object.entries(fieldMappings)) {
    if (studentField.includes(field) || related.some(r => studentField.includes(r))) {
      if (jobSector.includes(field) || related.some(r => jobSector.includes(r))) {
        fieldAlignment = 1.0;
        matchReasons.push(`Field alignment: Your ${studentDepartment} background matches this ${opportunity.sector || 'role'}`);
        break;
      }
    }
  }

  if (fieldAlignment === 0 && studentField && jobSector) {
    if (studentField.includes(jobSector) || jobSector.includes(studentField)) {
      fieldAlignment = 0.7;
      matchReasons.push(`Partial field alignment with ${opportunity.sector || opportunity.department}`);
    }
  }
  
  // Calculate final match score (0-100)
  const skillScore = totalJobSkills > 0 ? (skillMatchScore / totalJobSkills) * 100 : 50;
  const fieldScore = fieldAlignment * 100;
  const finalScore = Math.round((skillScore * 0.6) + (fieldScore * 0.3) + 10);
  
  // Generate match reasons
  if (matchingSkills.length > 0) {
    matchReasons.push(`Skills match: ${matchingSkills.slice(0, 3).join(', ')}${matchingSkills.length > 3 ? ` +${matchingSkills.length - 3} more` : ''}`);
  }
  if (partialMatches.length > 0 && matchingSkills.length === 0) {
    matchReasons.push(`Related skills: ${partialMatches.slice(0, 2).map(p => `${p.studentSkill} → ${p.jobSkill}`).join(', ')}`);
  }
  if (missingSkills.length > 0 && missingSkills.length <= 3) {
    matchReasons.push(`Skills to develop: ${missingSkills.join(', ')}`);
  } else if (missingSkills.length > 3) {
    matchReasons.push(`Skills gap: ${missingSkills.length} skills needed`);
  }
  
  return {
    opportunity,
    matchScore: Math.min(100, Math.max(0, finalScore)),
    matchingSkills,
    missingSkills,
    partialMatches,
    matchReasons,
    fieldAlignment
  };
}

/**
 * Rank opportunities by match score for a student
 */
export function rankOpportunitiesByMatch(
  opportunities: Opportunity[],
  studentSkills: { name: string; level: number; type: string; verified: boolean }[],
  studentDepartment: string
): JobMatchResult[] {
  const matchResults = opportunities.map(opp => 
    calculateJobMatch(studentSkills, studentDepartment, opp)
  );
  return matchResults.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Format job match for display in AI context
 */
export function formatJobMatchForContext(match: JobMatchResult, index: number): string {
  const opp = match.opportunity;
  return `
  <job id="${opp.id}" rank="${index + 1}" match_score="${match.matchScore}%">
    <title>${opp.title}</title>
    <company>${opp.company_name || 'Not specified'}</company>
    <type>${opp.employment_type || 'Not specified'}</type>
    <location>${opp.location || 'Not specified'}</location>
    <mode>${opp.mode || 'Not specified'}</mode>
    <experience>${opp.experience_required || 'Not specified'}</experience>
    <salary>${opp.stipend_or_salary || 'Not disclosed'}</salary>
    <sector>${opp.sector || opp.department || 'General'}</sector>
    <deadline>${opp.deadline || 'Open'}</deadline>
    <required_skills>${(opp.skills_required || []).join(', ') || 'Not specified'}</required_skills>
    <match_analysis>
      <score>${match.matchScore}%</score>
      <matching_skills>${match.matchingSkills.length > 0 ? match.matchingSkills.join(', ') : 'None'}</matching_skills>
      <missing_skills>${match.missingSkills.length > 0 ? match.missingSkills.join(', ') : 'None - Great fit!'}</missing_skills>
      <reasons>${match.matchReasons.join(' | ')}</reasons>
    </match_analysis>
  </job>`;
}
