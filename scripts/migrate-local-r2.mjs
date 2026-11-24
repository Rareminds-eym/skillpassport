import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

async function digest(object) {
  if (!object) throw new Error('Object disappeared during verification');
  const hash = createHash('sha256');
  for await (const chunk of object.body) hash.update(chunk);
  return hash.digest('hex');
}

/** Copy only missing objects. Existing keys must have identical bytes. Never delete. */
export async function copyMissingObjects(source, target, apply = false) {
  const summary = { missing: 0, copied: 0, identical: 0 };
  let cursor;
  do {
    const page = await source.list({ cursor });
    for (const item of page.objects) {
      const existing = await target.head(item.key);
      if (existing) {
        if (existing.size !== item.size ||
            await digest(await source.get(item.key)) !== await digest(await target.get(item.key))) {
          throw new Error(`Conflicting local object; no overwrite performed: ${item.key}`);
        }
        summary.identical++;
        continue;
      }
      summary.missing++;
      if (!apply) continue;
      const object = await source.get(item.key);
      if (!object) throw new Error(`Missing source bytes: ${item.key}`);
      // The host proxy's stream lacks workerd's fixed-length marker. A buffer
      // supplies an explicit length; process one object at a time.
      const bytes = await new Response(object.body).arrayBuffer();
      await target.put(item.key, bytes, {
        httpMetadata: object.httpMetadata, customMetadata: object.customMetadata,
      });
      if (await digest(await source.get(item.key)) !== await digest(await target.get(item.key))) {
        throw new Error(`Local copy verification failed: ${item.key}`);
      }
      summary.copied++;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return summary;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply')) throw new Error('Usage: node scripts/migrate-local-r2.mjs [--apply]');
  const apply = args.includes('--apply');
  const { Miniflare, convertV4MiniflareOptions } = await import('miniflare');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const canonical = resolve(root, '../sp-dash-2/.wrangler/state/v3/r2');
  const sources = [
    [resolve(root, '.wrangler/state/v3/r2'), 'R2_BUCKET'],
    [resolve(root, '.wrangler/state/v3/r2'), 'skill-echosystem'],
    [canonical, 'R2_BUCKET'],
  ].filter(([path]) => existsSync(path));
  const instances = [];
  const stores = new Map();
  const open = path => {
    if (stores.has(path)) return stores.get(path);
    const mf = new Miniflare({ ...convertV4MiniflareOptions({
      modules: true, script: 'export default { fetch() { return new Response("local storage maintenance"); } }',
      compatibilityDate: '2026-06-08', r2Persist: path,
      r2Buckets: { LEGACY: 'R2_BUCKET', CURRENT: 'skill-echosystem' },
    }), resourcePersistencePath: dirname(path) });
    instances.push(mf);
    stores.set(path, mf);
    return mf;
  };
  try {
    const targetInstance = open(canonical);
    const target = await targetInstance.getR2Bucket('CURRENT');
    for (const [path, name] of sources) {
      const instance = path === canonical ? targetInstance : open(path);
      const source = await instance.getR2Bucket(name === 'R2_BUCKET' ? 'LEGACY' : 'CURRENT');
      console.log(JSON.stringify({ source: path, bucket: name, apply,
        ...await copyMissingObjects(source, target, apply) }));
    }
    console.log(apply ? 'Local R2 copies verified. Originals preserved.' : 'Dry run only. Use --apply to copy missing local objects.');
  } finally {
    await Promise.allSettled(instances.map(mf => mf.dispose()));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
