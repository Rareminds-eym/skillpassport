#!/usr/bin/env node
import { execSync } from 'child_process';
import { rmSync } from 'fs';

console.log('🧹 Cleaning up old processes and build cache...');

// Clean build artifacts and cache
try {
  rmSync('dist', { recursive: true, force: true });
  rmSync('node_modules/.vite', { recursive: true, force: true });
  console.log('✓ Cleaned dist and vite cache');
} catch {
  console.log('✓ No cache to clean');
}

const ports = [3000, 8788, 9001, 9002, 9003, 9229, 9230, 9231, 9232];

if (process.platform === 'win32') {
  // Windows: use netstat + taskkill
  const procs = ['concurrently', 'wrangler', 'workerd'];
  for (const proc of procs) {
    try {
      execSync(`taskkill /F /IM ${proc}.exe /T`, { stdio: 'ignore' });
      console.log(`✓ Killed ${proc} processes`);
    } catch {
      console.log(`✓ No ${proc} processes found`);
    }
  }

  for (const port of ports) {
    try {
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = result.trim().split('\n');
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`✓ Freed port ${port}`);
        } catch {}
      }
    } catch {
      // port not in use
    }
  }
} else {
  // Unix
  const procs = ['concurrently', 'wrangler', 'workerd'];
  for (const proc of procs) {
    try {
      execSync(`pkill -9 -f "${proc}"`, { stdio: 'ignore' });
      console.log(`✓ Killed ${proc} processes`);
    } catch {
      console.log(`✓ No ${proc} processes found`);
    }
  }

  for (const port of ports) {
    try {
      const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
      if (pid) {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        console.log(`✓ Freed port ${port}`);
      }
    } catch {}
  }
}

console.log('✅ Cleanup complete! Starting services...');
