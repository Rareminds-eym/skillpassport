import { expect, it } from 'vitest';
import { z } from 'zod';
import * as configuration from '../subscription-config';

it('exports only the two canonical identity constants, without URL values or an environment selector', () => {
  expect(Object.keys(configuration).sort()).toEqual(['HYBRID_PLAN_ID', 'SKILLPASSPORT_PRODUCT_ID']);
  expect(z.string().uuid().safeParse(configuration.SKILLPASSPORT_PRODUCT_ID).success).toBe(true);
  expect(z.string().uuid().safeParse(configuration.HYBRID_PLAN_ID).success).toBe(true);
  expect(configuration.SKILLPASSPORT_PRODUCT_ID).not.toBe(configuration.HYBRID_PLAN_ID);
});
