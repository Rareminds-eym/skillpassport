// Local setup only. Never deploys, migrates databases, or starts a mail runtime.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { randomBytes, createHmac } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { zohoProfileName } from '../sp-dash/lib/zoho/config.js';
import { isLocalDatabaseUrl, planLocalEnable, replaceLocalFiles, requireDashboardRuntime, verifyLocalProjection, serializeLocalVars, localRecoverySchedule, localRecoveryTickUrl } from './lib/zoho-local-config.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'sp-dash/package.json'));
const { parse } = require('dotenv');
const action = process.argv[2] || 'prepare';
if (!['prepare', 'workers', 'dashboard', 'pages', 'enable', 'verify', 'tick', 'build-pages', 'build-dashboard'].includes(action)) throw new Error('Use prepare, workers, dashboard, pages, enable, verify, tick, build-pages, or build-dashboard');
const dir = repo => resolve(root, repo, '.wrangler/zoho-local');
const read = repo => parse(readFileSync(resolve(root, repo, '.dev.vars')));
const pick = (values, names) => Object.fromEntries(names.filter(k => values[k]).map(k => [k, values[k]]));
const quote = JSON.stringify;
const config = repo => resolve(dir(repo), 'wrangler.toml');
const secretPath = resolve(dir('sp-dash'), 'secrets.json');
const local = isLocalDatabaseUrl;
const localCheck = () => {
  const endpoint = execFileSync('docker', ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'], {encoding:'utf8'}).trim();
  if (!endpoint.startsWith('unix://') || (process.env.DOCKER_HOST && !process.env.DOCKER_HOST.startsWith('unix://'))) throw new Error('Local Docker required');
};
function write(repo, filename, value) {
  mkdirSync(dir(repo), { recursive: true, mode: 0o700 });
  writeFileSync(resolve(dir(repo), filename), value, { mode: 0o600 });
}
const serializedVars = serializeLocalVars;
function vars(repo, value) { write(repo, '.dev.vars', serializedVars(value)); }
function worker(repo, name, main, extras) {
  write(repo, 'wrangler.toml', `name = ${quote(name)}\nmain = ${quote(main)}\ncompatibility_date = "2026-09-25"\ncompatibility_flags = ["nodejs_compat"]\n${extras}\n`);
}
const services = pairs => pairs.map(([binding, service, entrypoint]) => `[[services]]\nbinding = ${quote(binding)}\nservice = ${quote(service)}\n${entrypoint ? `entrypoint = ${quote(entrypoint)}\n` : ''}remote = false\n`).join('\n');
const producer = (binding, queue) => `[[queues.producers]]\nbinding = ${quote(binding)}\nqueue = ${quote(queue)}\n`;
const consumer = (queue, dlq) => `[[queues.consumers]]\nqueue = ${quote(queue)}\nmax_batch_size = 1\nmax_batch_timeout = 1\nmax_retries = 3\n${dlq ? `dead_letter_queue = ${quote(dlq)}\n` : ''}`;
function run(repo, executable, args, env = {}) {
  const child = spawn(process.execPath, [resolve(root, repo, executable), ...args], { cwd:resolve(root,repo), env:{...process.env,...env,WRANGLER_SEND_METRICS:'false'}, stdio:'inherit' });
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('exit', code => { process.exitCode = code || 0; });
}
if (action === 'prepare') {
  localCheck();
  const sso = read('sso-worker'), app = read('skillpassport'), dash = read('sp-dash');
  if (!local(sso.SUPABASE_URL) || !local(app.SUPABASE_URL)) throw new Error('Database configuration must use loopback endpoints');
  const secret = existsSync(secretPath) ? JSON.parse(readFileSync(secretPath)) : { sync:randomBytes(32).toString('hex'), vault:randomBytes(32).toString('base64') };
  if(!secret.activeVault)secret.activeVault=randomBytes(32).toString('base64');
  write('sp-dash','secrets.json',JSON.stringify(secret));
  const rest = JSON.parse(execFileSync('docker', ['inspect','supabase_rest_skillpassport'], {encoding:'utf8'}))[0];
  const jwtConfig = rest.Config.Env.find(line => line.startsWith('PGRST_JWT_SECRET=')).slice('PGRST_JWT_SECRET='.length);
  const jwk = jwtConfig.startsWith('{') ? JSON.parse(jwtConfig).keys?.find(key=>key.kty==='oct') : null;
  if(jwtConfig.startsWith('{') && !jwk?.k) throw new Error('Local symmetric reader signing key unavailable');
  const jwtSecret = jwk ? Buffer.from(jwk.k,'base64url') : jwtConfig;
  const encode = object => Buffer.from(JSON.stringify(object)).toString('base64url');
  const unsigned = encode({alg:'HS256',typ:'JWT'})+'.'+encode({role:'zoho_discovery',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+7*86400});
  const readerToken = unsigned+'.'+createHmac('sha256',jwtSecret).update(unsigned).digest('base64url');
  const origins = 'http://localhost:3010,http://localhost:8898,http://127.0.0.1:3010,http://127.0.0.1:8898';
  vars('sso-worker', {...pick(sso,['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','JWT_PRIVATE_KEY','JWT_PUBLIC_KEY','JWT_KID','SERVICE_AUTH_SECRET']), ENVIRONMENT:'local-review', ALLOWED_ORIGINS:origins, ALLOWED_APP_URLS:origins+',http://localhost:3010/auth/callback,http://localhost:8898/auth/callback',SKILLPASSPORT_URL:'http://localhost:8898',INTERNAL_WEBHOOK_SECRET:secret.sync});
  const dashboard = {...pick(dash,['ZOHO_CLIENT_ID','ZOHO_CLIENT_SECRET']),NEXT_PUBLIC_SUPABASE_URL:app.SUPABASE_URL,SKILLPASSPORT_SUPABASE_URL:app.SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:app.SUPABASE_ANON_KEY,SKILLPASSPORT_SERVICE_ROLE_KEY:app.SUPABASE_SERVICE_ROLE_KEY,SUPABASE_SERVICE_ROLE_KEY:app.SUPABASE_SERVICE_ROLE_KEY,SSO_WORKER_URL:'http://localhost:8897',NEXT_PUBLIC_SSO_URL:'http://localhost:8897',ZOHO_TOKEN_ENCRYPTION_KEY:secret.vault,ZOHO_TOKEN_ENCRYPTION_KEYS:JSON.stringify({'local-v1':secret.vault,'local-v2':secret.activeVault}),ZOHO_TOKEN_ENCRYPTION_ACTIVE_KEY_ID:'local-v2',ZOHO_DISCOVERY_DB_TOKEN:readerToken,ENVIRONMENT:'local-review'};
  vars('sp-dash',dashboard);
  vars('skillpassport',{...pick(app,['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY']),ENVIRONMENT:'local-review',SSO_DOMAIN:'http://localhost:8897',SKILLPASSPORT_URL:'http://localhost:8898',INTERNAL_WEBHOOK_SECRET:secret.sync,GOOGLE_OAUTH_ENABLED:'false',HEAL_MODE:'disabled'});
  vars('auth-sync-consumer',{ENVIRONMENT:'development',SKILLPASSPORT_SYNC_URL:'http://127.0.0.1:8898',SYNC_API_SECRET:secret.sync});
  worker('sso-worker','sso-api-zoho-local','../../src/index.ts', services([['ZOHO_CONTROL_PLANE','sp-dash-zoho-local','ZohoExecutionAuthority']])+producer('SYNC_QUEUE','auth-db-sync-queue-zoho-local')+'\n[[kv_namespaces]]\nbinding="RATE_LIMIT_KV"\nid="local-rate-limit"\n[[durable_objects.bindings]]\nname="AUTH_CODE_STORE"\nclass_name="AuthorizationCodeStore"\n[[migrations]]\ntag="v1_authorization_code_store"\nnew_sqlite_classes=["AuthorizationCodeStore"]\n');
  worker('sp-dash','sp-dash-zoho-local','./dashboard-runtime.mjs', services([['SSO','sso-api-zoho-local','SsoWorker'],['ZOHO_APPROVER_AUTHORITY','sso-api-zoho-local','ZohoApproverAuthority'],['ZOHO_CANDIDATE_DESTINATION','sso-api-zoho-local','ZohoCandidateProvisioner'],['WORKER_SELF_REFERENCE','sp-dash-zoho-local']])+producer('ZOHO_DISCOVERY_QUEUE','zoho-recruit-discovery-dev')+producer('ZOHO_APPROVED_QUEUE','zoho-recruit-approved-dev')+consumer('zoho-recruit-discovery-dev','zoho-recruit-discovery-dev-dlq')+consumer('zoho-recruit-approved-dev','zoho-recruit-approved-dev-dlq')+`\n[[r2_buckets]]\nbinding="SKILLPASSPORT_ASSETS"\nbucket_name="skill-echosystem-zoho-local"\n${localRecoverySchedule()}`);
  worker('auth-sync-consumer','auth-sync-consumer-zoho-local','../../src/index.ts', consumer('auth-db-sync-queue-zoho-local','auth-db-sync-queue-zoho-local-dlq')+consumer('auth-db-sync-queue-zoho-local-dlq')+'\n[[r2_buckets]]\nbinding="REVIEW_DLQ_BUCKET"\nbucket_name="local-zoho-deadletters"\n');
  write('sp-dash','proxy.toml',readFileSync(config('sp-dash'),'utf8').replace('name = "sp-dash-zoho-local"','name = "sp-dash-zoho-ui-local"'));
  write('skillpassport','wrangler.toml','name="skill-passport-portal"\ncompatibility_date="2026-09-25"\ncompatibility_flags=["nodejs_compat"]\npages_build_output_dir="./public"\n'+services([['SSO_SERVICE','sso-api-zoho-local','SsoWorker'],['ZOHO_CANDIDATE_SOURCE','sso-api-zoho-local','ZohoCandidateProvisioner']]));
  write('skillpassport','runtime.toml','name="skill-passport-portal-zoho-local"\nmain="./public/_worker.js/index.js"\ncompatibility_date="2026-09-25"\ncompatibility_flags=["nodejs_compat"]\n'+services([['SSO_SERVICE','sso-api-zoho-local','SsoWorker'],['ZOHO_CANDIDATE_SOURCE','sso-api-zoho-local','ZohoCandidateProvisioner']])+'\n[assets]\ndirectory="./public"\nbinding="ASSETS"\n');
  console.log('Local configurations prepared with flags off. No mail bindings, remote resources, credentials printed, or deployments. Restricted reader expires in seven days.');
} else if(action === 'build-dashboard') {
  const env=parse(readFileSync(resolve(dir('sp-dash'),'.dev.vars')));
  if(!local(env.SKILLPASSPORT_SUPABASE_URL)) throw new Error('Local database required');
  // Local adapter for the existing dashboard runtime; UI stays on Next dev.
  // No generated OpenNext bundle, assets, new service, deployment or source stub.
  write('sp-dash','dashboard-runtime.mjs', `import { dashboardRuntime } from '../../lib/dashboard-runtime.js';
export { ZohoExecutionAuthority } from '../../workers/zoho-execution-authority';
export default dashboardRuntime({
  fetch(request) {
    const url = new URL(request.url);
    const target = new URL('http://127.0.0.1:3010');
    target.pathname = url.pathname;
    target.search = url.search;
    return fetch(new Request(target, request), { redirect: 'manual' });
  }
});
`);
  // Upgrade only ignored local configurations created by the earlier launcher.
  for (const file of [config('sp-dash'), resolve(dir('sp-dash'),'proxy.toml')]) {
    const text = readFileSync(file,'utf8')
      .replace('main = "../../workers/sp-dash-worker.js"','main = "./dashboard-runtime.mjs"')
      .replace(/\n\[assets\]\ndirectory="[^"\n]+"\nbinding="ASSETS"\n/, '\n');
    writeFileSync(file,text,{mode:0o600});
  }
  requireDashboardRuntime(root);
  console.log('Existing dashboard runtime prepared for local queues/RPC/recovery; HTTP forwards to Next dev on 3010. No OpenNext build or deployed service required.');
} else if(action === 'build-pages') {
  const app=parse(readFileSync(resolve(dir('skillpassport'),'.dev.vars')));
  if(!local(app.SUPABASE_URL)) throw new Error('Local database required');
  const cwd=resolve(root,'skillpassport'), output=resolve(dir('skillpassport'),'public');
  mkdirSync(output,{recursive:true});
  execFileSync(process.execPath,[resolve(cwd,'node_modules/vite/bin/vite.js'),'build','--mode','development','--outDir',output,'--emptyOutDir','false'],{cwd,stdio:'inherit',env:{...process.env,VITE_SUPABASE_URL:app.SUPABASE_URL,VITE_SUPABASE_ANON_KEY:app.SUPABASE_ANON_KEY,VITE_SUPABASE_SERVICE_ROLE_KEY:'',VITE_GTM_ID:''},timeout:600000});
  execFileSync(process.execPath,[resolve(cwd,'node_modules/wrangler/bin/wrangler.js'),'pages','functions','build','functions','--outdir',resolve(output,'_worker.js'),'--compatibility-date','2026-09-25','--compatibility-flags','nodejs_compat'],{cwd,stdio:'inherit',timeout:120000});
  writeFileSync(resolve(output,'.assetsignore'),'_worker.js\n');
} else if (action === 'workers') {
  requireDashboardRuntime(root);
  run('sp-dash','node_modules/wrangler/bin/wrangler.js',['dev','--local','--ip','127.0.0.1','--port','8896','--inspector-port','9240','--test-scheduled',...['sp-dash','sso-worker','auth-sync-consumer'].flatMap(repo=>['-c',config(repo)])]);
} else if (action === 'dashboard') {
  const env=parse(readFileSync(resolve(dir('sp-dash'),'.dev.vars')));
  run('sp-dash','node_modules/next/dist/bin/next',['dev','--hostname','127.0.0.1','--port','3010'],{...env,CLOUDFLARE_LOCAL_CONFIG_PATH:resolve(dir('sp-dash'),'proxy.toml')});
} else if (action === 'pages') {
  // Run the compiled existing Pages bundle with an explicit local config. Pages
  // dev's automatic config search must not load the default mail-enabled stack.
  run('skillpassport','node_modules/wrangler/bin/wrangler.js',['dev','--local','-c',resolve(dir('skillpassport'),'runtime.toml'),'--ip','127.0.0.1','--port','8898','--inspector-port','9243']);
} else if(action === 'tick') {
  const response=await fetch(localRecoveryTickUrl(),{signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw new Error('Existing dashboard recovery failed: '+response.status);
  console.log('Existing local dashboard recovery schedule invoked.');
} else {
  localCheck();
  const configurations=Object.fromEntries(['sp-dash','sso-worker','skillpassport','auth-sync-consumer'].map(repo=>[repo,parse(readFileSync(resolve(dir(repo),'.dev.vars')))]));
  const enabledConfigurations=planLocalEnable(configurations);
  for (const [container,fn] of [['supabase_db_sso-auth','zoho_candidate_runtime_ready'],['supabase_db_skillpassport','zoho_candidate_projection_ready']]) {
    const ready=execFileSync('docker',['exec',container,'psql','-X','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1','-c',`select public.${fn}();`],{encoding:'utf8'}).trim();
    if(ready!=='t') throw new Error('Local database prerequisite failed: '+fn);
  }
  const {getPlatformProxy}=require('wrangler');
  const proxy=await getPlatformProxy({configPath:resolve(dir('sp-dash'),'proxy.toml'),remoteBindings:false});
  try {
    if(!(await proxy.env.SSO.getJWKS())?.keys?.length) throw new Error('Local SSO binding unavailable');
    const policy=await proxy.env.ZOHO_CANDIDATE_DESTINATION.getSubjectSyncPolicy({userId:'a5700000-0000-4000-8000-999999999999'});
    if(await policy.version!==1 || await policy.genericSyncAllowed!==true) throw new Error('Canonical policy binding unavailable');
    if(typeof proxy.env.ZOHO_APPROVED_QUEUE?.send!=='function' || typeof proxy.env.ZOHO_DISCOVERY_QUEUE?.send!=='function') throw new Error('Local queue binding unavailable');
    await verifyLocalProjection(configurations['auth-sync-consumer'].SYNC_API_SECRET, { requireDelivery: action === 'verify' });
    if (action === 'verify') {
      const capability=await proxy.env.ZOHO_CANDIDATE_DESTINATION.capabilities();
      if (capability?.version!==1 || capability.ready!==true || capability.emailPolicy!=='forbidden')
        throw new Error('Restarted canonical execution dependencies unavailable');
      for (const repo of Object.keys(enabledConfigurations))
        if (zohoProfileName(configurations[repo]) !== 'local')
          throw new Error('Local code profile not selected: '+repo);
    }
    const dash=configurations['sp-dash'];
    const reader=await fetch(dash.SKILLPASSPORT_SUPABASE_URL+'/rest/v1/rpc/zoho_due_discovery',{method:'POST',headers:{apikey:dash.NEXT_PUBLIC_SUPABASE_ANON_KEY,Authorization:'Bearer '+dash.ZOHO_DISCOVERY_DB_TOKEN,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});
    if(!reader.ok) throw new Error('Restricted local reader authentication failed');
  } finally {await proxy.dispose();}
  if (action === 'verify') {
    console.log('Local projection, canonical execution, reader and service probes passed after restart. No configuration or data written.');
    process.exit(0);
  }
  replaceLocalFiles(Object.entries(enabledConfigurations).map(([repo,env])=>({path:resolve(dir(repo),'.dev.vars'),contents:serializedVars(env)})));
  console.log('Local code profile selected after database probes. OAuth/readiness checks still gate discovery and destination writes. Restart local runtimes. Production configurations unchanged.');
}
