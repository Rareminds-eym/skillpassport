import { describe, expect, it } from 'vitest';
import type { TutorCourseContext, WorksheetConfig, LessonPlanConfig } from '@rareminds-eym/ai-protocol';
import { buildWorksheetPrompt } from '../worksheet';
import { buildLessonPlanPrompt, buildLessonPlanOutlinePrompt, buildLessonPlanFromOutlinePrompt } from '../lesson-plan';
import { buildMaterialPrompts } from '../material';
const course: TutorCourseContext = {
  courseTitle: "Biology 101",
  courseDescription: "Intro to cells and systems.",
  courseCode: "BIO101",
  currentModule: { moduleId: "m1", title: "Cells", description: null, orderIndex: 0 },
  currentLesson: {
    lessonId: "l1",
    title: "Mitosis",
    description: null,
    content: "Cell division in stages.",
    duration: null,
    orderIndex: 0,
    moduleTitle: "Cells",
  },
  availableResources: [],
  learnerProgress: { completedLessons: [], currentLessonStatus: null, totalLessons: 4, completionPercentage: 0 },
  allModules: [],
  allLessons: [],
  videoSummary: null,
};

const worksheet: WorksheetConfig = {
  templateType: "multiple_choice",
  difficulty: "medium",
  gradeLevel: "",
  questionCount: 10,
  includeAnswerKey: true,
  includeRubric: false,
  includeExtension: false,
  topic: "",
};

const lessonPlan: LessonPlanConfig = {
  templateType: "standard",
  duration: 45,
  subject: "",
  gradeLevel: "",
  includeTimestamps: true,
  includeLearningObjectives: true,
  includeStandards: false,
  includeMaterials: true,
  includeWarmUp: true,
  includeDirectInstruction: true,
  includeGuidedPractice: true,
  includeIndependentPractice: true,
  includeAssessment: true,
  includeDifferentiation: true,
  includeHomework: false,
  includeClosure: true,
  includeTeacherNotes: false,
  useTwoPass: false,
};

describe("worksheet prompt pack", () => {
  it("builds all six templates from course content", () => {
    const templates = [
      "comprehensive",
      "multiple_choice",
      "short_answer",
      "fill_in_blank",
      "true_false",
      "problem_solving",
    ] as const;
    for (const templateType of templates) {
      const prompt = buildWorksheetPrompt({ ...worksheet, templateType }, course);
      expect(prompt).toContain('"Biology 101"');
      expect(prompt).toContain("10");
    }
    expect(() =>
      buildWorksheetPrompt({ ...worksheet, templateType: "nope" } as never, course),
    ).toThrow("Unknown worksheet template type");
  });

  it("honors answer-key and rubric toggles", () => {
    expect(buildWorksheetPrompt(worksheet, course)).toContain("Answer Key:");
    expect(
      buildWorksheetPrompt({ ...worksheet, includeAnswerKey: false }, course),
    ).toContain("student-facing only");
  });
});

describe("lesson-plan prompt pack", () => {
  it("builds all four templates with duration math", () => {
    for (const templateType of ["standard", "udl", "5e", "project_based"] as const) {
      const prompt = buildLessonPlanPrompt({ ...lessonPlan, templateType }, course);
      expect(prompt).toContain("45-minute");
      expect(prompt).toContain('"Mitosis"');
    }
    // 5E phase minutes for a 45-minute plan: 7/14/11/9/5 with 5-min floors.
    const fiveE = buildLessonPlanPrompt({ ...lessonPlan, templateType: "5e" }, course);
    expect(fiveE).toContain("## ENGAGE (7 min)");
    expect(() =>
      buildLessonPlanPrompt({ ...lessonPlan, templateType: "nope" } as never, course),
    ).toThrow("Unknown lesson plan template type");
  });

  it("validates duration and course title like the source", () => {
    expect(() => buildLessonPlanPrompt({ ...lessonPlan, duration: 10 }, course)).toThrow(
      "at least 15 minutes",
    );
    expect(() =>
      buildLessonPlanPrompt(lessonPlan, { ...course, courseTitle: "  " }),
    ).toThrow("Course title is required");
  });

  it("builds outline and outline-grounded final prompts", () => {
    const outline = buildLessonPlanOutlinePrompt(lessonPlan, course);
    expect(outline).toContain("STRUCTURED OUTLINE");
    const final = buildLessonPlanFromOutlinePrompt(lessonPlan, course, "OUTLINE-TEXT");
    expect(final).toContain("USE THIS OUTLINE AS YOUR GUIDE");
    expect(final).toContain("OUTLINE-TEXT");
    expect(buildLessonPlanPrompt(lessonPlan, course, true)).toContain("STRUCTURED OUTLINE");
    expect(buildLessonPlanPrompt(lessonPlan, course, true, "OUTLINE-TEXT")).toContain("OUTLINE-TEXT");
    expect(buildLessonPlanPrompt(lessonPlan, course)).not.toContain("OUTLINE");
  });
});


describe('versioned material prompt payloads', () => {
  it('preserves single and dependent two-pass product templates', () => {
    const single = buildMaterialPrompts({ course, message: 'Create material', worksheetConfig: worksheet });
    expect(single.single?.system).toBe(buildWorksheetPrompt(worksheet, course));
    const two = buildMaterialPrompts({ course, message: 'Create material', lessonPlanConfig: { ...lessonPlan, useTwoPass: true } });
    expect(two.outline?.user).toBe(buildLessonPlanOutlinePrompt(lessonPlan, course));
    const rendered = two.final!.parts.map(part => 'text' in part ? part.text : 'OUTLINE-DOC').join('');
    expect(rendered).toBe(buildLessonPlanFromOutlinePrompt(lessonPlan, course, 'OUTLINE-DOC'));
  });
});