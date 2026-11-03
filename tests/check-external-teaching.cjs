const ts=require('typescript');const fs=require('fs');const path=require('path');
const config=ts.readConfigFile('tsconfig.app.json',ts.sys.readFile);const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,process.cwd());
const targets=['functions/lib/teaching-contract.ts','functions/lib/external-teaching-access.ts','functions/lib/legacy-teaching-client.ts','functions/api/teaching/actions.ts','src/pages/admin/collegeAdmin/Attendancetracking.tsx','src/app/layouts/EducatorLayout.tsx','src/features/auth/ui/TokenPasswordReset.tsx','src/features/educator/model/useEducatorSchool.ts','src/features/educator/ui/Header.tsx','src/features/educator/ui/Sidebar.tsx','src/entities/learner/model/useLearners.ts','src/pages/educator/Dashboard.tsx','src/pages/educator/LearnersPage.tsx','src/pages/educator/MarkAttendance.tsx','src/pages/educator/Settings.tsx'];
for(const dir of ['src/features/external-teaching/api','src/features/external-teaching/ui','src/features/external-teaching/model'])for(const file of fs.readdirSync(dir))if(/\.tsx?$/.test(file))targets.push(dir+'/'+file);
const program=ts.createProgram(targets,{...parsed.options,skipLibCheck:true,noEmit:true});
const absolute=new Set(targets.map(f=>path.resolve(f).toLowerCase()));const diagnostics=ts.getPreEmitDiagnostics(program).filter(d=>d.file&&absolute.has(path.resolve(d.file.fileName).toLowerCase()));
let failures=diagnostics;
if(process.argv.includes('--compare-head')){
 const cp=require('child_process'),baseline=new Map();
 for(const file of targets){try{baseline.set(path.resolve(file).toLowerCase(),cp.execFileSync('git',['-c','safe.directory='+process.cwd().replace(/\\/g,'/'),'show','HEAD:'+file],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));}catch{}}
 const host=ts.createCompilerHost({...parsed.options,skipLibCheck:true,noEmit:true}),read=host.readFile;
 host.readFile=file=>baseline.get(path.resolve(file).toLowerCase())??read(file);
 const prior=ts.createProgram(targets,{...parsed.options,skipLibCheck:true,noEmit:true},host);
 const counts=new Map(),key=d=>path.resolve(d.file.fileName).toLowerCase()+':'+d.code+':'+ts.flattenDiagnosticMessageText(d.messageText,'\n');
 for(const d of ts.getPreEmitDiagnostics(prior).filter(d=>d.file&&absolute.has(path.resolve(d.file.fileName).toLowerCase()))){const k=key(d);counts.set(k,(counts.get(k)||0)+1);}
 failures=diagnostics.filter(d=>{const k=key(d),n=counts.get(k)||0;if(n){counts.set(k,n-1);return false;}return true;});
 console.log('Existing diagnostics:',diagnostics.length-failures.length);
}
console.log(ts.formatDiagnosticsWithColorAndContext(failures,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'}));console.log('Changed-file diagnostics:',failures.length);process.exitCode=failures.length?1:0;
