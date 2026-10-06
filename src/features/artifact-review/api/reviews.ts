import { ssoClient } from "@/shared/api/ssoClient";
import { z } from "zod";

export const reviewSchema = z.object({
  reviewer_id: z.string().uuid().nullable(),
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  learner_id: z.string().uuid(),
  status: z.enum([
    "pending",
    "in_progress",
    "completed",
    "returned",
    "unassigned",
  ]),
  version: z.number(),
  due_by: z.string().nullable(),
  scope_type: z.string().nullable(),
  rubric_snapshot: z.object({
    version: z.number(),
    criteria: z.array(
      z.object({ id: z.string(), label: z.string(), maxScore: z.number() }),
    ),
  }),
});
const detailSchema = z.object({
  review: reviewSchema,
  submission: z.object({ attempt_no: z.number(), status: z.string() }),
  learner: z.object({
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
  }),
  questions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      instructions: z.unknown(),
    }),
  ),
  answers: z.array(
    z.object({
      question_id: z.string(),
      text_response: z.string().nullable(),
      url_response: z.string().nullable(),
    }),
  ),
  templates: z.array(
    z.object({
      id: z.string(),
      file_name: z.string(),
      file_url: z.string(),
      version: z.union([z.string(), z.number()]).nullable(),
    }),
  ),
  files: z.array(z.object({ id: z.string(), file_name: z.string() })),
  evaluations: z.array(
    z.object({
      stage: z.string(),
      score: z.number().nullable(),
      feedback: z.string().nullable(),
      decision: z.string().nullable(),
    }),
  ),
});
export type Review = z.infer<typeof reviewSchema>;
export type ReviewDetail = z.infer<typeof detailSchema>;
export class ReviewApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request(path: string, init?: RequestInit) {
  const response = await ssoClient.fetch(`/api/lte-reviews/${path}`, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = z
      .object({ error: z.object({ message: z.string() }) })
      .safeParse(body);
    throw new ReviewApiError(
      failure.success
        ? failure.data.error.message
        : "Review service unavailable",
      response.status,
    );
  }
  return body;
}
export async function fetchReviewQueue(cursor: string | null = null) {
  return z
    .object({
      items: z.array(reviewSchema),
      nextCursor: z.string().nullable(),
      hasMore: z.boolean(),
    })
    .parse(
      await request(
        `queue${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
      ),
    );
}
export async function fetchReview(id: string) {
  return detailSchema.parse(await request(encodeURIComponent(id)));
}
export async function startReview(review: Review) {
  return request(`${review.id}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expectedVersion: review.version }),
  });
}
export async function completeReview(id: string, body: unknown, key: string) {
  return request(`${id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(body),
  });
}
export async function downloadReviewFile(
  reviewId: string,
  file: { id: string; file_name: string },
) {
  const response = await ssoClient.fetch(
    `/api/lte-reviews/${reviewId}/files/${file.id}/download`,
  );
  if (!response.ok)
    throw new ReviewApiError("Unable to download this file", response.status);
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.file_name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------------------------------------------------------------------------
 * Administrator: every review of the organization, and assigning educators.
 * The administrator never reviews; educators do.
 * ------------------------------------------------------------------------- */
export const REVIEW_VIEWS = ["all", "unassigned", "overdue", "active", "completed", "returned"] as const;
export type ReviewView = (typeof REVIEW_VIEWS)[number];

const reviewStatus = z.enum(["unassigned", "pending", "in_progress", "completed", "returned"]);
export type ReviewStatus = z.infer<typeof reviewStatus>;

export const adminReviewSchema = z.object({
  id: z.string().uuid(),
  status: reviewStatus,
  version: z.number(),
  reason: z.string(),
  overdue: z.boolean(),
  scopeId: z.string().uuid().nullable(),
  requiredAt: z.string(),
  assignedAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  dueBy: z.string().nullable(),
  attemptNo: z.number(),
  submittedAt: z.string().nullable(),
  artifactType: z.string().nullable(),
  moduleTitle: z.string().nullable(),
  levelTitle: z.string().nullable(),
  outcomeDecision: z.string().nullable(),
  outcomeScore: z.number().nullable(),
  learner: z.object({
    name: z.string(),
    email: z.string().nullable(),
    scopeName: z.string().nullable(),
    organizationId: z.string().uuid().nullable(),
  }),
  reviewer: z.object({ id: z.string().uuid(), name: z.string(), active: z.boolean() }).nullable(),
});
export type AdminReview = z.infer<typeof adminReviewSchema>;

const overviewSchema = z.object({
  organizations: z.array(
    z.object({ id: z.string().uuid(), name: z.string(), orgType: z.enum(["school", "college"]) }),
  ),
  educatorCount: z.number(),
  truncated: z.boolean(),
  stats: z.object({
    total: z.number(),
    unassigned: z.number(),
    overdue: z.number(),
    active: z.number(),
    completed: z.number(),
    returned: z.number(),
    oldestUnassignedAt: z.string().nullable(),
  }),
  items: z.array(adminReviewSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean(),
});
export type ReviewOverview = z.infer<typeof overviewSchema>;

export async function fetchReviewOverview(query: { view: ReviewView; q: string; page: number }) {
  const params = new URLSearchParams({ view: query.view, page: String(query.page) });
  if (query.q.trim()) params.set("q", query.q.trim());
  return overviewSchema.parse(await request(`operations/overview?${params}`));
}

const reviewDetailSchema = z.object({
  review: adminReviewSchema,
  assignable: z.boolean(),
  timeline: z.array(
    z.object({
      action: z.string(),
      at: z.string(),
      actorName: z.string().nullable(),
      reason: z.string().nullable(),
      reviewerName: z.string().nullable(),
    }),
  ),
  candidates: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().nullable(),
      openReviews: z.number(),
    }),
  ),
});
export type AdminReviewDetail = z.infer<typeof reviewDetailSchema>;

export async function fetchAdminReviewDetail(id: string) {
  return reviewDetailSchema.parse(await request(`operations/${encodeURIComponent(id)}`));
}

export async function assignEducator(
  id: string,
  body: { expectedVersion: number; reviewerId: string; reason: string },
) {
  return request(`operations/${encodeURIComponent(id)}/reassign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type EvaluationMode = "ai_first" | "human_only";
const settingsEnvelope = <T extends z.ZodType>(data: T) =>
  z.object({ success: z.literal(true), data });

async function settingsRequest(init?: RequestInit) {
  const response = await ssoClient.fetch("/api/lte-review-settings", init);
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new ReviewApiError(
      "Unable to load or save the evaluation setting",
      response.status,
    );
  return body;
}
export async function fetchEvaluationSettings() {
  return settingsEnvelope(
    z.object({
      organizations: z.array(
        z.object({
          organizationId: z.string().uuid(),
          orgType: z.enum(["school", "college"]),
          name: z.string(),
          evaluationMode: z.enum(["ai_first", "human_only"]),
        }),
      ),
      // Classes/programs: only used to choose reviewers and view the backlog.
      scopes: z.array(
        z.object({
          scopeId: z.string().uuid(),
          scopeType: z.enum(["school_class", "college_program"]),
          name: z.string(),
        }),
      ),
    }),
  ).parse(await settingsRequest()).data;
}
/** One choice for the whole organization (school or college). */
export async function saveEvaluationMode(body: {
  organizationId: string;
  evaluationMode: EvaluationMode;
}) {
  return settingsRequest({
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type ReviewScopeRef = {
  scopeId: string;
  scopeType: "school_class" | "college_program";
};
const reviewerErrors: Record<string, string> = {
  INVALID_REVIEWER: "Choose an active educator of your organization.",
  TOO_MANY_REVIEWERS: "This class or program already has the maximum number of reviewers.",
};
async function reviewersRequest(query: string, init?: RequestInit) {
  const response = await ssoClient.fetch(`/api/lte-review-scope-reviewers${query}`, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code = z
      .object({ error: z.object({ code: z.string() }) })
      .safeParse(body);
    throw new ReviewApiError(
      (code.success && reviewerErrors[code.data.error.code]) ||
      "Unable to update reviewers. Try again.",
      response.status,
    );
  }
  return body;
}
const scopeQuery = (ref: ReviewScopeRef) =>
  `?scopeId=${encodeURIComponent(ref.scopeId)}&scopeType=${ref.scopeType}`;

export async function fetchScopeReviewers(ref: ReviewScopeRef) {
  return settingsEnvelope(
    z.object({
      teachingCount: z.number(),
      designatedCount: z.number(),
      educators: z.array(
        z.object({
          userId: z.string().uuid(),
          name: z.string(),
          email: z.string().nullable(),
          designated: z.boolean(),
          teaching: z.boolean(),
        }),
      ),
    }),
  ).parse(await reviewersRequest(scopeQuery(ref))).data;
}
export async function addScopeReviewer(ref: ReviewScopeRef, reviewerId: string) {
  return reviewersRequest("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...ref, reviewerId }),
  });
}
export async function removeScopeReviewer(ref: ReviewScopeRef, reviewerId: string) {
  return reviewersRequest(`${scopeQuery(ref)}&reviewerId=${encodeURIComponent(reviewerId)}`, {
    method: "DELETE",
  });
}
