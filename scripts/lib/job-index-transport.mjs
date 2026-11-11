/** The multi-worker stack exposes embedding RPC without a separate HTTP port. */
export async function createJobIndexTransport({ binding = false, embeddingUrl, env = process.env,
  fetcher = fetch, createProxy = async () => (await import('wrangler')).getPlatformProxy({configPath:'wrangler.toml',persist:false}) } = {}) {
  if (binding === Boolean(embeddingUrl)) throw new Error('Choose exactly one of --binding or --embedding-url');
  if (binding) {
    const runtime = await createProxy();
    const worker = runtime.env.EMBEDDING_SERVICE;
    if (!worker) { await runtime.dispose(); throw new Error('EMBEDDING_SERVICE is not configured'); }
    return {
      async embed(input) {
        let result;
        try {
          result = await worker.embedText(input, 'RETRIEVAL_DOCUMENT');
          // Copy the returned data before disposing any RPC capabilities.
          return {model:result.model,embedding:Array.from(result.embedding || [])};
        } catch (error) {
          if (String(error?.message).includes('RATE_LIMIT_EXCEEDED'))
            throw Object.assign(new Error('Embedding worker rate-limited'), {code:'RATE_LIMIT_EXCEEDED',retryAfterSeconds:60});
          throw new Error('Embedding service binding failed');
        } finally { result?.[Symbol.dispose]?.(); }
      },
      async dispose() { try { worker[Symbol.dispose]?.(); } finally { await runtime.dispose(); } },
    };
  }
  if (!env.EMBEDDING_API_KEY) throw new Error('EMBEDDING_API_KEY is required for HTTP mode');
  const url = new URL('/embeddings/text', embeddingUrl);
  if (!['http:','https:'].includes(url.protocol) || url.protocol !== 'https:' && !['localhost','127.0.0.1','[::1]'].includes(url.hostname))
    throw new Error('The embedding worker must use HTTPS outside local development');
  return {
    async embed(input) {
      const response = await fetcher(url, {method:'POST',headers:{Authorization:`Bearer ${env.EMBEDDING_API_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify({input}),signal:AbortSignal.timeout(120000)});
      if (response.status === 429) {
        await response.body?.cancel();
        throw Object.assign(new Error('Embedding worker rate-limited'), {code:'RATE_LIMIT_EXCEEDED',retryAfterSeconds:Number(response.headers.get('Retry-After')) || 60});
      }
      if (!response.ok) { await response.body?.cancel(); throw new Error(`Embedding worker failed (${response.status})`); }
      return response.json();
    },
    async dispose() {},
  };
}
