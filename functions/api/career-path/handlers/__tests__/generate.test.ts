import { describe, expect, it } from "vitest";
import { handleGenerateCareerPath, handleCareerPathChat } from "../generate.js";
import { buildlearnerProfileContext, sanitizeLearnerProfile } from "../../lib/career-path-prompts.js";
import { requireAdmin } from "../../../../lib/auth.js";

function post(body: unknown): Request {
  return new Request("https://pages.local/api/career-path/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ENV = {
  AI: {
    run: async () => ({ response: '{"currentRole":"entry"}', usage: { prompt_tokens: 30, completion_tokens: 10 } }),
  },
};

const LEARNER = { name: "Asha", email: "a@x.in", dept: "CSE", college: "RIT", skills: ["Python"] };

describe("career-path generate handler", () => {
  it("rejects missing learners and missing binding", async () => {
    expect((await handleGenerateCareerPath(ENV, post({}))).status).toBe(400);
    expect((await handleGenerateCareerPath(ENV, post({ learner: { dept: "CSE" } }))).status).toBe(400);
    expect((await handleGenerateCareerPath({}, post({ learner: LEARNER }))).status).toBe(500);
  });

  it("returns raw model text for browser-side parsing", async () => {
    const res = await handleGenerateCareerPath(ENV, post({ learner: LEARNER }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ data: { content: '{"currentRole":"entry"}' } });
  });

  it("sanitizes learner input to bounded values", () => {
    expect(sanitizeLearnerProfile(null)).toBeNull();
    expect(sanitizeLearnerProfile({ dept: "CSE" })).toBeNull();
    const sane = sanitizeLearnerProfile({ ...LEARNER, skills: ["Python", 9, "x".repeat(200)] });
    expect(sane?.skills).toEqual(["Python", "x".repeat(80)]);
    expect(buildlearnerProfileContext(sane!)).toContain("Name: Asha");
  });

  it("denies non-admin roles at the gate", async () => {
    const gate = requireAdmin(async () => new Response("ok")) as (ctx: unknown) => Promise<Response> | Response;
    expect((await gate({ data: { user: { roles: ["learner"] } } })).status).toBe(403);
    expect(await (await gate({ data: { user: { roles: ["university_admin"] } } })).text()).toBe("ok");
  });

  it("chats over a generated path with bounded inputs", async () => {
    const bad = await handleCareerPathChat(ENV, post({ system: "ctx" }));
    expect(bad.status).toBe(400);
    const res = await handleCareerPathChat(
      ENV,
      post({ system: "ctx", history: [{ role: "user", content: "hi" }], input: "list certificates" }),
    );
    expect(res.status).toBe(200);
    expect(typeof ((await res.json()) as { data: { message: string } }).data.message).toBe("string");
  });
});
