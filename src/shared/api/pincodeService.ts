/**
 * Pincode Service
 * Provides lightweight on-demand lookup for Indian postal codes
 * Replaces the 33MB static 'indian-pincodes' client bundle with zero-payload API queries.
 */

export interface PincodeResult {
  pincode: string;
  name: string;
  district: string;
  state: string;
  country: string;
}

const cache = new Map<string, PincodeResult[]>();

export async function searchIndianPincodes(query: string, signal?: AbortSignal): Promise<PincodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 3) {
    return [];
  }

  const cacheKey = trimmed.toLowerCase();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const isNumeric = /^\d+$/.test(trimmed);
  const url = isNumeric
    ? `https://api.postalpincode.in/pincode/${trimmed}`
    : `https://api.postalpincode.in/postoffice/${encodeURIComponent(trimmed)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data) || !data[0] || data[0].Status !== 'Success' || !Array.isArray(data[0].PostOffice)) {
      return [];
    }

    const results: PincodeResult[] = data[0].PostOffice.map((po: any) => ({
      pincode: po.Pincode || '',
      name: po.Name || '',
      district: po.District || '',
      state: po.State || '',
      country: po.Country || 'India',
    }));

    cache.set(cacheKey, results);
    return results;
  } catch (err) {
    // Network error or aborted - return empty list gracefully
    return [];
  }
}
