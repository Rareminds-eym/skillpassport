#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * 
 * Commands:
 *   validate    - Validate current environment file
 *   local       - Validate .env.local
 *   development - Validate .env.development
 *   staging     - Validate .env.staging
 *   production  - Validate .env.production
 *   check       - Show which variables are set
 *   diff        - Compare two environment files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load schema
const schemaPath = path.join(rootDir, '.env.schema');
let schema;

try {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  schema = JSON.parse(schemaContent);
} catch (error) {
  console.error('❌ Failed to load .env.schema:', error.message);
  process.exit(1);
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Get log level from environment or default
 */
function getLogLevel() {
  const envLevel = process.env.VITE_LOG_LEVEL;
  if (envLevel && ['debug', 'info', 'warn', 'error'].includes(envLevel)) {
    return envLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const LOG_LEVEL_PRIORITY = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LOG_LEVEL = getLogLevel();

/**
 * Check if log level should be output
 */
function shouldLog(level) {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
}

/**
 * Structured logging output
 */
function log(level, message, metadata = {}) {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [validate-env]`;
  const metaStr = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';

  switch (level) {
    case 'debug':
      console.debug(`${prefix} ${message}${metaStr}`);
      break;
    case 'info':
      console.info(`${prefix} ${message}${metaStr}`);
      break;
    case 'warn':
      console.warn(`${prefix} ${message}${metaStr}`);
      break;
    case 'error':
      console.error(`${prefix} ${message}${metaStr}`);
      break;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Load environment file
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const [key, ...valueParts] = line.split('=');
    if (key) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

/**
 * Get environment file path
 */
function getEnvFilePath(env) {
  const envMap = {
    local: '.env.local',
    development: '.env.development',
    staging: '.env.staging',
    production: '.env.production',
  };

  if (envMap[env]) {
    return path.join(rootDir, envMap[env]);
  }

  // Try to detect from NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'development';
  return path.join(rootDir, `.env.${nodeEnv}`);
}

/**
 * Validate value against schema property
 */
function validateValue(key, value, propertySchema) {
  if (!value) {
    return { valid: false, error: 'Value is empty' };
  }

  // Check type
  if (propertySchema.type === 'string' && typeof value !== 'string') {
    return { valid: false, error: 'Must be a string' };
  }

  // Check pattern
  if (propertySchema.pattern) {
    const regex = new RegExp(propertySchema.pattern);
    if (!regex.test(value)) {
      return { valid: false, error: `Must match pattern: ${propertySchema.pattern}` };
    }
  }

  // Check enum
  if (propertySchema.enum && !propertySchema.enum.includes(value)) {
    return { valid: false, error: `Must be one of: ${propertySchema.enum.join(', ')}` };
  }

  // Check minLength
  if (propertySchema.minLength && value.length < propertySchema.minLength) {
    return { valid: false, error: `Must be at least ${propertySchema.minLength} characters` };
  }

  return { valid: true };
}

/**
 * Validate environment object
 */
function validateEnv(env, envName) {
  const required = schema.required || [];
  const properties = schema.properties || {};
  const errors = [];
  const warnings = [];
  const valid = [];

  // Check required variables
  for (const key of required) {
    if (!env[key]) {
      errors.push(`❌ ${key}: Missing required variable`);
    } else {
      const propSchema = properties[key];
      if (propSchema) {
        const validation = validateValue(key, env[key], propSchema);
        if (!validation.valid) {
          errors.push(`❌ ${key}: ${validation.error}`);
        } else {
          valid.push(`✓ ${key}`);
        }
      } else {
        valid.push(`✓ ${key}`);
      }
    }
  }

  // Check optional variables
  for (const [key, value] of Object.entries(env)) {
    if (!required.includes(key) && properties[key]) {
      const validation = validateValue(key, value, properties[key]);
      if (!validation.valid) {
        warnings.push(`⚠ ${key}: ${validation.error}`);
      }
    }
  }

  return { errors, warnings, valid };
}

// ============================================================================
// COMMANDS
// ============================================================================

/**
 * Validate command
 */
function cmdValidate(envName) {
  const filePath = getEnvFilePath(envName);
  const env = loadEnvFile(filePath);

  if (!env) {
    log('error', `Environment file not found: ${filePath}`);
    process.exit(1);
  }

  log('info', `Validating ${path.basename(filePath)}`);

  const { errors, warnings, valid } = validateEnv(env, envName);

  if (valid.length > 0) {
    log('debug', `Found ${valid.length} valid variables`);
  }

  if (warnings.length > 0) {
    warnings.forEach(w => log('warn', w));
  }

  if (errors.length > 0) {
    errors.forEach(e => log('error', e));
    log('error', `Validation failed with ${errors.length} error(s)`);
    process.exit(1);
  }

  log('info', 'All required variables are valid');
}

/**
 * Check command - show which variables are set
 */
function cmdCheck(envName) {
  const filePath = getEnvFilePath(envName);
  const env = loadEnvFile(filePath);

  if (!env) {
    log('error', `Environment file not found: ${filePath}`);
    process.exit(1);
  }

  log('info', `Checking environment variables in ${path.basename(filePath)}`);

  const required = schema.required || [];
  const properties = schema.properties || [];

  let setCount = 0;
  let unsetCount = 0;

  for (const key of required) {
    if (env[key]) {
      setCount++;
      log('debug', `${key} is set`);
    } else {
      unsetCount++;
      log('warn', `${key} is not set`);
    }
  }

  log('info', `Environment check complete: ${setCount} set, ${unsetCount} unset`);
}

/**
 * Diff command - compare two environment files
 */
function cmdDiff(env1Name, env2Name) {
  const file1 = getEnvFilePath(env1Name);
  const file2 = getEnvFilePath(env2Name);

  const env1 = loadEnvFile(file1);
  const env2 = loadEnvFile(file2);

  if (!env1) {
    log('error', `Environment file not found: ${file1}`);
    process.exit(1);
  }

  if (!env2) {
    log('error', `Environment file not found: ${file2}`);
    process.exit(1);
  }

  log('info', `Comparing ${path.basename(file1)} vs ${path.basename(file2)}`);

  const allKeys = new Set([...Object.keys(env1), ...Object.keys(env2)]);
  const differences = [];

  for (const key of allKeys) {
    const val1 = env1[key];
    const val2 = env2[key];

    if (val1 !== val2) {
      differences.push({ key, env1: val1 || '<not set>', env2: val2 || '<not set>' });
      log('debug', `Difference found in ${key}`);
    }
  }

  if (differences.length === 0) {
    log('info', 'No differences found');
    return;
  }

  log('info', `Found ${differences.length} difference(s)`);
}

/**
 * Validate all environment files
 */
function cmdValidateAll() {
  const envs = ['local', 'development', 'staging', 'production'];
  let allValid = true;
  const results = [];

  log('info', 'Validating all environment files');

  for (const env of envs) {
    const filePath = getEnvFilePath(env);
    const envData = loadEnvFile(filePath);

    if (!envData) {
      log('warn', `Skipping ${env}: file not found`);
      results.push({ env, status: 'skipped', reason: 'file not found' });
      continue;
    }

    const { errors, warnings } = validateEnv(envData, env);

    if (errors.length > 0) {
      allValid = false;
      log('error', `${env}: ${errors.length} error(s)`);
      errors.forEach(e => log('error', `  ${e}`));
      results.push({ env, status: 'failed', errors: errors.length });
    } else {
      log('info', `${env}: valid`);
      results.push({ env, status: 'valid', warnings: warnings.length });
    }

    if (warnings.length > 0) {
      log('warn', `${env}: ${warnings.length} warning(s)`);
    }
  }

  log('info', `Validation complete: ${results.filter(r => r.status === 'valid').length}/${envs.length} valid`);

  if (!allValid) {
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (command) {
  case 'validate':
    cmdValidate(arg1 || 'development');
    break;

  case 'validate:all':
    cmdValidateAll();
    break;

  case 'local':
    cmdValidate('local');
    break;

  case 'development':
    cmdValidate('development');
    break;

  case 'staging':
    cmdValidate('staging');
    break;

  case 'production':
    cmdValidate('production');
    break;

  case 'check':
    cmdCheck(arg1 || 'development');
    break;

  case 'diff':
    if (!arg1 || !arg2) {
      log('error', 'Usage: npm run env:diff <env1> <env2>');
      log('error', 'Example: npm run env:diff development production');
      process.exit(1);
    }
    cmdDiff(arg1, arg2);
    break;

  default:
    log('info', `Environment Validation Script - use 'validate', 'check', or 'diff' command`);
    process.exit(0);
}
