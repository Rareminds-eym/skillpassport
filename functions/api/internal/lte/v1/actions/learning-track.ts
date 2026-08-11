import { z } from 'zod';
import type { GatewayAction } from '../types';

const PayloadSchema = z.object({ userId: z.string().uuid('userId must be a valid UUID') });

/**
 * Returns the learner's best-fit track from their latest COMPLETED personal
 * assessment, sourced from `personal_assessment_results.career_fit`:
 *   - primary:  career_fit.clusters[0]  (deterministic match score + fit band)
 *   - fallback: career_fit.specificOptions.highFit[0]  (name + whyThisRole)
 *
 * READ-ONLY: only SELECTs via `ctx.db` (readonly-db). Never writes.
 */
interface CareerClusterShape {
  title?: unknown;
  matchScore?: unknown;
  fit?: unknown;
  whyItFits?: unknown;
  examples?: unknown;
  occupationIds?: unknown;
}

interface CareerFitShape {
  clusters?: CareerClusterShape[] | null;
  specificOptions?: { highFit?: Array<{ name?: unknown; whyThisRole?: unknown; occupationId?: unknown }> | null } | null;
}

interface AssessmentResultRow {
  attempt_id: string;
  career_fit: CareerFitShape | null;
}

interface TrackPayload {
  attemptId: string;
  roleId?: string;
  roleName: string;
  trackName: string;
  fit: 'High' | 'Medium' | 'Explore';
  matchScore: number;
  whyItFits: string;
  industry?: string;
}

function pickTracks(careerFit: CareerFitShape | null): Array<Omit<TrackPayload, 'attemptId' | 'roleId'> & { roleId?: string; trackName: string }> {
  const tracks: Array<Omit<TrackPayload, 'attemptId' | 'roleId'> & { roleId?: string; trackName: string }> = [];

  const clusters = careerFit?.clusters;
  if (Array.isArray(clusters)) {
    for (const cluster of clusters) {
      if (cluster && typeof cluster.title === 'string' && cluster.title.trim().length > 0) {
        const fit = cluster.fit === 'High' || cluster.fit === 'Medium' || cluster.fit === 'Explore'
          ? cluster.fit
          : 'Explore';

        const occupationIds = cluster.occupationIds;
        const examples = cluster.examples;

        if (Array.isArray(occupationIds) && occupationIds.length > 0) {
          for (let j = 0; j < occupationIds.length; j++) {
            const roleId = occupationIds[j];
            if (typeof roleId === 'string') {
              const roleName = Array.isArray(examples) && typeof examples[j] === 'string'
                ? examples[j]
                : cluster.title;

              tracks.push({
                roleId,
                roleName,
                trackName: cluster.title,
                fit,
                matchScore: typeof cluster.matchScore === 'number' ? cluster.matchScore : 0,
                whyItFits: typeof cluster.whyItFits === 'string' ? cluster.whyItFits : '',
              });
            }
          }
        } else {
          tracks.push({
            roleName: cluster.title,
            trackName: cluster.title,
            fit,
            matchScore: typeof cluster.matchScore === 'number' ? cluster.matchScore : 0,
            whyItFits: typeof cluster.whyItFits === 'string' ? cluster.whyItFits : '',
          });
        }
      }
    }
  }

  // If no clusters matched, fallback to highFit specific option
  if (tracks.length === 0) {
    const highFit = careerFit?.specificOptions?.highFit?.[0];
    if (highFit && typeof highFit.name === 'string' && highFit.name.trim().length > 0) {
      tracks.push({
        roleId: typeof highFit.occupationId === 'string' ? highFit.occupationId : undefined,
        roleName: highFit.name,
        trackName: highFit.name,
        fit: 'Explore',
        matchScore: 0,
        whyItFits: typeof highFit.whyThisRole === 'string' ? highFit.whyThisRole : '',
      });
    }
  }

  return tracks;
}

export const handleLearningTrack: GatewayAction = async (ctx, rawPayload) => {
  const parsed = PayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message ?? 'Invalid payload',
      },
    };
  }

  const { userId } = parsed.data;
  if (userId !== ctx.userId) {
    return {
      ok: false,
      error: { code: 'FORBIDDEN', message: 'Requested user does not match the authenticated claim' },
    };
  }

  // 1. Resolve Skill learner from the SSO user id (read-only).
  const learner = await ctx.db.queryOne<{ id: string }>(
    `learners?user_id=eq.${encodeURIComponent(userId)}&select=id`,
  );
  if (!learner) {
    return { ok: true, data: { found: false } };
  }

  // 2. Latest COMPLETED assessment result (read-only).
  const result = await ctx.db.queryOne<AssessmentResultRow>(
    `personal_assessment_results?learner_id=eq.${encodeURIComponent(learner.id)}` +
      '&status=eq.completed&select=attempt_id,career_fit&order=updated_at.desc&limit=1',
  );
  if (!result) {
    return { ok: true, data: { found: false } };
  }

  // 3. Extract best-fit tracks from career_fit.
  const tracks = pickTracks(result.career_fit);
  if (tracks.length === 0) {
    return { ok: true, data: { found: false } };
  }

  // Fetch industries for the roles
  const roleIds = tracks.map((t) => t.roleId).filter((id): id is string => typeof id === 'string');
  const industryMap = new Map<string, string>();
  if (roleIds.length > 0) {
    try {
      const dbRoles = await ctx.db.query<any>(
        `role_family_roles?id=in.(${roleIds.join(',')})&select=id,role_family_domains(industry_domains(industries(name)))`
      );
      for (const row of dbRoles) {
        const rfd = Array.isArray(row.role_family_domains) ? row.role_family_domains[0] : row.role_family_domains;
        const idom = rfd ? (Array.isArray(rfd.industry_domains) ? rfd.industry_domains[0] : rfd.industry_domains) : null;
        const ind = idom ? (Array.isArray(idom.industries) ? idom.industries[0] : idom.industries) : null;
        const indName = ind?.name;
        if (typeof indName === 'string') {
          industryMap.set(row.id, indName);
        }
      }
    } catch (err) {
      // Degrade gracefully if DB query fails
      console.warn('Failed to query industry info for roles', err);
    }
  }

  // Attach industry to tracks
  for (const track of tracks) {
    if (track.roleId) {
      const ind = industryMap.get(track.roleId);
      if (ind) {
        track.industry = ind;
      }
    }
  }

  const primaryTrack = tracks[0];

  return {
    ok: true,
    data: {
      found: true,
      track: primaryTrack ? { attemptId: result.attempt_id, roleId: primaryTrack.roleId, ...primaryTrack } : undefined,
      tracks: tracks.map((t) => ({ attemptId: result.attempt_id, roleId: t.roleId, ...t })),
    },
  };
};
