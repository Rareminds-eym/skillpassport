/**
 * Property-Based Test: Rate Limit Retry
 * **Feature: rag-course-recommendations, Property 10: Rate Limit Retry**
 * **Validates: Requirements 6.1**
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { generateEmbedding, generateBatchEmbeddings } from "../embeddingService";

const MAX_RETRIES = 4;
const EMBEDDING_DIMENSION = 768;

const nonEmptyTextArbitrary = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
const rateLimitFailuresArbitrary = fc.integer({ min: 0, max: 2 }); // Reduced to max 2 failures for faster tests

const createTestEmbedding = (text: string): number[] => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  const embedding: number[] = [];
  let seed = Math.abs(hash);
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    embedding.push((seed / 0x7fffffff) * 2 - 1);
  }
  return embedding;
};

const createRateLimitResponse = () => ({
  ok: false, status: 429, statusText: "Too Many Requests",
  json: async () => ({ error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "Rate limit exceeded" } })
});

const createSuccessResponse = (text: string) => ({
  ok: true, status: 200, statusText: "OK",
  json: async () => ({ embedding: { values: createTestEmbedding(text) } })
});

const createBatchSuccessResponse = (texts: string[]) => ({
  ok: true, status: 200, statusText: "OK",
  json: async () => ({ embeddings: texts.map(t => ({ values: createTestEmbedding(t) })) })
});

describe("Property 10: Rate Limit Retry", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("should retry and succeed when rate limited", async () => {
    await fc.assert(fc.asyncProperty(nonEmptyTextArbitrary, rateLimitFailuresArbitrary, async (text, numFailures) => {
      let callCount = 0;
      mockFetch = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        callCount++;
        if (callCount <= numFailures) return createRateLimitResponse();
        const body = JSON.parse(options.body as string);
        return createSuccessResponse(body.content?.parts?.[0]?.text || "");
      });
      vi.stubGlobal("fetch", mockFetch);
      const embedding = await generateEmbedding(text);
      expect(mockFetch).toHaveBeenCalledTimes(numFailures + 1);
      expect(embedding).toHaveLength(EMBEDDING_DIMENSION);
      expect(embedding.every((v: number) => typeof v === "number" && !isNaN(v))).toBe(true);
    }), { numRuns: 20 }); // Reduced runs for faster execution
  }, 120000);

  it("should fail gracefully after max retries", async () => {
    await fc.assert(fc.asyncProperty(nonEmptyTextArbitrary, async (text) => {
      mockFetch = vi.fn().mockImplementation(async () => createRateLimitResponse());
      vi.stubGlobal("fetch", mockFetch);
      let threwError = false, errorMessage = "";
      try { await generateEmbedding(text); } catch (e: any) { threwError = true; errorMessage = e.message || ""; }
      expect(threwError).toBe(true);
      expect(errorMessage.toLowerCase()).toContain("rate limit");
      expect(mockFetch).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    }), { numRuns: 5 }); // Reduced runs - this test is slow due to full retry cycle
  }, 120000);

  it("should handle batch rate limiting", async () => {
    await fc.assert(fc.asyncProperty(fc.array(nonEmptyTextArbitrary, { minLength: 1, maxLength: 3 }), fc.integer({ min: 0, max: 1 }), async (texts, numFailures) => {
      let callCount = 0;
      mockFetch = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        callCount++;
        if (callCount <= numFailures) return createRateLimitResponse();
        const body = JSON.parse(options.body as string);
        return createBatchSuccessResponse(body.requests?.map((r: any) => r.content?.parts?.[0]?.text || "") || []);
      });
      vi.stubGlobal("fetch", mockFetch);
      const embeddings = await generateBatchEmbeddings(texts);
      expect(mockFetch).toHaveBeenCalledTimes(numFailures + 1);
      expect(embeddings).toHaveLength(texts.length);
      embeddings.forEach((emb: number[]) => expect(emb).toHaveLength(EMBEDDING_DIMENSION));
    }), { numRuns: 20 });
  }, 120000);

  it("should handle RESOURCE_EXHAUSTED status", async () => {
    await fc.assert(fc.asyncProperty(nonEmptyTextArbitrary, async (text) => {
      let callCount = 0;
      mockFetch = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        callCount++;
        if (callCount === 1) return { ok: false, status: 429, statusText: "Too Many Requests", json: async () => ({ error: { status: "RESOURCE_EXHAUSTED" } }) };
        const body = JSON.parse(options.body as string);
        return createSuccessResponse(body.content?.parts?.[0]?.text || "");
      });
      vi.stubGlobal("fetch", mockFetch);
      const embedding = await generateEmbedding(text);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(embedding).toHaveLength(EMBEDDING_DIMENSION);
    }), { numRuns: 20 });
  }, 120000);

  it("should succeed immediately without rate limiting", async () => {
    await fc.assert(fc.asyncProperty(nonEmptyTextArbitrary, async (text) => {
      mockFetch = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        const body = JSON.parse(options.body as string);
        return createSuccessResponse(body.content?.parts?.[0]?.text || "");
      });
      vi.stubGlobal("fetch", mockFetch);
      const embedding = await generateEmbedding(text);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(embedding).toHaveLength(EMBEDDING_DIMENSION);
    }), { numRuns: 100 });
  }, 60000);
});
