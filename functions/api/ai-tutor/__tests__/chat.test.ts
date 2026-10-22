import { describe, expect, it, vi } from "vitest";
import { handleAiTutorChat } from "../handlers/ai-tutor-chat.js";
import { videoIdentityHash } from '../../course/utils/video-job';
import { loadEnrolledCourse } from '../../internal/lesson-evidence';
import { loadAuthoringCourse } from '../../internal/authoring-course-evidence';
vi.mock('../../internal/lesson-evidence', () => ({ loadEnrolledCourse: vi.fn(), resolveCourseLesson: vi.fn() }));
vi.mock('../../internal/authoring-course-evidence', () => ({ loadAuthoringCourse: vi.fn(async () => null) }));

function makeSupabase(overrides: {
  learnerType?: string | null;
  existingMessages?: unknown[] | null;
  onWrite?: () => void;
  saveError?: boolean;
} = {}) {
  return {
    from(table: string) {
      if (table === "tutor_conversations") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: () => Promise.resolve({ data: overrides.existingMessages ? { messages: overrides.existingMessages } : null, error: null }),
                    };
                  },
                };
              },
            };
          },
          insert() {
            overrides.onWrite?.();
            return {
              select() {
                return {
                  single: () => Promise.resolve({ data: overrides.saveError ? null : { id: "new-conv" }, error: overrides.saveError ? { message: 'outage' } : null }),
                };
              },
            };
          },
        } as any;
      }
      if (table === "learners") {
        return {
          select() {
            return {
              eq() {
                return { maybeSingle: () => Promise.resolve({ data: overrides.learnerType ? { learner_type: overrides.learnerType } : null, error: null }) };
              },
            };
          },
        } as any;
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      } as any;
    },
    rpc: async () => { overrides.onWrite?.(); return { error: overrides.saveError ? { message: 'outage' } : null }; },
  } as any;
}

function makeCourseContext() {
  return {
    courseTitle: "Biology 101",
    courseDescription: "Desc",
    courseCode: "BIO101",
    currentModule: null,
    currentLesson: null,
    availableResources: [],
    learnerProgress: { completedLessons: [], currentLessonStatus: null, totalLessons: 0, completionPercentage: 0 },
    allModules: [],
    allLessons: [],
    videoSummary: null,
  };
}

function makeContext(body: unknown, user: { id: string; roles?: string[] } = { id: "learner-1", roles: ["learner"] }, env: Record<string, string> = {}): any {
  return {
    request: new Request("https://pages.local/api/ai-tutor/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    env: { AI_ASSERT_SECRET: "test-secret-min-32-chars-0000000000", SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k", ...env },
    data: { user: { sub: user.id, id: user.id, roles: user.roles, user_id: user.id } },
  };
}

