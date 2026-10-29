import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { buildSync } from 'esbuild';

const root = new URL('../../', import.meta.url), require = createRequire(import.meta.url);
const source = buildSync({ entryPoints: [fileURLToPath(new URL('functions/lib/recommendation-ranking.ts', root))], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text;
const compiled = { exports: {} };
new Function('module', 'exports', 'require', source)(compiled, compiled.exports, require);
const { rankRecommendationCandidates, SHARED_RANKING_VERSION } = compiled.exports;
const fixture = JSON.parse(readFileSync(new URL('functions/__tests__/fixtures/recommendation-evaluation.json', root), 'utf8'));
const defaults = { targetRoles: [], employmentTypes: [], locations: [], departments: [], workModes: [], willingToRelocate: null, strictLocations: false, strictEmploymentTypes: false, strictWorkModes: false, useAssessmentRecommendations: true, useVerifiedLearning: true };
const dcg = values => values.slice(0, 3).reduce((sum, value, index) => sum + (2 ** value - 1) / Math.log2(index + 2), 0);
const samples = [], results = [];
for (const sample of fixture.cases) {
  const jobs = sample.jobs.map(job => ({ ...job, status: 'open', is_active: true, employment_type: 'full_time' }));
  const context = { skillNames: sample.skills, softSkillNames: sample.softSkills || [], preferences: { ...defaults, ...sample.preferences } };
  const baseline = [...jobs].sort((a, b) => b.similarity - a.similarity);
  const ranked = rankRecommendationCandidates(jobs, context);
  const ideal = dcg(sample.jobs.map(job => job.relevance).sort((a, b) => b - a));
  const metrics = rows => ({ ndcgAt3: ideal ? dcg(rows.map(job => job.relevance)) / ideal : null, noMatchCorrect: ideal ? null : rows.length === 0, precisionOfReturnedAt3: rows.length ? rows.slice(0, 3).filter(job => job.relevance > 0).length / Math.min(3, rows.length) : 0 });
  results.push({ id: sample.id, baseline: metrics(baseline), shared: metrics(ranked), returnedIds: ranked.map(job => job.id) });
  for (let iteration = 0; iteration < 200; iteration++) {
    const started = performance.now(); rankRecommendationCandidates(jobs, context); samples.push(performance.now() - started);
  }
}
samples.sort((a, b) => a - b);
const mean = (kind, metric) => { const eligible = results.filter(row => row[kind][metric] !== null); return eligible.length ? eligible.reduce((sum, row) => sum + Number(row[kind][metric]), 0) / eligible.length : null; };
const report = {
  schemaVersion: 1, rankingPolicy: SHARED_RANKING_VERSION, evaluatedAt: new Date().toISOString(), provenance: fixture.provenance,
  releaseAcceptance: false,
  limitations: [`${fixture.cases.length} synthetic diagnostic personas, not representative outcome data.`, 'No threshold calibration, provider latency, hiring probability or production-quality claim.', 'Blinded human-labelled holdout and signed-in end-to-end validation remain required.'],
  aggregate: { baselineNdcgAt3: mean('baseline', 'ndcgAt3'), sharedNdcgAt3: mean('shared', 'ndcgAt3'), baselinePrecisionOfReturnedAt3: mean('baseline', 'precisionOfReturnedAt3'), sharedPrecisionOfReturnedAt3: mean('shared', 'precisionOfReturnedAt3'), baselineNoMatchAccuracy: mean('baseline', 'noMatchCorrect'), sharedNoMatchAccuracy: mean('shared', 'noMatchCorrect') },
  localPureRankingMilliseconds: { sampleCount: samples.length, p50: samples[Math.floor(samples.length * 0.5)], p95: samples[Math.floor(samples.length * 0.95)] },
  results,
};
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
