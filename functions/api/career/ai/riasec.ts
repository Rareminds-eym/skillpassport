// RIASEC and Personality Interpretation

export const RIASEC_DESCRIPTIONS: Record<string, { name: string; traits: string; careers: string }> = {
  R: { 
    name: 'Realistic', 
    traits: 'practical, hands-on, mechanical aptitude, prefer working with tools/machines',
    careers: 'Engineering, Manufacturing, Construction, Agriculture, Technical roles'
  },
  I: { 
    name: 'Investigative', 
    traits: 'analytical, intellectual, scientific, curious, problem-solver',
    careers: 'Research, Data Science, Medicine, Academia, Scientific roles'
  },
  A: { 
    name: 'Artistic', 
    traits: 'creative, expressive, original, imaginative, values aesthetics',
    careers: 'Design, Media, Arts, Writing, Creative industries'
  },
  S: { 
    name: 'Social', 
    traits: 'helpful, cooperative, empathetic, enjoys teaching/counseling',
    careers: 'Education, Healthcare, HR, Social Work, Customer-facing roles'
  },
  E: { 
    name: 'Enterprising', 
    traits: 'persuasive, ambitious, leadership-oriented, competitive',
    careers: 'Sales, Management, Entrepreneurship, Marketing, Business Development'
  },
  C: { 
    name: 'Conventional', 
    traits: 'organized, detail-oriented, systematic, values structure',
    careers: 'Finance, Administration, Accounting, Data Entry, Operations'
  }
};

export function interpretRIASEC(code: string, scores: Record<string, number>): string {
  if (!code || code.length < 2) return 'Assessment not completed';
  
  // Check if all scores are 0 (incomplete assessment)
  const allScores = Object.values(scores);
  const allZeros = allScores.length > 0 && allScores.every(s => s === 0);
  
  if (allZeros) {
    return 'Assessment scores appear incomplete (all zeros). The student may need to retake the assessment for accurate results.';
  }
  
  const topTypes = code.slice(0, 3).split('');
  const interpretations = topTypes.map((type, index) => {
    const desc = RIASEC_DESCRIPTIONS[type];
    if (!desc) return '';
    // Try both single letter key and full name key
    const score = scores[type] ?? scores[desc.name] ?? 0;
    return `${index + 1}. **${desc.name}** (Score: ${score}): ${desc.traits}. Suited for: ${desc.careers}`;
  });
  
  return interpretations.filter(Boolean).join('\n');
}

export function interpretBigFive(scores: Record<string, number>): string {
  const traits: string[] = [];
  
  if (scores.openness > 70) traits.push('highly creative and open to new experiences');
  else if (scores.openness < 40) traits.push('practical and prefers familiar approaches');
  
  if (scores.conscientiousness > 70) traits.push('very organized and goal-oriented');
  else if (scores.conscientiousness < 40) traits.push('flexible and spontaneous');
  
  if (scores.extraversion > 70) traits.push('energized by social interaction');
  else if (scores.extraversion < 40) traits.push('prefers independent work');
  
  if (scores.agreeableness > 70) traits.push('collaborative and team-oriented');
  else if (scores.agreeableness < 40) traits.push('direct and competitive');
  
  if (scores.neuroticism > 70) traits.push('may benefit from stress management techniques');
  else if (scores.neuroticism < 40) traits.push('emotionally stable under pressure');
  
  return traits.length > 0 ? traits.join(', ') : 'Balanced personality profile';
}
