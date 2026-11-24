// @vitest-environment node
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { copyMissingObjects } from '../migrate-local-r2.mjs';

it('uses identical local storage in both Pages startup commands', () => {
  const { scripts } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  for (const command of [scripts['pages:dev'], scripts['pages:start']]) {
    expect(command).toContain('--persist-to ../sp-dash-2/.wrangler/state');
    expect(command).toContain('--r2 R2_BUCKET=skill-echosystem');
    expect(command).not.toContain('--remote');
  }
});

function bucket(initial: Record<string, string>) {
  const data = new Map(Object.entries(initial));
  let writes = 0;
  return {
    data,
    get writes() { return writes; },
    async list() { return { objects: [...data].map(([key, value]) => ({ key, size: Buffer.byteLength(value) })), truncated: false }; },
    async head(key: string) { return data.has(key) ? { size: Buffer.byteLength(data.get(key)!) } : null; },
    async get(key: string) {
      return data.has(key) ? { body: new Response(data.get(key)).body!, httpMetadata: { contentType: 'text/plain' }, customMetadata: { original: 'yes' } } : null;
    },
    async put(key: string, body: ArrayBuffer, options: unknown) {
      expect(options).toEqual({ httpMetadata: { contentType: 'text/plain' }, customMetadata: { original: 'yes' } });
      data.set(key, await new Response(body).text()); writes++;
    },
  };
}

it('defaults to a read-only dry run and preserves all original objects', async () => {
  const source = bucket({ upload: 'original' }); const target = bucket({ existing: 'keep' });
  expect(await copyMissingObjects(source, target)).toEqual({ missing: 1, copied: 0, identical: 0 });
  expect(target.writes).toBe(0); expect(source.data.get('upload')).toBe('original');
});
it('copies missing bytes with metadata, keeps existing objects and safely reruns', async () => {
  const source = bucket({ upload: 'original' }); const target = bucket({ existing: 'keep' });
  expect((await copyMissingObjects(source, target, true)).copied).toBe(1);
  expect(target.data.get('upload')).toBe('original'); expect(target.data.get('existing')).toBe('keep');
  expect(source.data.get('upload')).toBe('original');
  expect((await copyMissingObjects(source, target, true)).identical).toBe(1);
  expect(target.writes).toBe(1);
});
it.each(['different', '12345678'])('refuses conflicting existing bytes (%s)', async conflict => {
  const source = bucket({ upload: 'original' }); const target = bucket({ upload: conflict });
  await expect(copyMissingObjects(source, target, true)).rejects.toThrow('no overwrite performed');
  expect(target.data.get('upload')).toBe(conflict); expect(target.writes).toBe(0);
});
