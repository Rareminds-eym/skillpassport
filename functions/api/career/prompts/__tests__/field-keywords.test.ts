import { describe, expect, it } from 'vitest';
import { buildFieldKeywordPrompt, buildKeywordsMessages, KEYWORDS_SYSTEM } from '../field-keywords';

describe('SkillPassport field keyword prompt ownership', () => {
  it('preserves the original expansion wording and system/user roles in the transported payload', () => {
    const prompt = buildFieldKeywordPrompt('  Nursing  ');
    expect(prompt.id).toBe('careerTalentStrategist.keywords');
    expect(prompt.version).toBe('1.0.0');
    expect(prompt.system).toBe(KEYWORDS_SYSTEM);
    expect(prompt.system).toContain('ALL possible keywords');
    expect(prompt.user).toContain('Field of Study: "Nursing"');
    for (const text of ['Core subjects and topics', 'Technical skills and competencies', 'Industry-specific tools', 'Career domains and job roles', 'Related disciplines', 'Soft skills', 'Certifications and qualifications', 'Industry terminology']) expect(prompt.user).toContain(text);
    expect(buildKeywordsMessages('Nursing')).toEqual([{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }]);
  });
});
