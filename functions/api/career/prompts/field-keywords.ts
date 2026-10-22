import { PlatformPromptSchema, type PlatformPrompt } from '@rareminds-eym/ai-protocol';

/**
 * SkillPassport-owned field-keyword wording, preserved from the original template.
 *
 * Deliberately NOT composed with the Inclusive AI Standard: this prompt
 * demands machine-only comma output, and appended prose would corrupt the
 * contract. Tone policy applies to conversational outputs, not to
 * machine-format extraction. Recorded exception, not an oversight.
 */
export const KEYWORDS_SYSTEM =
  "You are an education domain expert. Generate a comprehensive list of relevant course domain keywords for a given field of study. Return ONLY a comma-separated list of ALL possible keywords, no explanations.";

export function buildKeywordsMessages(field: string): Array<{ role: "system" | "user"; content: string }> {
  const trimmed = field.trim();
  return [
    { role: "system", content: KEYWORDS_SYSTEM },
    {
      role: "user",
      content:
        `Field of Study: "${trimmed}"\n\nGenerate a comprehensive list of ALL possible domain keywords that represent this field. Include:\n` +
        `1. Core subjects and topics\n2. Technical skills and competencies\n3. Industry-specific tools and technologies\n` +
        `4. Career domains and job roles\n5. Related disciplines and specializations\n6. Soft skills relevant to this field\n` +
        `7. Certifications and qualifications\n8. Industry terminology\n\nBe thorough and comprehensive. Return ONLY the comma-separated keywords, nothing else.`,
    },
  ];
}

export function buildFieldKeywordPrompt(field: string): PlatformPrompt {
  const messages = buildKeywordsMessages(field);
  return PlatformPromptSchema.parse({ id: 'careerTalentStrategist.keywords', version: '1.0.0', system: messages[0].content, user: messages[1].content });
}
