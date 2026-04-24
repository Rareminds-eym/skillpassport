#!/usr/bin/env node
import { execSync } from 'child_process';

console.log('🛑 Stopping all development servers...');

const ports = [
  { port: 3000, name: 'Frontend (Vite)' },
  { port: 8788, name: 'Pages Functions' },
  { port: 9001, name: 'Email Worker' },
  { port: 9002, name: 'Embedding Worker' },
  { port: 9003, name: 'Payments Worker' },
];

if (process.platform === 'win32') {
  for (const { port, name } of ports) {
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
          console.log(`  ✓ Stopped ${name} on port ${port}`);
        } catch {}
      }
    } catch {
      // port not in use
    }
  }

  const procs = ['vite', 'wrangler', 'concurrently'];
  for (const proc of procs) {
    try {
      execSync(`taskkill /F /IM ${proc}.exe /T`, { stdio: 'ignore' });
    } catch {}
  }
} else {
  for (const { port, name } of ports) {
    try {
      const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
      if (pid) {
        execSync(`kill -15 ${pid} 2>/dev/null || kill -9 ${pid}`, { stdio: 'ignore' });
        console.log(`  ✓ Stopped ${name} on port ${port}`);
      }
    } catch {}
  }

  const patterns = [
    'vite.*--mode development',
    'wrangler pages dev',
    'wrangler dev.*email-api',
    'wrangler dev.*embedding-api',
    'wrangler dev.*payments-api',
    'concurrently',
  ];
  for (const pattern of patterns) {
    try { execSync(`pkill -f "${pattern}"`, { stdio: 'ignore' }); } catch {}
  }
}

console.log('✅ All servers stopped!');
