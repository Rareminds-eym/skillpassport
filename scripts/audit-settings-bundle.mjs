/** Compare built settings-route dependencies, including shared static imports. */
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { parse } from '@babel/parser';

const roots = process.argv.slice(2);
if (roots.length !== 2) {
  throw new Error('Usage: node scripts/audit-settings-bundle.mjs <baseline-dist> <updated-dist>');
}

const results = roots.map(root => {
  const directory = path.resolve(root, 'assets');
  const files = fs.readdirSync(directory).filter(file => file.endsWith('.js'));
  const sources = new Map(files.map(file => [file, fs.readFileSync(path.join(directory, file), 'utf8')]));
  const implementation = files.find(file => sources.get(file).includes('Profile auto-filled from resume successfully'));
  if (!implementation) throw new Error(`Settings implementation not found in ${root}`);
  const dependencies = new Map();
  const importsFor = file => {
    if (!dependencies.has(file)) {
      const ast = parse(sources.get(file), { sourceType: 'module' });
      dependencies.set(file, ast.program.body
        .filter(node => ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type))
        .map(node => node.source?.value)
        .filter(source => source?.startsWith('./') && source.endsWith('.js'))
        .map(source => source.slice(2)));
    }
    return dependencies.get(file);
  };
  // Vite may emit MainSettings separately from the thin page wrapper.
  const entry = files.find(file => file.startsWith('Settings-') && importsFor(file).includes(implementation)) || implementation;
  const visited = new Set();
  const visit = file => {
    if (visited.has(file)) return;
    visited.add(file);
    for (const dependency of importsFor(file)) visit(dependency);
  };
  visit(entry);
  let bytes = 0;
  let gzipBytes = 0;
  for (const file of visited) {
    const code = Buffer.from(sources.get(file));
    bytes += code.length;
    gzipBytes += gzipSync(code).length;
  }
  const optionalChunks = files
    .filter(file => /^(InstitutionDetailsTab|AcademicDetailsTab|CertificatesTab|ExperienceTab|SecurityTab|PrivacyTab|NotificationsTab|ResumeParser)-/.test(file))
    .map(file => ({ file, eagerlyImported: visited.has(file) }));
  return { root, entry, staticChunkCount: visited.size, bytes, gzipBytes, optionalChunks };
});
console.log(JSON.stringify({
  results,
  gzipReductionPercent: Number(((1 - results[1].gzipBytes / results[0].gzipBytes) * 100).toFixed(2)),
  note: 'Static JS dependency closure, including shared chunks; excludes dynamic imports, CSS, API data and browser cache effects. Not a latency benchmark.',
}, null, 2));
