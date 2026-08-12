import { z } from 'zod';
import { LTE_CAPABILITY_STATUSES, type LteCapabilityStatus, type LteSyncCapability } from './lte-sync-write';
import { callLteGateway, LteGatewayError } from './lte-gateway-client';

export { CALLER_APP, SUPPORTED_ACTIONS, type LteAction } from './lte-gateway-client';

/** Gateway action verb used by this wrapper — must match LTE's action registry. */
export const ACTION = 'capabilities:get';

const LteCapabilitySchema = z.object({
  id: z.string().min(1),
  code: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  currentLevel: z.number().optional(),
  totalLevels: z.number().optional(),
  durationHours: z.number().optional(),
  roleName: z.string().optional(),
  resumeUrl: z.string().optional(),
});

const CapabilitiesDataSchema = z.object({
  capabilities: z.array(LteCapabilitySchema).optional(),
});

function isStatus(value?: string): value is LteCapabilityStatus {
  return !!value && (LTE_CAPABILITY_STATUSES as readonly string[]).includes(value);
}

/**
 * Deep module: fetch a learner's LTE capability snapshot via the SP → LTE
 * service-token gateway. The generic `callLteGateway` client handles auth,
 * timeout and envelope parsing; here we only define the `capabilities:get`
 * response shape and map it to `LteSyncCapability[]`. `resumeUrl` is sent by LTE
 * (built from its LTE_PUBLIC_URL), not re-derived on this side.
 */
export async function fetchLteCapabilities(
  env: Record<string, string>,
  userId: string,
): Promise<LteSyncCapability[]> {
  const data = await callLteGateway<unknown>(env, ACTION, { userId }, userId);
  const parsed = CapabilitiesDataSchema.safeParse(data);
  if (!parsed.success) {
    throw new LteGatewayError('LTE returned malformed capabilities payload', 'VALIDATION_ERROR');
  }

  return (parsed.data.capabilities ?? []).map((c): LteSyncCapability => ({
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description ?? '',
    status: isStatus(c.status) ? c.status : 'not_started',
    currentLevel: c.currentLevel ?? 0,
    totalLevels: c.totalLevels ?? 0,
    durationHours: c.durationHours ?? 0,
    roleName: c.roleName,
    resumeUrl: c.resumeUrl,
  }));
}