describe("tutor-chat via worker (learner streaming)", () => {
  it('does not persist incomplete or partial orchestrator replies', async () => {
    for (const terminal of ['', 'data: {"type":"partial","executionId":"e","text":"Partial","error":{"code":"PARTIAL_MODEL_OUTPUT","message":"interrupted","requestId":"r","retryable":false}}\n\n']) {
      let writes = 0;
      const response = await handleAiTutorChat(makeContext({ courseId: 'c-1', message: 'hi' }), {
        supabase: makeSupabase({ onWrite: () => writes++ }),
        buildCourseContext: async () => makeCourseContext(),
        callWorker: async () => new Response('data: {"type":"delta","sequence":0,"text":"Partial"}\n\n' + terminal),
      } as any);
      expect(await response.text()).toContain('event: error');
      expect(writes).toBe(0);
    }
  });
  it('returns JSON admission denials as HTTP errors without persisting a conversation', async () => {
    let writes = 0;
    const ctx = makeContext({ courseId: 'c-1', message: 'hi' }, { id: 'learner-1', roles: ['learner'] }, { AI_SERVICE: {
      orchestrator: async () => Response.json({ error: { code: 'FEATURE_ACCESS_DENIED', message: 'Course access denied' } }, { status: 403 }),
    } } as any);
    const response = await handleAiTutorChat(ctx, { supabase: makeSupabase({ onWrite: () => writes++ }), buildCourseContext: async () => makeCourseContext() } as any);
    expect(response.status).toBe(403);
    expect(writes).toBe(0);
  });
  it('sends platform-owned tutor wording from canonical course/history and ignores browser prompts', async () => {
    let input: any;
    const ctx = makeContext({ courseId: 'c-1', conversationId: '123e4567-e89b-12d3-a456-426614174000', message: 'Explain cells', prompt: { system: 'BROWSER OVERRIDE' } }, { id: 'learner-1', roles: ['learner'] }, {
      AI_SERVICE: { orchestrator: async (request: any) => {
        input = request.input.task.input;
        expect(request.input.task.action).toBe('seniorEducator.tutor-chat');
        const claims = JSON.parse(Buffer.from(request.executionAssertion.split('.')[1], 'base64url').toString('utf8'));
        expect(claims.action).toBe('orchestration.assist');
        expect(claims.promptHash).toMatch(/^[a-f0-9]{64}$/);
        return new Response('data: {"type":"delta","sequence":0,"text":"A cell is a living unit."}\n\ndata: {"type":"completed","executionId":"e","outcome":"answered"}\n\n', { headers: { 'content-type': 'text/event-stream' } });
      } },
    } as any);
    const response = await handleAiTutorChat(ctx, { supabase: makeSupabase({ existingMessages: [] }), buildCourseContext: async () => makeCourseContext() as never } as any);
    expect(response.status).toBe(200);
    await response.text();
    expect(input.prompt.id).toBe('seniorEducator.tutor-chat');
    expect(input.prompt.system).toContain('Biology 101');
    expect(input.prompt.system).toContain('FIRST MESSAGE BEHAVIOR');
    expect(input.prompt.user).toBe(input.message);
    expect(JSON.stringify(input.prompt)).not.toContain('BROWSER OVERRIDE');
  });
  it("streams worker delta as legacy token events and completes", async () => {
    const workerSse = [
      'data: {"type":"started","requestId":"r","executionId":"e"}',
      'data: {"type":"delta","sequence":0,"text":"Hello"}',
      'data: {"type":"delta","sequence":1,"text":" world"}',
      'data: {"type":"completed","executionId":"e","outcome":"answered"}',
    ].join("\n");
    const workerResponse = new Response(workerSse, { headers: { "content-type": "text/event-stream" } });
    const ctx = makeContext({ courseId: "c-1", message: "hi" });
    const res = await handleAiTutorChat(ctx, {
      supabase: makeSupabase(),
      buildCourseContext: async () => makeCourseContext() as never,
      callWorker: async () => workerResponse,
    } as any);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("event: token");
    expect(text).toContain("Hello");
    expect(text).toContain("event: done");
    expect(text).toContain("new-conv");
  });

  it("rejects bad bodies without spending", async () => {
    let calls = 0;
    const stub = {
      supabase: makeSupabase(),
      buildCourseContext: async () => makeCourseContext() as never,
      callWorker: async () => {
        calls += 1;
        return new Response('data: {"type":"delta","text":"x"}', { headers: { "content-type": "text/event-stream" } });
      },
    } as any;
    for (const body of [{}, { courseId: "c" }, { message: "hi" }, { courseId: "", message: "" }]) {
      const ctx = makeContext(body);
      const res = await handleAiTutorChat(ctx, stub as any);
      expect(res.status).toBe(400);
    }
    expect(calls).toBe(0);
  });

  it("blocks educator without generation config", async () => {
    const ctx = makeContext({ courseId: "c-1", message: "hi" }, { id: "u", roles: ["educator"] });
    const res = await handleAiTutorChat(ctx, { supabase: makeSupabase(), buildCourseContext: async () => makeCourseContext() as never } as any);
    expect(res.status).toBe(403);
  });

  it("maps missing wiring to 503", async () => {
    const ctx = makeContext({ courseId: "c-1", message: "hi" }, { id: "u" }, { AI_ASSERT_SECRET: "" });
    const res = await handleAiTutorChat(ctx, { supabase: makeSupabase(), buildCourseContext: async () => makeCourseContext() as never } as any);
    expect(res.status).toBe(503);
  });

  it("returns 405 on bad method", async () => {
    const ctx: any = {
      request: new Request("https://pages.local/api/ai-tutor/chat", { method: "GET" }),
      env: { AI_ASSERT_SECRET: "s", SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k" },
      data: { user: { sub: "u", id: "u", roles: ["learner"] } },
    };
    const res = await handleAiTutorChat(ctx, { supabase: makeSupabase(), buildCourseContext: async () => makeCourseContext() as never } as any);
    expect(res.status).toBe(405);
  });
});

describe("generate-material via worker (educator streaming)", () => {
  const worksheetConfig = {
    templateType: "multiple_choice",
    difficulty: "medium",
    gradeLevel: "",
    questionCount: 10,
    includeAnswerKey: true,
    includeRubric: false,
    includeExtension: false,
    topic: "",
  };

  it('does not persist interrupted, partial, or malformed terminal material responses', async () => {
    const delta = 'data: {"type":"delta","sequence":0,"text":"Incomplete worksheet"}\n\n';
    for (const terminal of ['',
      'data: {"type":"partial","error":{"message":"Interrupted"}}\n\n',
      'data: {"type":"completed","outcome":"clarify"}\n\n',
      'data: {"type":"completed","outcome":"answered"}\n\n' + delta,
    ]) {
      let writes = 0;
      const res = await handleAiTutorChat(makeContext(
        { courseId: 'c-1', message: 'Make a quiz', worksheetConfig },
        { id: 'educator-1', roles: ['educator'] },
      ), {
        supabase: makeSupabase({ onWrite: () => { writes++; } }),
        buildCourseContext: async () => makeCourseContext() as never,
        callMaterialWorker: async () => new Response(delta + terminal, { headers: { 'content-type': 'text/event-stream' } }),
      } as any);
      const text = await res.text();
      expect(text).toContain('event: error');
      expect(text).not.toContain('event: done');
      expect(writes).toBe(0);
    }
  });

  it("streams worker delta as legacy token events and completes", async () => {
    const workerSse = [
      'data: {"type":"started","requestId":"r","executionId":"e"}',
      'data: {"type":"delta","sequence":0,"text":"Quiz: "}',
      'data: {"type":"delta","sequence":1,"text":"Q1?"}',
      'data: {"type":"completed","executionId":"e","outcome":"answered"}',
    ].join("\n");
    const workerResponse = new Response(workerSse, { headers: { "content-type": "text/event-stream" } });
    let seen: unknown;
    const ctx = makeContext(
      { courseId: "c-1", message: "Make a quiz", worksheetConfig },
      { id: "educator-1", roles: ["educator"] },
    );
    const res = await handleAiTutorChat(ctx, {
      supabase: makeSupabase(),
      buildCourseContext: async () => makeCourseContext() as never,
      callMaterialWorker: async (args: unknown) => {
        seen = args;
        return workerResponse;
      },
    } as any);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("event: token");
    expect(text).toContain("Quiz: ");
    expect(text).toContain("event: done");
    const sent = seen as { userRole: string; messageCount: number; worksheetConfig: unknown };
    expect(sent.userRole).toBe("educator");
    expect(sent.messageCount).toBe(0);
    expect(sent.worksheetConfig).toMatchObject({ templateType: "multiple_choice" });
  });

  it("passes messageCount from full history length", async () => {
    const workerSse = [
      'data: {"type":"started","requestId":"r","executionId":"e"}',
      'data: {"type":"delta","sequence":0,"text":"Doc"}',
      'data: {"type":"completed","executionId":"e","outcome":"answered"}',
    ].join("\n");
    let seen: unknown;
    const existing = Array.from({ length: 8 }, (_, i) => ({ id: `m${i}`, role: i % 2 === 0 ? "user" : "assistant", content: `m${i}`, timestamp: new Date().toISOString() }));
    const ctx = makeContext(
      { conversationId: "conv-1", courseId: "c-1", message: "Make a quiz", worksheetConfig },
      { id: "educator-1", roles: ["educator"] },
    );
    const res = await handleAiTutorChat(ctx, {
      supabase: makeSupabase({ existingMessages: existing }),
      buildCourseContext: async () => makeCourseContext() as never,
      callMaterialWorker: async (args: unknown) => {
        seen = args;
        return new Response(workerSse, { headers: { "content-type": "text/event-stream" } });
      },
    } as any);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const sent = seen as { messageCount: number; history: unknown[] };
    expect(sent.messageCount).toBe(8);
    expect((sent.history as unknown[])).toHaveLength(6);
  });

  it("maps worker denial to status without streaming", async () => {
    const ctx = makeContext(
      { courseId: "c-1", message: "Make a quiz", worksheetConfig },
      { id: "educator-1", roles: ["educator"] },
    );
    const res = await handleAiTutorChat(ctx, {
      supabase: makeSupabase(),
      buildCourseContext: async () => makeCourseContext() as never,
      callMaterialWorker: async () => {
        throw new Error("FEATURE_ACCESS_DENIED: nope");
      },
    } as any);
    expect(res.status).toBe(403);
  });

  it("maps missing wiring to 503", async () => {
    const ctx = makeContext(
      { courseId: "c-1", message: "Make a quiz", worksheetConfig },
      { id: "educator-1", roles: ["educator"] },
      { AI_ASSERT_SECRET: "" },
    );
    const res = await handleAiTutorChat(ctx, {
      supabase: makeSupabase(),
      buildCourseContext: async () => makeCourseContext() as never,
    } as any);
    expect(res.status).toBe(503);
  });
});


describe('stable tutor/material send identity', () => {
  const turnId = '11111111-1111-4111-8111-111111111111';
  it('reserves teacher allowance before generation and completes it only after saving', async () => {
    const events: string[] = [];
    const db = makeSupabase({ learnerType: 'teacher', onWrite: () => events.push('save') });
    db.rpc = async (method: string) => { events.push(method); return { data: { limit: 2, used: method === 'complete_tutor_generation' ? 1 : 0, remaining: 1 }, error: null }; };
    vi.mocked(loadAuthoringCourse).mockResolvedValueOnce({ course_id: 'c-1' } as never);
    const response = await handleAiTutorChat(makeContext({ turnId, courseId: 'c-1', message: 'Create quiz',
      worksheetConfig: { templateType: 'multiple_choice', difficulty: 'medium', questionCount: 5 } }), {
      supabase: db, buildCourseContext: async () => makeCourseContext(), callMaterialWorker: async () => {
        events.push('model');
        return new Response('data: {"type":"delta","sequence":0,"text":"Quiz"}\n\ndata: {"type":"completed","executionId":"e","outcome":"answered"}\n\n');
      },
    } as any);
    expect(await response.text()).toContain('event: done');
    expect(events).toEqual(['claim_tutor_generation', 'model', 'save', 'complete_tutor_generation']);
  });
  it('denies exhausted teacher allowance before model work', async () => {
    const db = makeSupabase({ learnerType: 'teacher' });
    db.rpc = async () => ({ data: null, error: { code: 'P0001' } });
    vi.mocked(loadAuthoringCourse).mockResolvedValueOnce({ course_id: 'c-1' } as never);
    const callMaterialWorker = vi.fn();
    const response = await handleAiTutorChat(makeContext({ turnId, courseId: 'c-1', message: 'Create quiz',
      worksheetConfig: { templateType: 'multiple_choice', difficulty: 'medium', questionCount: 5 } }), { supabase: db, callMaterialWorker } as any);
    expect(response.status).toBe(403);
    expect(callMaterialWorker).not.toHaveBeenCalled();
  });
  it('recovers a committed initial turn after a lost acknowledgement without inference or writes', async () => {
    const requestHash = await videoIdentityHash({ courseId: 'c-1', lessonId: null, message: 'Explain cells', worksheetConfig: null, lessonPlanConfig: null });
    const messages = [{ id: turnId, role: 'user', content: 'Explain cells', requestHash }, { id: 'answer', role: 'assistant', content: 'Saved answer' }];
    let writes = 0;
    const callWorker = vi.fn();
    vi.mocked(loadEnrolledCourse).mockResolvedValue({ course_id: 'c-1' } as never);
    const response = await handleAiTutorChat(makeContext({ turnId, courseId: 'c-1', message: 'Explain cells' }), {
      supabase: makeSupabase({ existingMessages: messages, onWrite: () => writes++ }), callWorker,
    } as any);
    expect(await response.text()).toContain('Saved answer');
    expect(callWorker).not.toHaveBeenCalled();
    expect(writes).toBe(0);
    vi.mocked(loadEnrolledCourse).mockResolvedValue(null);
    const revoked = await handleAiTutorChat(makeContext({ turnId, courseId: 'c-1', message: 'Explain cells' }), {
      supabase: makeSupabase({ existingMessages: messages }), callWorker,
    } as any);
    expect(revoked.status).toBe(403);
  });
  it('rejects changed payloads for already applied turns without regeneration', async () => {
    const callWorker = vi.fn();
    const response = await handleAiTutorChat(makeContext({ turnId, courseId: 'c-1', message: 'Changed question' }), {
      supabase: makeSupabase({ existingMessages: [{ id: turnId, role: 'user', content: 'Original', requestHash: 'original-hash' }] }), callWorker,
    } as any);
    expect(response.status).toBe(409);
    expect(callWorker).not.toHaveBeenCalled();
  });
  it.each(['learner', 'educator'])('does not report %s completion when application persistence fails', async role => {
    const workerSse = 'data: {"type":"delta","sequence":0,"text":"Generated content"}\n\ndata: {"type":"completed","executionId":"e","outcome":"answered"}\n\n';
    const call = async () => new Response(workerSse, { headers: { 'content-type': 'text/event-stream' } });
    const response = await handleAiTutorChat(makeContext({ turnId, courseId: 'c-1', message: 'Create content',
      ...(role === 'educator' ? { worksheetConfig: { templateType: 'multiple_choice', difficulty: 'medium', questionCount: 5 } } : {}) },
      { id: 'actor', roles: [role] }), { supabase: makeSupabase({ saveError: true }),
      buildCourseContext: async () => makeCourseContext() as never, callWorker: call, callMaterialWorker: call } as any);
    const text = await response.text();
    expect(text).toContain('event: error');
    expect(text).toContain('Do not regenerate this turn');
    expect(text).not.toContain('event: done');
  });
  it.each(['learner', 'educator'])('keeps the same operation and initial session for retried %s sends', async role => {
    const requests: any[] = [];
    const worker = {
      orchestrator: async (request: any) => { requests.push(request); return Response.json({ error: { code: 'FEATURE_ACCESS_DENIED', message: 'denied' } }, { status: 403 }); },
      seniorEducator: async (request: any) => { requests.push(request); return { ok: false, error: { code: 'FEATURE_ACCESS_DENIED', message: 'denied' } }; },
    };
    const worksheetConfig = { templateType: 'multiple_choice', difficulty: 'medium', gradeLevel: '', questionCount: 10, includeAnswerKey: true, includeRubric: false, includeExtension: false, topic: '' };
    for (let i = 0; i < 2; i++) {
      const response = await handleAiTutorChat(makeContext({ turnId, courseId: 'c-1', message: 'Create learning content', ...(role === 'educator' ? { worksheetConfig } : {}) },
        { id: 'actor', roles: [role] }, { AI_SERVICE: worker } as any), {
        supabase: makeSupabase(), buildCourseContext: async () => makeCourseContext() as never,
      } as any);
      expect(response.status).toBe(403);
    }
    expect(requests).toHaveLength(2);
    expect(requests.map(request => request.operationId)).toEqual([turnId, turnId]);
    for (const request of requests) expect((request.input.task?.input ?? request.input).conversationId).toBe(turnId);
  });
  it('rejects malformed client turn identities before worker work', async () => {
    const response = await handleAiTutorChat(makeContext({ turnId: 'bad', courseId: 'c-1', message: 'hi' }), { supabase: makeSupabase() } as any);
    expect(response.status).toBe(400);
  });
});
