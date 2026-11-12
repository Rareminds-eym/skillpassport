import { spawn } from 'node:child_process';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { configurePreview } from './lib/preview-env.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const processes = [];
let stopping = false;
let started = false;
let timer;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  clearTimeout(timer);
  process.exitCode = code;
  for (const child of processes) {
    if (!child.pid || child.exitCode !== null) continue;
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    } else child.kill('SIGTERM');
  }
}

function launch(command, args, options = {}) {
  const child = spawn(command, args, { cwd: root, windowsHide: true, ...options });
  processes.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code || 1); });
  return child;
}

function listening(port) {
  return new Promise(resolve => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(1000);
    const done = value => { socket.destroy(); resolve(value); };
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
  });
}

async function cloudflaredCommand() {
  if (process.env.CLOUDFLARED_PATH) {
    await access(process.env.CLOUDFLARED_PATH);
    return process.env.CLOUDFLARED_PATH;
  }
  if (process.platform === 'win32') {
    for (const directory of [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]) {
      if (!directory) continue;
      const candidate = path.join(directory, 'cloudflared', 'cloudflared.exe');
      try { await access(candidate); return candidate; } catch { /* Try the next installation directory. */ }
    }
  }
  return 'cloudflared';
}

async function start(origin) {
  const appPath = path.join(root, '.dev.vars');
  const ssoPath = path.resolve(root, '../sso-worker/.dev.vars');
  const [app, sso] = await Promise.all([readFile(appPath, 'utf8'), readFile(ssoPath, 'utf8')]);
  const configured = configurePreview(app, sso, origin);
  if (stopping) return;
  await writeFile(ssoPath, configured.sso);
  await writeFile(appPath, configured.app);
  if (stopping) return;
  clearTimeout(timer);
  console.log(`\nPUBLIC PREVIEW: ${origin}\nStarting local workers and Pages on 8788. Wait for Pages Ready before sharing.\n`);
  launch(process.execPath, [path.join(root, 'node_modules/concurrently/dist/bin/concurrently.js'),
    '--kill-others', '-n', 'workers,pages',
    'npm --prefix ../sso-worker run dev:stack', 'npm run pages:dev'], { stdio: 'inherit' });
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

try {
  await access(path.join(root, 'dist/index.html'));
  for (const port of [8787, 8788]) {
    if (await listening(port)) throw new Error(`Port ${port} is already in use. Stop the existing worker/Pages session, then rerun this command.`);
  }
  // Validate local environment before opening any public tunnel.
  const [app, sso] = await Promise.all([
    readFile(path.join(root, '.dev.vars'), 'utf8'),
    readFile(path.resolve(root, '../sso-worker/.dev.vars'), 'utf8'),
  ]);
  configurePreview(app, sso, 'https://preflight.trycloudflare.com');
  console.log('Basic site preview: Quick Tunnels do not support AI SSE streaming. LTE is not started.');
  // Keep the upstream host local so Wrangler does not downgrade the public
  // HTTPS Origin header to HTTP while proxying into its development runtime.
  const tunnel = launch(await cloudflaredCommand(), ['tunnel', '--url', 'http://127.0.0.1:8788', '--http-host-header', 'localhost:8788', '--no-autoupdate'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  const onOutput = chunk => {
    const text = chunk.toString();
    process.stdout.write(text);
    output = (output + text).slice(-16000);
    const origin = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
    if (origin && !started && !stopping) {
      started = true;
      start(origin).catch(error => { console.error(error.message); stop(1); });
    }
  };
  tunnel.stdout.on('data', onOutput);
  tunnel.stderr.on('data', onOutput);
  timer = setTimeout(() => { console.error('Timed out waiting for the public tunnel URL.'); stop(1); }, 60000);
} catch (error) {
  console.error(error.message);
  stop(1);
}
