// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildWorksheetPrompt } from '../worksheet-templates';
import { buildLessonPlanPrompt } from '../lesson-plan-templates';
import { DEFAULT_WORKSHEET_CONFIG } from '../../types/worksheet';
import { DEFAULT_LESSON_PLAN_CONFIG } from '../../types/lesson-plan';
import { buildSystemPrompt, type CourseContext } from '../course-context';
const context: CourseContext = { courseTitle: 'Time management', courseDescription: '', courseCode: 'TM', currentModule: null, currentLesson: null, availableResources: [], learnerProgress: { completedLessons: [], currentLessonStatus: null, totalLessons: 0, completionPercentage: 0 }, allModules: [], allLessons: [], videoSummary: null };
describe('mapped teaching level prompts', () => {
  it('includes the mapped grade in worksheet prompts', () => {
    expect(buildWorksheetPrompt({ ...DEFAULT_WORKSHEET_CONFIG, gradeLevel: 'College/University' }, context)).toContain('Teaching level: College/University');
  });
  it('includes the mapped grade in lesson plan prompts and both passes', () => {
    const config = { ...DEFAULT_LESSON_PLAN_CONFIG, gradeLevel: 'Grade 8' };
    expect(buildLessonPlanPrompt(config, context)).toContain('Teaching level: Grade 8');
    expect(buildLessonPlanPrompt(config, context, true)).toContain('Teaching level: Grade 8');
    expect(buildLessonPlanPrompt(config, context, true, 'Lesson outline')).toContain('Teaching level: Grade 8');
  });
  it('uses conversational educator instructions when no generation config was supplied', () => {
    const prompt = buildSystemPrompt(context, 'opening', 'college_educator');
    expect(prompt).toContain("Answer the educator's current question directly");
    expect(prompt).not.toContain('Worksheet format:');
    expect(prompt).not.toContain('Create high-quality worksheets');
    expect(prompt).toContain('Use verified assignment context only');
  });
  it('preserves learner instructions and rejects educator-like role strings', () => {
    for (const role of ['learner', 'not_an_educator']) {
      const prompt = buildSystemPrompt(context, 'opening', role, DEFAULT_WORKSHEET_CONFIG, DEFAULT_LESSON_PLAN_CONFIG, 'organizer');
      expect(prompt).toContain('helpful course tutor for learners');
      expect(prompt).not.toContain('GLOBAL RULES');
    }
  });
  it('retains selected question counts and private-answer format under CREATE', () => {
    const prompt = buildSystemPrompt(context, 'opening', 'educator', {...DEFAULT_WORKSHEET_CONFIG,questionCount:15,gradeLevel:'Grade 9'}, undefined, 'individualized-support');
    expect(prompt).toContain('ROLE: CREATE');
    expect(prompt).toContain('15');
    expect(prompt).toContain('Teaching level: Grade 9');
    expect(prompt).not.toContain('ROLE: ADAPT');
  });

});
