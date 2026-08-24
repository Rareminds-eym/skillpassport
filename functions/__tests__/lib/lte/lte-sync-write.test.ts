import { describe, expect, it } from 'vitest';
import type { WriteDb } from '../../../api/internal/lte/v1/write-db';
import { upsertSingleProgressPayload } from '../../../lib/lte/lte-sync-write';

interface TrainingRow extends Record<string, unknown> {
  id: string;
  learner_id: string;
  source: string;
  lte_course_id: string;
  title: string;
  status: string;
  completed_modules: number;
  total_modules: number;
  hours_spent: number;
  duration: string;
  resume_url: string | null;
  approval_status: string;
  lte_course_code: string | null;
  lte_levels: unknown;
  lte_current_level: number;
  lte_total_levels: number;
}

interface SkillRow extends Record<string, unknown> {
  id: string;
  learner_id: string;
  name: string;
  type: string;
  level: number;
  training_id: string | null;
  verified: boolean;
  approval_status: string;
  source: string;
}

function createFakeDb(initialTrainings: TrainingRow[] = [], initialSkills: SkillRow[] = []) {
  const trainings: TrainingRow[] = [...initialTrainings];
  const skills: SkillRow[] = [...initialSkills];

  const db: WriteDb = {
    queryOne: async (path) => {
      const p = String(path);

      if (p.startsWith('trainings')) {
        const match = /lte_course_id=eq\.([^&]+)/.exec(p);
        const courseId = match ? decodeURIComponent(match[1]) : null;
        return (trainings.find((t) => t.lte_course_id === courseId) as any) ?? null;
      }

      if (p.startsWith('skills')) {
        const matchName = /name=eq\.([^&]+)/.exec(p);
        const skillName = matchName ? decodeURIComponent(matchName[1]) : null;
        return (skills.find((s) => s.name === skillName) as any) ?? null;
      }

      return null;
    },
    query: async () => trainings,
    insert: async (table, row) => {
      if (table === 'trainings') {
        const newRow = { id: `tr-${trainings.length + 1}`, ...(row as TrainingRow) };
        trainings.push(newRow);
        return newRow as any;
      }
      if (table === 'skills') {
        const newRow = { id: `sk-${skills.length + 1}`, ...(row as SkillRow) };
        skills.push(newRow);
        return newRow as any;
      }
      return null;
    },
    update: async (table, id, patch) => {
      if (table === 'trainings') {
        const idx = trainings.findIndex((r) => r.id === id);
        if (idx >= 0) trainings[idx] = { ...trainings[idx], ...patch };
        return true;
      }
      if (table === 'skills') {
        const idx = skills.findIndex((r) => r.id === id);
        if (idx >= 0) skills[idx] = { ...skills[idx], ...patch };
        return true;
      }
      return true;
    },
  };

  return { db, trainings, skills };
}

describe('upsertSingleProgressPayload', () => {
  it('throws error when lteCourseId and levelId are missing', async () => {
    const { db } = createFakeDb();
    await expect(upsertSingleProgressPayload(db, 'learner-1', {})).rejects.toThrow(
      'Missing lteCourseId in queue payload',
    );
  });

  it('inserts a new LTE training course row and earned skills from queue snapshot payload', async () => {
    const { db, trainings, skills } = createFakeDb();
    const payload = {
      lteCourseId: 'course-101',
      courseTitle: 'Fullstack GenAI Development',
      lteCourseCode: 'LTE-GENAI-101',
      status: 'in_progress',
      completedModules: 3,
      totalModules: 10,
      durationHours: 5,
      totalDurationHours: 40,
      resumeUrl: '/my-courses/LTE-GENAI-101',
      levels: [
        { id: 'lvl-1', code: 'L1', title: 'Foundation', status: 'completed', completionPercentage: 100 },
        { id: 'lvl-2', code: 'L2', title: 'Advanced Prompting', status: 'in_progress', completionPercentage: 50 },
      ],
      earnedSkills: ['Prompt Engineering', 'LangChain'],
    };

    const result = await upsertSingleProgressPayload(db, 'learner-1', payload);
    expect(result).toEqual({ synced: true, trainingId: 'tr-1' });

    expect(trainings).toHaveLength(1);
    expect(trainings[0]).toMatchObject({
      source: 'lte',
      lte_course_id: 'course-101',
      title: 'Fullstack GenAI Development',
      organization: 'Rareminds LTE',
      status: 'ongoing',
      completed_modules: 3,
      total_modules: 10,
      hours_spent: 5,
      duration: '40 hrs',
      resume_url: '/my-courses/LTE-GENAI-101',
      lte_course_code: 'LTE-GENAI-101',
      lte_current_level: 2,
      lte_total_levels: 2,
    });

    expect(skills).toHaveLength(2);
    expect(skills.map((s) => s.name)).toEqual(['Prompt Engineering', 'LangChain']);
    expect(skills[0]).toMatchObject({
      learner_id: 'learner-1',
      type: 'technical',
      level: 2,
      training_id: 'tr-1',
      verified: true,
      approval_status: 'approved',
      source: 'lte',
    });
  });

  it('updates existing training course when new module is completed', async () => {
    const { db, trainings } = createFakeDb([
      {
        id: 'tr-existing',
        learner_id: 'learner-1',
        source: 'lte',
        lte_course_id: 'course-101',
        title: 'Fullstack GenAI Development',
        status: 'ongoing',
        completed_modules: 3,
        total_modules: 10,
        hours_spent: 5,
        duration: '40 hrs',
        resume_url: '/my-courses/LTE-GENAI-101',
        approval_status: 'approved',
        lte_course_code: 'LTE-GENAI-101',
        lte_levels: null,
        lte_current_level: 2,
        lte_total_levels: 2,
      },
    ]);

    const updatedPayload = {
      lteCourseId: 'course-101',
      courseTitle: 'Fullstack GenAI Development',
      status: 'completed',
      completedModules: 10,
      totalModules: 10,
      durationHours: 40,
    };

    const result = await upsertSingleProgressPayload(db, 'learner-1', updatedPayload);
    expect(result).toEqual({ synced: true, trainingId: 'tr-existing' });

    expect(trainings[0].completed_modules).toBe(10);
    expect(trainings[0].status).toBe('completed');
  });

  it('prevents stale lower module progress from overwriting higher progress', async () => {
    const { db, trainings } = createFakeDb([
      {
        id: 'tr-existing',
        learner_id: 'learner-1',
        source: 'lte',
        lte_course_id: 'course-101',
        title: 'Fullstack GenAI Development',
        status: 'completed',
        completed_modules: 10,
        total_modules: 10,
        hours_spent: 40,
        duration: '40 hrs',
        resume_url: '/my-courses/LTE-GENAI-101',
        approval_status: 'approved',
        lte_course_code: 'LTE-GENAI-101',
        lte_levels: null,
        lte_current_level: 2,
        lte_total_levels: 2,
      },
    ]);

    const stalePayload = {
      lteCourseId: 'course-101',
      status: 'in_progress',
      completedModules: 2,
      totalModules: 10,
    };

    await upsertSingleProgressPayload(db, 'learner-1', stalePayload);

    // Progress and completed status are preserved
    expect(trainings[0].completed_modules).toBe(10);
    expect(trainings[0].status).toBe('completed');
  });
});
