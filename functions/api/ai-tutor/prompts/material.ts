import { PlatformPromptSchema, PlatformPromptTemplateSchema, type EducatorMaterialInput } from '@rareminds-eym/ai-protocol';
import { buildWorksheetPrompt } from './worksheet';
import { buildLessonPlanPrompt, buildLessonPlanFromOutlinePrompt } from './lesson-plan';

export function buildMaterialPrompts(input: Pick<EducatorMaterialInput, 'course' | 'message' | 'worksheetConfig' | 'lessonPlanConfig'>): NonNullable<EducatorMaterialInput['prompts']> {
  const id = 'seniorEducator.generate-material';
  const version = '1.0.0';
  if (input.lessonPlanConfig?.useTwoPass) {
    // The controlled marker is inserted after the course text; take its last occurrence.
    const marker = '__PRODUCT_OUTLINE_SLOT_7a5bd8__';
    const final = buildLessonPlanFromOutlinePrompt(input.lessonPlanConfig, input.course, marker);
    const at = final.lastIndexOf(marker);
    if (at < 0) throw new Error('Material outline slot is unavailable');
    return {
      outline: PlatformPromptSchema.parse({ id: `${id}.outline`, version, user: buildLessonPlanPrompt(input.lessonPlanConfig, input.course, true) }),
      final: PlatformPromptTemplateSchema.parse({ id: `${id}.final`, version, parts: [{ text: final.slice(0, at) }, { slot: 'outline' }, { text: final.slice(at + marker.length) }] }),
    };
  }
  const system = input.lessonPlanConfig ? buildLessonPlanPrompt(input.lessonPlanConfig, input.course) : input.worksheetConfig ? buildWorksheetPrompt(input.worksheetConfig, input.course) : null;
  if (!system) throw new Error('Material configuration is required');
  return { single: PlatformPromptSchema.parse({ id, version, system, user: input.message }) };
}
