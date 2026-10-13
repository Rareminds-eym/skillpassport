const ts=require('typescript');const fs=require('fs');const path=require('path');
const config=ts.readConfigFile('tsconfig.app.json',ts.sys.readFile);const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,process.cwd());
const targets=['functions/lib/teaching-contract.ts','functions/lib/external-teaching-access.ts','functions/lib/legacy-teaching-client.ts','functions/api/teaching/actions.ts','src/pages/educator/ExternalTeachingWorkspace.tsx','src/pages/admin/collegeAdmin/Attendancetracking.tsx'];
for(const dir of ['src/features/external-teaching/api','src/features/external-teaching/ui'])for(const file of fs.readdirSync(dir))if(/\.tsx?$/.test(file))targets.push(dir+'/'+file);
const program=ts.createProgram(targets,{...parsed.options,skipLibCheck:true,noEmit:true});
const absolute=new Set(targets.map(f=>path.resolve(f).toLowerCase()));const diagnostics=ts.getPreEmitDiagnostics(program).filter(d=>d.file&&absolute.has(path.resolve(d.file.fileName).toLowerCase()));
console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'}));console.log('Changed-file diagnostics:',diagnostics.length);process.exitCode=diagnostics.length?1:0;
