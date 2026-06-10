import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('optimized-query-service');

class QueryCache {
  private cache: Map<string, { value: unknown; timestamp: number }>;
  private ttl: number;

  constructor(ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key: string, value: unknown) {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  invalidate(key?: string) {
    if (key) this.cache.delete(key);
    else this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

const learnerCache = new QueryCache(5 * 60 * 1000);
const emailCheckCache = new QueryCache(10 * 60 * 1000);
const subscriptionCache = new QueryCache(2 * 60 * 1000);

const callData = async <T>(action: string, params?: Record<string, unknown>): Promise<T> => {
  return apiPost<T>('/analytics/data', { action, ...params });
};

export const checkEmailExistsOptimized = async (email: string) => {
  const cacheKey = `email:${email.toLowerCase()}`;
  const cached = emailCheckCache.get(cacheKey);
  if (cached !== null) return cached;

  try {
    const response: any = await callData('check-email', { email });
    const exists = response.data;
    emailCheckCache.set(cacheKey, exists);
    return exists;
  } catch (error) {
    logger.error('Email check error', error instanceof Error ? error : new Error(String(error)), { email });
    return false;
  }
};

export const getlearnerByIdOptimized = async (learnerId: string) => {
  const cacheKey = `learner:${learnerId}`;
  const cached = learnerCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response: any = await callData('get-learner-by-id', { learnerId });
    if (response.data) learnerCache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    logger.error('Learner lookup error', error instanceof Error ? error : new Error(String(error)), { learnerId });
    return null;
  }
};

export const getlearnersBatch = async (learnerIds: string[]) => {
  const uncachedIds: string[] = [];
  const results: unknown[] = [];

  for (const id of learnerIds) {
    const cached = learnerCache.get(`learner:${id}`);
    if (cached) results.push(cached);
    else uncachedIds.push(id);
  }

  if (uncachedIds.length > 0) {
    try {
      const response: any = await callData('get-learners-batch', { learnerIds: uncachedIds });
      if (response.data) {
        response.data.forEach((learner: any) => {
          learnerCache.set(`learner:${learner.id}`, learner);
          results.push(learner);
        });
      }
    } catch (error) {
      logger.error('Batch learner fetch error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  return results;
};

export const getActiveSubscriptionOptimized = async (userId: string) => {
  const cacheKey = `subscription:${userId}`;
  const cached = subscriptionCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response: any = await callData('get-active-subscription', { userId });
    if (response.data) subscriptionCache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    logger.error('Subscription fetch error', error instanceof Error ? error : new Error(String(error)), { userId });
    return null;
  }
};

export const prefetchUserData = async (userId: string) => {
  await Promise.all([
    getlearnerByIdOptimized(userId),
    getActiveSubscriptionOptimized(userId),
  ]).catch(error => {
    logger.error('Prefetch error', error instanceof Error ? error : new Error(String(error)), { userId });
  });
};

export const quickEmailCheck = async (email: string) => {
  const cacheKey = `email:${email.toLowerCase()}`;
  const cached = emailCheckCache.get(cacheKey) as { exists: boolean; name: string | null } | null;
  if (cached !== null) return cached;

  try {
    const response: any = await callData('quick-email-check', { email });
    const result = response.data || { exists: false, name: null };
    emailCheckCache.set(cacheKey, result);
    return result;
  } catch {
    return { exists: false, name: null };
  }
};

export const invalidateCache = {
  learner: (id: string) => learnerCache.invalidate(`learner:${id}`),
  email: (email: string) => emailCheckCache.invalidate(`email:${email.toLowerCase()}`),
  subscription: (userId: string) => subscriptionCache.invalidate(`subscription:${userId}`),
  all: () => {
    learnerCache.invalidate();
    emailCheckCache.invalidate();
    subscriptionCache.invalidate();
  }
};

export const getCacheStats = () => ({
  learners: learnerCache.size(),
  emails: emailCheckCache.size(),
  subscriptions: subscriptionCache.size()
});

export class OptimizedQuery {
  private table: string;
  private selectFields = '*';
  private filters: Array<{ column: string; operator: string; value: unknown }> = [];
  private cacheKey: string | null = null;
  private cacheTTL = 5 * 60 * 1000;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string) {
    this.selectFields = fields;
    return this;
  }

  filter(column: string, operator: string, value: unknown) {
    this.filters.push({ column, operator, value });
    return this;
  }

  cache(key: string, ttl?: number) {
    this.cacheKey = key;
    if (ttl) this.cacheTTL = ttl;
    return this;
  }

  async execute() {
    if (this.cacheKey) {
      const cached = learnerCache.get(this.cacheKey);
      if (cached) return cached;
    }

    try {
      const response: any = await callData('get-learners-batch', {
        learnerIds: [],
        table: this.table,
        select: this.selectFields,
        filters: this.filters,
      });

      if (this.cacheKey && response.data) {
        learnerCache.set(this.cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      logger.error('Optimized query error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

export const optimizedQuery = (table: string) => new OptimizedQuery(table);
