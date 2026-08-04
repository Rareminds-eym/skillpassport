#!/usr/bin/env node

import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

async function main() {
  console.log('Validating SkillPassport internal gateway actions registry...');

  const indexPath = join(process.cwd(), 'functions/api/internal/lte/v1/index.ts');
  let content;
  try {
    content = await readFile(indexPath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read index.ts at ${indexPath}:`, error.message);
    process.exit(1);
  }

  // Find the REGISTRY block
  const registryMatch = content.match(/const REGISTRY:\s*Record<string,\s*GatewayAction>\s*=\s*\{([\s\S]*?)\};/);
  if (!registryMatch) {
    console.error('Could not find REGISTRY object in index.ts');
    process.exit(1);
  }

  const registryBlock = registryMatch[1];

  // Extract registry entries like: 'learning-track:get': handleLearningTrack,
  const entryRegex = /['"]([^'"]+)['"]\s*:\s*(\w+)/g;
  let match;
  const entries = [];
  while ((match = entryRegex.exec(registryBlock)) !== null) {
    entries.push({ key: match[1], handler: match[2] });
  }

  if (entries.length === 0) {
    console.error('No registry entries found in REGISTRY block');
    process.exit(1);
  }

  let hasErrors = false;

  for (const { key, handler } of entries) {
    // 1. Validate action name format
    // Allow either "<domain>:<verb>" or the "ping" exception
    const formatRegex = /^[a-z0-9-]+:[a-z0-9-]+$/;
    if (key !== 'ping' && !formatRegex.test(key)) {
      console.error(`[ERROR] Action key "${key}" does not match the expected format "^[a-z0-9-]+:[a-z0-9-]+$"`);
      hasErrors = true;
    }

    // 2. Find the import statement for this handler in index.ts
    const importRegex = new RegExp(`import\\s*\\{\\s*${handler}\\s*\\}\\s*from\\s*['"]\\.\\/actions\\/([^'"]+)['"]`);
    const importMatch = content.match(importRegex);
    if (!importMatch) {
      console.error(`[ERROR] Could not find import statement for handler "${handler}" from "./actions/"`);
      hasErrors = true;
      continue;
    }

    const actionFileBase = importMatch[1];
    const actionFilePath = join(process.cwd(), 'functions/api/internal/lte/v1/actions', `${actionFileBase}.ts`);

    try {
      await access(actionFilePath);
    } catch {
      console.error(`[ERROR] Action handler file for "${key}" does not exist at expected path: ${actionFilePath}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.log('\nValidation failed.');
    process.exit(1);
  }

  console.log('\nAll registry actions verified successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected validation error:', err);
  process.exit(1);
});
