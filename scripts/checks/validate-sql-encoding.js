#!/usr/bin/env node
/**
 * Fails when SQL under supabase/migrations or supabase/seed contains mojibake
 * (UTF-8 text that was decoded with the wrong code page and re-saved).
 *
 * Known signatures:
 *   ΓÇô ΓÇö ΓÇÖ ... / Γé╣   UTF-8 decoded as cp437 (Windows OEM console)
 *   â€" â€™ ...           UTF-8 decoded as cp1252
 *   Ã© Ã¨ Â             UTF-8 decoded as latin1/cp1252 (accented letters, NBSP)
 *   U+FFFD                replacement character (data already lost)
 *
 * Files listed in BASELINE are known-corrupted dumps awaiting repair. They may
 * not get worse: the check fails if the number of bad lines grows. Lower the
 * number (or delete the entry) when a file is repaired.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCAN_DIRS = ['supabase/migrations', 'supabase/seed'];

export const MOJIBAKE_PATTERN = /ΓÇ|Γé╣|â€|Ã[\u00a0-\u00bf]|Â[\u00a0-\u00bf]|\uFFFD/;

// Known-corrupted files (bad line counts as of 2026-10-19). Do NOT add new entries;
// repair the file instead. See .agents/tasks/font-mojibake-investigation-2026-10-19.md
export const BASELINE = {
  'supabase/seed/dev/20261006090000_seed_initial_dev_data.sql': 1725,
  'supabase/seed/production/20261006090000_seed_initial_production_data.sql': 2480,
};

export function sqlFiles(root, dir) {
  let entries;
  try { entries = readdirSync(join(root, dir), { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  return entries.flatMap(entry => {
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? sqlFiles(root, path) : entry.name.endsWith('.sql') ? [path] : [];
  }).sort();
}

export function badLines(text) {
  const hits = [];
  text.split('\n').forEach((line, index) => {
    if (MOJIBAKE_PATTERN.test(line)) hits.push({ line: index + 1, text: line.trim().slice(0, 120) });
  });
  return hits;
}

export function checkEncoding(root, baseline = BASELINE) {
  const errors = [];
  const notes = [];
  for (const file of SCAN_DIRS.flatMap(dir => sqlFiles(root, dir))) {
    const hits = badLines(readFileSync(join(root, file), 'utf8'));
    const allowed = baseline[file] ?? 0;
    if (hits.length > allowed) {
      const shown = hits.slice(0, 5).map(h => `    line ${h.line}: ${h.text}`).join('\n');
      errors.push(`${file}: ${hits.length} line(s) with mojibake${allowed ? ` (baseline ${allowed})` : ''}\n${shown}`);
    } else if (hits.length < allowed) {
      notes.push(`${file}: ${hits.length} bad line(s), baseline is ${allowed}. Lower or remove the BASELINE entry.`);
    }
  }
  return { errors, notes };
}

function main() {
  const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
  const { errors, notes } = checkEncoding(root);
  notes.forEach(note => console.warn(`note: ${note}`));
  if (errors.length) {
    console.error('SQL encoding check failed. These files contain mojibake (UTF-8 decoded with the wrong code page):\n');
    errors.forEach(error => console.error(`- ${error}\n`));
    console.error('Fix: re-run the export/load with UTF-8 explicitly (PGCLIENTENCODING=UTF8, python open(..., encoding="utf-8"),');
    console.error('on Windows use chcp 65001 and never pipe SQL through cmd/PowerShell redirects). Do not commit the garbled text.');
    process.exit(1);
  }
  console.log(`SQL encoding check passed (${SCAN_DIRS.join(', ')}).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
