import ts from 'typescript';
import {readFileSync,readdirSync} from 'node:fs';
import {join,relative} from 'node:path';
const root=new URL('../../',import.meta.url).pathname;
const rows=[];
const protectedTables=new Set(['users','learners','users_shadow','learner_applications_with_pipeline']);
function scan(dir){for(const item of readdirSync(dir,{withFileTypes:true})){
 const path=join(dir,item.name);
 if(item.isDirectory()){if(!['node_modules','__tests__','test'].includes(item.name))scan(path);continue;}
 if(!/\.[jt]sx?$/.test(path)||/\.(test|spec)\./.test(path))continue;
 const source=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true);
 const imported=new Set();
 for(const n of source.statements)if(ts.isImportDeclaration(n)&&/supabaseClient/.test(n.moduleSpecifier.text)){
  const bindings=n.importClause?.namedBindings;
  if(bindings&&ts.isNamedImports(bindings))for(const e of bindings.elements)imported.add(e.name.text);
 }
 function visit(n){
  if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&ts.isIdentifier(n.expression.expression)){
   const client=n.expression.expression.text;const operation=n.expression.name.text;
   const arg=n.arguments[0];const target=arg&&ts.isStringLiteralLike(arg)?arg.text:'<dynamic>';
   if(['from','rpc'].includes(operation)&&(client==='supabase'||imported.has(client)||protectedTables.has(target))){
    rows.push({file:relative(root,path),line:source.getLineAndCharacterOfPosition(n.getStart()).line+1,
     operation,target,clientImport:imported.has(client)?'anonymous SDK import':'unresolved/legacy client; inspect reachability',protected:operation==='from'&&protectedTables.has(target)});
   }
  }
  ts.forEachChild(n,visit);
 }
 visit(source);
}}
scan(join(root,'src'));
const protectedReads=rows.filter(r=>r.protected);
console.log(JSON.stringify({scope:'Static frontend database call sites, excluding tests; not a deployed ACL audit',
 protectedReferences:protectedReads.length,anonymousClientReferences:rows.filter(r=>r.clientImport==='anonymous SDK import').length,rows},null,2));
if(process.argv.includes('--check-protected')&&protectedReads.length)process.exitCode=1;
