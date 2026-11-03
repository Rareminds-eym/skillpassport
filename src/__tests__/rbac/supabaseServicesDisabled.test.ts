// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const config = fs.readFileSync(path.join(root, 'supabase/config.toml'), 'utf8');
const sections = new Map(config.split(/(?=^\[)/m).slice(1).map(block => {
  const name = block.match(/^\[([^\]]+)\]/)![1];
  return [name, block.replace(/#.*$/gm, '')];
}));

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return ['__tests__', 'test', 'node_modules'].includes(entry.name) ? [] : sourceFiles(full);
    return /\.[cm]?[jt]sx?$/.test(entry.name) && !/\.(test|spec|d)\.[cm]?[jt]sx?$/.test(entry.name) ? [full] : [];
  });
}

type Node = { type?: string; name?: string; value?: unknown; object?: Node; property?: Node; callee?: Node; [key: string]: unknown };
function memberPath(node?: Node): string[] {
  if (!node) return [];
  if (node.type === 'Identifier') return [node.name!];
  if (node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression') {
    const property = node.property?.name ?? node.property?.value;
    return [...memberPath(node.object), String(property)];
  }
  return [];
}

function serviceCalls(node: Node, hits: string[]): void {
  if (node.type === 'CallExpression' || node.type === 'OptionalCallExpression') {
    if (node.callee?.type === 'Identifier' && node.callee.name === 'createClient') {
      const options = (node.arguments as Node[] | undefined)?.[2];
      const properties = options?.properties as Node[] | undefined;
      if (!properties?.some(property => (property.key as Node)?.name === 'accessToken')) {
        hits.push('createClient without an explicit database accessToken');
      }
    }
    const members = memberPath(node.callee);
    const authIndex = members.indexOf('auth');
    const storageIndex = members.indexOf('storage');
    if (authIndex > 0 && !members.includes('puter')) hits.push(members.join('.'));
    if (storageIndex >= 0 && ['from', 'createBucket', 'listBuckets', 'getBucket', 'updateBucket', 'deleteBucket', 'emptyBucket'].includes(members[storageIndex + 1])) {
      hits.push(members.join('.'));
    }
  }
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'comments', 'leadingComments', 'trailingComments', 'innerComments', 'tokens'].includes(key)) continue;
    if (Array.isArray(value)) {
      for (const child of value) if (child && typeof child === 'object') serviceCalls(child as Node, hits);
    } else if (value && typeof value === 'object') serviceCalls(value as Node, hits);
  }
}

describe('SSO and R2 service ownership', () => {
  for (const service of ['auth', 'storage', 'local_smtp']) {
    it(`explicitly disables built-in ${service} in the local stack`, () => {
      expect(sections.get(service)).toMatch(/^enabled\s*=\s*false\s*$/m);
      expect([...sections.keys()].filter(name => name.startsWith(`${service}.`))).toEqual([]);
    });
  }

  it('has no built-in auth or Supabase Storage calls in frontend or Functions code', () => {
    const violations: string[] = [];
    for (const directory of ['src', 'functions']) {
      for (const file of sourceFiles(path.join(root, directory))) {
        const ast = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'unambiguous', errorRecovery: true, plugins: ['typescript', 'jsx'] });
        const calls: string[] = [];
        serviceCalls(ast as unknown as Node, calls);
        violations.push(...calls.map(call => `${path.relative(root, file)}: ${call}`));
      }
    }
    expect(violations).toEqual([]);
  });
});
