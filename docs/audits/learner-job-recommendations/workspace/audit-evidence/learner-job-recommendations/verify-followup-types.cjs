// Selected-file guard only: the full repository typecheck is NOT green.
// Run from any directory; prints JSON, writes no files, performs no network IO.
const path = require('node:path');
const root = path.resolve(__dirname, '../../skillpassport');
const ts = require(path.join(root, 'node_modules/typescript'));
const groups = [
  { name: 'functions', config: 'tsconfig.functions.json', setup: [], files: [
    'functions/api/career/handlers/recommend.ts',
    'functions/api/career/utils/recommendation-state.ts',
    'functions/api/career/utils/recommendation-versions.ts',
    'functions/__tests__/api/career-recommend-ownership.test.ts',
  ] },
  { name: 'frontend', config: 'tsconfig.app.json', setup: ['src/test/setup.js'], files: [
    'src/features/opportunities/lib/externalApplication.ts',
    'src/features/opportunities/lib/__tests__/externalApplication.test.tsx',
    'src/features/opportunities/model/__tests__/saved-job-application.test.tsx',
    'src/features/opportunities/model/useSavedJobs.ts',
    'src/entities/learner/model/useLearnerDataByEmail.ts',
    'src/entities/learner/api/__tests__/mutation-invalidation.test.tsx',
  ] },
];
const results = groups.map(group => {
  const config = ts.readConfigFile(path.join(root, group.config), ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  if (parsed.errors.length) throw new Error(parsed.errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
  const program = ts.createProgram([...group.files, ...group.setup].map(file => path.join(root, file)), parsed.options);
  const diagnostics = group.files.flatMap(file => {
    const source = program.getSourceFile(path.join(root, file));
    if (!source) throw new Error(`Missing source: ${file}`);
    return [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)].map(d => ({
      file, line: d.file.getLineAndCharacterOfPosition(d.start || 0).line + 1,
      code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
    }));
  });
  return { group: group.name, config: group.config, checkedFiles: group.files, setup: group.setup, diagnostics };
});
const diagnosticCount = results.reduce((total, result) => total + result.diagnostics.length, 0);
process.stdout.write(JSON.stringify({
  generatedAt: new Date().toISOString(), typescript: ts.version,
  scope: 'Syntax and semantic diagnostics for the ten listed files using repository compiler options and existing test setup. Imports resolve normally. Does not check all imported files, global/project diagnostics, or certify a full-project typecheck.',
  wholeRepositoryTypecheckPassed: false, diagnosticCount, results,
}, null, 2) + '\n');
process.exitCode = diagnosticCount ? 1 : 0;
