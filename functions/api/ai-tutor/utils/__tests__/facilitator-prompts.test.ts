// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildEducatorFacilitatorPrompt, EDUCATOR_FACILITATOR_PROMPTS, EDUCATOR_FOUNDATION, EDUCATOR_PROMPT_VERSION, resolveEducatorFacilitator, type EducatorFacilitator } from '../facilitator-prompts';

describe('educator facilitator prompts', () => {
  it.each(Object.keys(EDUCATOR_FACILITATOR_PROMPTS) as EducatorFacilitator[])('combines one foundation and exactly one educator role for %s', facilitator => {
    const prompt = buildEducatorFacilitatorPrompt(facilitator, 'Authorized course evidence: time management.');
    expect(prompt.split(EDUCATOR_FOUNDATION)).toHaveLength(2);
    expect(prompt.match(/^ROLE:/gm)).toHaveLength(1);
    expect(prompt).toContain('for educators.');
    expect(prompt).toContain(EDUCATOR_PROMPT_VERSION);
    expect(prompt).toContain('Authorized course evidence: time management.');
    expect(prompt).not.toContain('{{');
  });
  it('assigns generation to its owner while keeping chat persona selection', () => {
    expect(resolveEducatorFacilitator('organizer', 'worksheet')).toBe('resource-provider');
    expect(resolveEducatorFacilitator('resource-provider', 'lesson-plan')).toBe('organizer');
    expect(resolveEducatorFacilitator('individualized-support', 'chat')).toBe('individualized-support');
  });
  it('keeps evidence review distinct from intervention and automatic grading', () => {
    const guide = buildEducatorFacilitatorPrompt('mentor-and-guide', '');
    expect(guide).toContain('automatically released');
    expect(guide).toContain('without requiring manual approval');
    expect(guide).toContain('never regrades');
    expect(guide).not.toContain('approval before release');
    expect(EDUCATOR_FACILITATOR_PROMPTS['problem-solver']).toContain('diagnostic questions');
    expect(EDUCATOR_FACILITATOR_PROMPTS['individualized-support']).toContain('CREATE generates any required materials');
  });
});
