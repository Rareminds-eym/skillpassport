import { describe, expect, it, vi } from 'vitest';
import type { GatewayContext } from '../../../../../api/internal/lte/v1/types';
import { handlePing } from '../../../../../api/internal/lte/v1/actions/ping';
import { handleLearningTrack } from '../../../../../api/internal/lte/v1/actions/learning-track';
import { handleLearnerStatus } from '../../../../../api/internal/lte/v1/actions/learner-status';

describe('Gateway Actions Registry Handlers', () => {
  const userId = '22222222-2222-4222-8222-222222222222';
  const learnerId = '33333333-3333-4333-8333-333333333333';
  const attemptId = '44444444-4444-4444-a444-444444444444';

  const createMockContext = (dbMocks: { query?: any; queryOne?: any }): GatewayContext => ({
    db: {
      query: dbMocks.query ?? vi.fn(),
      queryOne: dbMocks.queryOne ?? vi.fn(),
    },
    env: {} as any,
    request: new Request('https://example.test'),
    requestId: 'test-req-id',
    userId,
  });

  describe('ping action', () => {
    it('should respond with pong and request context details', async () => {
      const ctx = createMockContext({});
      const result = await handlePing(ctx, {});
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveProperty('pong', true);
        expect(result.data).toHaveProperty('requestId', 'test-req-id');
      }
    });
  });

  describe('learning-track:get action', () => {
    it('should validate format of payload and fail if invalid userId', async () => {
      const ctx = createMockContext({});
      const result = await handleLearningTrack(ctx, { userId: 'not-a-uuid' });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should forbid action if requested userId does not match context claims sub', async () => {
      const ctx = createMockContext({});
      const anotherUserId = '55555555-5555-5555-5555-555555555555';
      const result = await handleLearningTrack(ctx, { userId: anotherUserId });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });

    it('should return found: false if learner profile does not exist in SkillPassport', async () => {
      const queryOne = vi.fn().mockResolvedValue(null);
      const ctx = createMockContext({ queryOne });

      const result = await handleLearningTrack(ctx, { userId });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ found: false });
      }
      expect(queryOne).toHaveBeenCalledWith(expect.stringContaining(`learners?user_id=eq.${userId}`));
    });

    it('should return found: false if no completed assessment results exist', async () => {
      const queryOne = vi.fn().mockImplementation((path: string) => {
        if (path.includes('learners?user_id=')) return { id: learnerId };
        if (path.includes('personal_assessment_results?')) return null;
        return null;
      });
      const ctx = createMockContext({ queryOne });

      const result = await handleLearningTrack(ctx, { userId });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ found: false });
      }
    });

    it('should parse career_fit clusters and return primary fit details', async () => {
      const careerFit = {
        clusters: [
          {
            title: 'Backend Operations Support',
            examples: ['Backend Engineer'],
            occupationIds: ['a5a29608-4629-5e5d-b798-506da01fe222'],
            fit: 'High',
            matchScore: 95,
            whyItFits: 'Strong logical reasoning and systems skills.',
          },
        ],
      };
      const queryOne = vi.fn().mockImplementation((path: string) => {
        if (path.includes('learners?user_id=')) return { id: learnerId };
        if (path.includes('personal_assessment_results?')) {
          return { attempt_id: attemptId, career_fit: careerFit };
        }
        return null;
      });
      const ctx = createMockContext({ queryOne });

      const result = await handleLearningTrack(ctx, { userId });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({
          found: true,
          track: {
            attemptId,
            roleId: 'a5a29608-4629-5e5d-b798-506da01fe222',
            roleName: 'Backend Engineer',
            trackName: 'Backend Operations Support',
            fit: 'High',
            matchScore: 95,
            whyItFits: 'Strong logical reasoning and systems skills.',
          },
          tracks: [
            {
              attemptId,
              roleId: 'a5a29608-4629-5e5d-b798-506da01fe222',
              roleName: 'Backend Engineer',
              trackName: 'Backend Operations Support',
              fit: 'High',
              matchScore: 95,
              whyItFits: 'Strong logical reasoning and systems skills.',
            },
          ],
        });
      }
    });

    it('should fall back to specificOptions highFit if clusters array is empty or missing title', async () => {
      const careerFit = {
        clusters: [],
        specificOptions: {
          highFit: [
            {
              name: 'Frontend Developer',
              occupationId: 'b47ea8c8-73a7-511b-8773-a328c6a4db78',
              whyThisRole: 'Excellent UI craft and user empathy.',
            },
          ],
        },
      };
      const queryOne = vi.fn().mockImplementation((path: string) => {
        if (path.includes('learners?user_id=')) return { id: learnerId };
        if (path.includes('personal_assessment_results?')) {
          return { attempt_id: attemptId, career_fit: careerFit };
        }
        return null;
      });
      const ctx = createMockContext({ queryOne });

      const result = await handleLearningTrack(ctx, { userId });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({
          found: true,
          track: {
            attemptId,
            roleId: 'b47ea8c8-73a7-511b-8773-a328c6a4db78',
            roleName: 'Frontend Developer',
            trackName: 'Frontend Developer',
            fit: 'Explore',
            matchScore: 0,
            whyItFits: 'Excellent UI craft and user empathy.',
          },
          tracks: [
            {
              attemptId,
              roleId: 'b47ea8c8-73a7-511b-8773-a328c6a4db78',
              roleName: 'Frontend Developer',
              trackName: 'Frontend Developer',
              fit: 'Explore',
              matchScore: 0,
              whyItFits: 'Excellent UI craft and user empathy.',
            },
          ],
        });
      }
    });
  });

  describe('learner:status action', () => {
    it('should return empty status flags if learner does not exist', async () => {
      const queryOne = vi.fn().mockResolvedValue(null);
      const ctx = createMockContext({ queryOne });

      const result = await handleLearnerStatus(ctx, { userId });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ hasAssessment: false, hasInProgressAssessment: false });
      }
    });

    it('should query completed assessments and in-progress attempts correctly', async () => {
      const queryOne = vi.fn().mockImplementation((path: string) => {
        if (path.includes('learners?user_id=')) return { id: learnerId };
        if (path.includes('personal_assessment_results?')) return { id: 'result-id' };
        if (path.includes('personal_assessment_attempts?')) return { id: 'attempt-id' };
        return null;
      });
      const ctx = createMockContext({ queryOne });

      const result = await handleLearnerStatus(ctx, { userId });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ hasAssessment: true, hasInProgressAssessment: true });
      }
    });
  });
});
