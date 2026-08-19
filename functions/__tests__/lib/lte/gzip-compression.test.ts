import { describe, it, expect } from 'vitest';

export async function parseMessageBody<T = unknown>(body: unknown): Promise<T> {
  if (!body) return body as T;

  if (typeof body === 'object' && 'type' in body && 'payload' in body) {
    return body as T;
  }

  if (typeof body === 'object' && 'data' in body && Array.isArray((body as { data?: unknown }).data)) {
    const uint8 = new Uint8Array((body as { data: number[] }).data);
    return parseMessageBody(uint8);
  }

  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    const buffer = ArrayBuffer.isView(body)
      ? body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)
      : body;
    try {
      const stream = new Response(buffer).body!.pipeThrough(new DecompressionStream('gzip'));
      const text = await new Response(stream).text();
      return JSON.parse(text) as T;
    } catch {
      try {
        const text = new TextDecoder().decode(buffer);
        return JSON.parse(text) as T;
      } catch {
        // Fail-soft fallback
      }
    }
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T;
    } catch {
      try {
        const binaryStr = atob(body);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        return parseMessageBody(bytes.buffer);
      } catch {
        // Fail-soft fallback
      }
    }
  }

  return body as T;
}

describe('Bulletproof Gzip Compression & Decompression Engine', () => {
  const originalEvent = {
    type: 'lte.module_completed',
    payload: {
      userId: 'usr_test_123',
      lteCourseId: 'cap_genai_001',
      courseTitle: 'GenAI Workflows',
      lteCourseCode: 'CAP037',
      status: 'in_progress',
      completedModules: 14,
      totalModules: 35,
    },
  };

  it('1. ArrayBuffer input', async () => {
    const jsonBytes = new TextEncoder().encode(JSON.stringify(originalEvent));
    const compressedStream = new Response(jsonBytes).body!.pipeThrough(new CompressionStream('gzip'));
    const compressedBuffer = await new Response(compressedStream).arrayBuffer();

    const decompressed = await parseMessageBody(compressedBuffer);
    expect(decompressed).toEqual(originalEvent);
  });

  it('2. Uint8Array input', async () => {
    const jsonBytes = new TextEncoder().encode(JSON.stringify(originalEvent));
    const compressedStream = new Response(jsonBytes).body!.pipeThrough(new CompressionStream('gzip'));
    const compressedBuffer = await new Response(compressedStream).arrayBuffer();

    const decompressed = await parseMessageBody(new Uint8Array(compressedBuffer));
    expect(decompressed).toEqual(originalEvent);
  });

  it('3. Wrangler local dev { type: "Buffer", data: number[] } input', async () => {
    const jsonBytes = new TextEncoder().encode(JSON.stringify(originalEvent));
    const compressedStream = new Response(jsonBytes).body!.pipeThrough(new CompressionStream('gzip'));
    const compressedBuffer = await new Response(compressedStream).arrayBuffer();

    const wranglerBufferJson = {
      type: 'Buffer',
      data: Array.from(new Uint8Array(compressedBuffer)),
    };

    const decompressed = await parseMessageBody(wranglerBufferJson);
    expect(decompressed).toEqual(originalEvent);
  });

  it('4. Plain uncompressed JS Object input', async () => {
    const decompressed = await parseMessageBody(originalEvent);
    expect(decompressed).toEqual(originalEvent);
  });

  it('5. Plain JSON string input', async () => {
    const decompressed = await parseMessageBody(JSON.stringify(originalEvent));
    expect(decompressed).toEqual(originalEvent);
  });

  it('6. Empirical Time & Size Benchmark (Gzip vs Uncompressed)', async () => {
    // Generate realistic 5-level 35-module course snapshot payload
    const fullSnapshotPayload = {
      type: 'lte.module_completed',
      payload: {
        userId: '3e0d3d47-8551-4ae4-964d-638f5e76d30f',
        lteCourseId: 'CAP037',
        courseTitle: 'Support exchange member, listing, market-data and surveillance evidence handoffs',
        lteCourseCode: 'CAP037',
        status: 'completed',
        completedModules: 35,
        totalModules: 35,
        durationHours: 35,
        totalDurationHours: 35,
        resumeUrl: '/my-courses/CAP037',
        earnedSkills: ['Exchange Handoffs', 'Market Data Inspection'],
        completedAt: new Date().toISOString(),
        levels: Array.from({ length: 5 }, (_, lIdx) => ({
          levelNo: lIdx + 1,
          title: `Level ${lIdx + 1}`,
          status: 'completed',
          modules: Array.from({ length: 7 }, (_, mIdx) => ({
            id: `mod-${lIdx + 1}-${mIdx + 1}`,
            title: `Module ${mIdx + 1} - Inspection & Handoff Evidence Verification Policy`,
            status: 'completed',
            completionPercentage: 100,
          })),
        })),
      },
    };

    // 1. Measure Uncompressed Plain JSON
    const t0 = performance.now();
    const plainJsonString = JSON.stringify(fullSnapshotPayload);
    const plainBytes = new TextEncoder().encode(plainJsonString).length;
    const t1 = performance.now();
    const plainParsed = await parseMessageBody(plainJsonString);
    const t2 = performance.now();

    const plainCompressTime = t1 - t0;
    const plainDecompressTime = t2 - t1;

    // 2. Measure Native Gzip Compression & Decompression
    const g0 = performance.now();
    const jsonBytes = new TextEncoder().encode(plainJsonString);
    const compressedStream = new Response(jsonBytes).body!.pipeThrough(new CompressionStream('gzip'));
    const compressedBuffer = await new Response(compressedStream).arrayBuffer();
    const g1 = performance.now();
    const gzipBytes = compressedBuffer.byteLength;
    const gzipParsed = await parseMessageBody(compressedBuffer);
    const g2 = performance.now();

    const gzipCompressTime = g1 - g0;
    const gzipDecompressTime = g2 - g1;

    expect(plainParsed).toEqual(fullSnapshotPayload);
    expect(gzipParsed).toEqual(fullSnapshotPayload);

    console.log('=== 📊 GZIP VS UNCOMPRESSED BENCHMARK RESULTS ===');
    console.log(`Uncompressed Size: ${plainBytes} bytes (${(plainBytes / 1024).toFixed(2)} KB)`);
    console.log(`Gzip Compressed Size: ${gzipBytes} bytes (${(gzipBytes / 1024).toFixed(2)} KB)`);
    console.log(`Payload Reduction: ${(((plainBytes - gzipBytes) / plainBytes) * 100).toFixed(1)}% smaller`);
    console.log(`Uncompressed Processing Time: ${(plainCompressTime + plainDecompressTime).toFixed(3)} ms`);
    console.log(`Gzip Full Roundtrip Time (Compress + Decompress): ${(gzipCompressTime + gzipDecompressTime).toFixed(3)} ms (Compress: ${gzipCompressTime.toFixed(3)} ms, Decompress: ${gzipDecompressTime.toFixed(3)} ms)`);
  });
});
