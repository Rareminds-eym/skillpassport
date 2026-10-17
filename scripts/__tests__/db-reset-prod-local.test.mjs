import { Readable, Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { filterAuthInserts } from '../db-reset-prod-local.mjs';

const run = async text => {
  let output = '';
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });
  const result = await filterAuthInserts(Readable.from([text]), sink);
  return { ...result, output };
};

const audit = `INSERT INTO "auth"."audit_log_entries" ("instance_id", "id") VALUES
\t('0000', 'a'),
\t('0000', 'b');
`;
const users = `INSERT INTO "auth"."users" ("instance_id", "id") VALUES
\t('0000', 'u1', 'multi
line'),
\t('0000', 'u2');
`;
const identities = `INSERT INTO "auth"."identities" ("provider_id") VALUES
\t('x');
`;
const publicRows = `INSERT INTO "public"."users" ("id") VALUES
\t('u1'),
\t('u2');
SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 9314, true);
`;

describe('filterAuthInserts', () => {
  it('removes exactly the three auth INSERTs and keeps everything else byte for byte', async () => {
    const { output, removedStatements, removedLines } = await run(`SET x = 1;\n${audit}\n${users}\n${identities}\n${publicRows}`);
    expect([...removedStatements].sort()).toEqual(['audit_log_entries', 'identities', 'users']);
    expect(removedLines).toBe(3 + 4 + 2);
    expect(output).toBe(`SET x = 1;\n\n\n\n${publicRows}`);
    expect(output).not.toMatch(/^INSERT INTO "auth"\./m);
    expect(output).toContain(`setval('"auth"."refresh_tokens_id_seq"'`);
  });

  it('fails when one of the three statements is missing', async () => {
    await expect(run(`${audit}${users}${publicRows}`)).rejects.toThrow(/identities/);
  });

  it('fails when a statement is never terminated', async () => {
    await expect(run(`${audit}${users}INSERT INTO "auth"."identities" ("provider_id") VALUES\n\t('x'),\n`)).rejects.toThrow(
      /Unterminated/
    );
  });

  it('fails when a new statement starts before the terminator', async () => {
    await expect(run(`INSERT INTO "auth"."audit_log_entries" ("id") VALUES\n\t('a'),\nSELECT 1;\n`)).rejects.toThrow(/Unterminated/);
  });

  it('fails on an unexpected auth INSERT such as auth.sessions', async () => {
    await expect(run(`${audit}${users}${identities}INSERT INTO "auth"."sessions" ("id") VALUES\n\t('s');\n`)).rejects.toThrow(
      /Unexpected auth INSERT/
    );
  });

  it('fails when a statement appears twice', async () => {
    await expect(run(`${audit}${audit}${users}${identities}`)).rejects.toThrow(/exactly one INSERT/);
  });
});
