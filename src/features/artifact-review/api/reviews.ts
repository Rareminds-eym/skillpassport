import { z } from "zod";
import { ssoClient } from "@/shared/api/ssoClient";

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

export async function fetchAdminScopes() {
  return z
    .object({
      scopes: z.array(
        z.object({
          scopeId: z.string().uuid(),
          scopeType: z.enum(["school_class", "college_program"]),
          name: z.string(),
        }),
      ),
    })
    .parse(await request("operations/scopes")).scopes;
}
export async function fetchAdminBacklog(scopeId: string, page: number) {
  return z
    .object({
      items: z.array(reviewSchema),
      page: z.number(),
      hasMore: z.boolean(),
      stats:z.object({ unassigned:z.number(),overdue:z.number(),pendingEvents:z.number(),oldestRequiredAt:z.string().nullable(),oldestPendingEventAt:z.string().nullable() }),
    })
    .parse(
      await request(
        `operations?scopeId=${encodeURIComponent(scopeId)}&page=${page}`,
      ),
    );
}
export async function fetchReassignment(id: string) {
  return z
    .object({
      review: reviewSchema,
      candidates: z.array(
        z.object({ id: z.string().uuid(), label: z.string() }),
      ),
    })
    .parse(await request(`operations/${id}`));
}
export async function reassignReview(
  id: string,
  body: { expectedVersion: number; reviewerId: string; reason: string },
) {
  return request(`operations/${id}/reassign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
