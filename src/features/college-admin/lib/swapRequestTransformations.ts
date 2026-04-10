/**
 * Swap request data transformation utilities
 */

export interface SwapRequest {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'all';
  [key: string]: any;
}

/**
 * Filter swap requests by status
 */
export function filterSwapRequestsByStatus(
  requests: SwapRequest[],
  status: string
): SwapRequest[] {
  if (status === 'all') return requests;
  return requests.filter(r => r.status === status);
}

/**
 * Count swap requests by status
 */
export function countSwapRequestsByStatus(
  requests: SwapRequest[]
): Record<string, number> {
  return requests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, { all: requests.length } as Record<string, number>);
}

/**
 * Format status for display
 */
export function formatSwapStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
