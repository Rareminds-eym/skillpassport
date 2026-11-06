import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {installZohoWorkspace} from '../install-zoho-workspace.mjs';
function fixture(){
 const directory=mkdtempSync(resolve(tmpdir(),'zoho-workspace-install-'));
 const source=resolve(directory,'bundle'),target=resolve(directory,'workspace');mkdirSync(source);mkdirSync(target);
 for(const name of ['skillpassport','sp-dash','sso-worker','auth-sync-consumer'])mkdirSync(resolve(target,name));
 const files=['ZOHO_LOCAL_TESTING.md','scripts/zoho-local-runtime.mjs'];
 mkdirSync(resolve(source,'scripts'));writeFileSync(resolve(source,'manifest.json'),JSON.stringify(files));
 for(const name of files)writeFileSync(resolve(source,name),'Synthetic workspace support');
 return {source,target,close:()=>rmSync(directory,{recursive:true,force:true})};
}
test('support install plans without writing, installs missing files and is idempotent',()=>{
 const f=fixture();try{
  assert.equal(installZohoWorkspace(f).pending,2);assert.equal(existsSync(resolve(f.target,'ZOHO_LOCAL_TESTING.md')),false);
  assert.equal(installZohoWorkspace({...f,apply:true}).pending,2);
  assert.equal(installZohoWorkspace({...f,apply:true}).pending,0);
 }finally{f.close();}
});
test('conflicting support files prevent every write',()=>{
 const f=fixture();try{
  mkdirSync(resolve(f.target,'scripts'));writeFileSync(resolve(f.target,'scripts/zoho-local-runtime.mjs'),'Local changes');
  assert.throws(()=>installZohoWorkspace({...f,apply:true}),/differs/);
  assert.equal(existsSync(resolve(f.target,'ZOHO_LOCAL_TESTING.md')),false);
  assert.equal(readFileSync(resolve(f.target,'scripts/zoho-local-runtime.mjs'),'utf8'),'Local changes');
 }finally{f.close();}
});
test('path traversal and symlink destinations are rejected before copying',()=>{
 const f=fixture();try{
  symlinkSync(f.source,resolve(f.target,'scripts'));
  assert.throws(()=>installZohoWorkspace({...f,apply:true}),/symbolic link/);
  writeFileSync(resolve(f.source,'manifest.json'),JSON.stringify(['../escape']));
  assert.throws(()=>installZohoWorkspace({...f,apply:true}),/manifest/);
  assert.equal(existsSync(resolve(f.target,'ZOHO_LOCAL_TESTING.md')),false);
 }finally{f.close();}
});
