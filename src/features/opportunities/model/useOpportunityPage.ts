import { useEffect, useState } from 'react';
import { apiGet } from '@/shared/api';

const emptyRows: Record<string, unknown>[] = [];
/** Page-sized requests only; obsolete requests are cancelled and cannot replace the current result. */
export function useOpportunityPage(
  path: string,
  collection: 'visits' | 'applications',
  identity: string | undefined,
  enabled: boolean,
  revision = 0,
) {
  const key = `${identity || ''}:${path}:${revision}`;
  const [result, setResult] = useState({
    key: '',
    rows: emptyRows,
    total: 0,
    loading: false,
    error: '',
  });
  useEffect(() => {
    if (!enabled || !identity) return;
    const controller = new AbortController();
    let active = true;
    setResult((previous) => ({
      ...previous,
      key,
      rows: emptyRows,
      loading: true,
      error: '',
    }));
    const timer = setTimeout(() => {
      apiGet<{ data: Record<string, unknown> }>(path, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!active) return;
          const data = response.data;
          if (
            !Array.isArray(data?.[collection]) ||
            typeof data.total !== 'number' ||
            !Number.isSafeInteger(data.total) ||
            data.total < 0
          )
            throw new Error('Invalid page response. Please retry.');
          setResult({
            key,
            rows: data[collection] as Record<string, unknown>[],
            total: data.total,
            loading: false,
            error: '',
          });
        })
        .catch((error) => {
          if (active)
            setResult({
              key,
              rows: emptyRows,
              total: 0,
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Unable to load results.',
            });
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, path, collection, identity, enabled]);
  const current = result.key === key;
  return {
    rows: current ? result.rows : emptyRows,
    total: current ? result.total : 0,
    loading: enabled && (!current || result.loading),
    error: current ? result.error : '',
  };
}
