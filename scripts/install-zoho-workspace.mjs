import {readFileSync,existsSync,lstatSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve,dirname,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const repository=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export function installZohoWorkspace({source=resolve(repository,'workspace-support/zoho'),target=resolve(repository,'..'),apply=false}={}){
  const files=JSON.parse(readFileSync(resolve(source,'manifest.json'),'utf8'));
  if(!Array.isArray(files)||new Set(files).size!==files.length||files.some(name=>typeof name!=='string'||
    !/^(ZOHO_(LOCAL_TESTING|RECRUIT_INTEGRATION_PLAN)\.md|scripts\/(?:lib\/|__tests__\/)?zoho-[a-z-]+\.(?:test\.)?mjs)$/.test(name)))throw new Error('Invalid workspace support manifest');
  for(const name of ['skillpassport','sp-dash','sso-worker','auth-sync-consumer']){
    if(!existsSync(resolve(target,name)))throw new Error(`Clone sibling repository ${name} before installing workspace support.`);
  }
  const pending=[];
  for(const name of files){
    const destination=resolve(target,name),contents=readFileSync(resolve(source,name));
    let ancestor=destination;
    while(relative(target,ancestor)!==''){
      if(existsSync(ancestor)&&lstatSync(ancestor).isSymbolicLink())throw new Error(`Refusing symbolic link: ${name}`);
      ancestor=dirname(ancestor);
      if(relative(target,ancestor).split(sep).includes('..'))throw new Error('Invalid destination');
    }
    if(existsSync(destination)){
      if(!contents.equals(readFileSync(destination)))throw new Error(`Workspace file differs: ${name}. Reconcile it before installation; no files overwritten.`);
    }else pending.push(name);
  }
  // Validate every path/content before making any changes. This command never
  // reads credentials, migrates databases, starts services or contacts a network.
  if(apply)for(const name of pending){const destination=resolve(target,name);mkdirSync(dirname(destination),{recursive:true});copyFileSync(resolve(source,name),destination);}
  return {files:files.length,pending:pending.length,applied:apply};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.some(arg=>arg!=='--apply')||args.length>1)throw new Error('Use no arguments for a read-only plan, or --apply to install missing files.');
  const result=installZohoWorkspace({apply:args.includes('--apply')});
  console.log(`${result.files} workspace support files checked; ${result.pending} ${result.applied?'installed':'missing'}. Existing different files are never overwritten.`);
}
