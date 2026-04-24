#!/usr/bin/env node
import { execSync, spawn } from 'child_process';

function isDockerRunning() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function waitForDocker(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (isDockerRunning()) return true;
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

async function main() {
  if (isDockerRunning()) {
    console.log('Docker is already running.');
    process.exit(0);
  }

  console.log('Starting Docker Desktop...');

  const platform = process.platform;
  if (platform === 'win32') {
    const paths = [
      'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
      process.env.PROGRAMFILES + '\\Docker\\Docker\\Docker Desktop.exe',
    ];
    let started = false;
    for (const p of paths) {
      try {
        spawn(p, [], { detached: true, stdio: 'ignore' }).unref();
        started = true;
        break;
      } catch {}
    }
    if (!started) {
      console.error('Could not find Docker Desktop. Please start it manually.');
      process.exit(1);
    }
  } else if (platform === 'darwin') {
    spawn('open', ['-a', 'Docker'], { detached: true, stdio: 'ignore' }).unref();
  } else {
    try {
      execSync('sudo systemctl start docker', { stdio: 'inherit' });
    } catch {
      execSync('sudo service docker start', { stdio: 'inherit' });
    }
  }

  console.log('Waiting for Docker to be ready...');
  const ready = await waitForDocker();
  if (ready) {
    console.log('Docker is ready.');
  } else {
    console.error('Docker did not start in time. Please start it manually.');
    process.exit(1);
  }
}

main();
