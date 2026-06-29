import type { PagesFunction } from '../../../lib/types';
import { handlePDFReceipt } from '../handlers/pdf-receipt';
import { createSupabaseClient } from '../../../lib/supabase';

export const onRequestGet: PagesFunction = async (context) => {
  const { orderId } = context.params as { orderId: string };
  const supabase = createSupabaseClient(context.env);
  return await handlePDFReceipt(orderId, context.env as any, supabase);
};
