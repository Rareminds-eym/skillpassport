import { supabase } from '../lib/supabaseClient';

/**
 * Optimized Query Service
 * Implements caching, batching, and efficient query patterns
 */

// In-memory cache with TTL
class QueryCache {
  constructor(ttl = 5 * 60 * 1000) {
    // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  invalidate(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  size() {
    return this.cache.size;
  }
}

// Create cache instances
const studentCache = new QueryCache(5 * 60 * 1000); // 5 min
const emailCheckCache = new QueryCache(10 * 60 * 1000); // 10 min
const subscriptionCache = new QueryCache(2 * 60 * 1000); // 2 min

/**
 * Optimized email existence check using database function
 */
export const checkEmailExistsOptimized = async (email) => {
  const cacheKey = `email:${email.toLowerCase()}`;

  // Check cache first
  const cached = emailCheckCache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    // Use optimized database function
    const { data, error } = await supabase.rpc('check_email_exists', { email_to_check: email });

    if (error) throw error;

    emailCheckCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Email check error:', error);
    // Fallback to direct query
    const { data } = await supabase
      .from('students')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    const exists = !!data;
    emailCheckCache.set(cacheKey, exists);
    return exists;
  }
};

/**
 * Optimized student lookup by ID
 */
export const getStudentByIdOptimized = async (studentId) => {
  const cacheKey = `student:${studentId}`;

  // Check cache
  const cached = studentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Use database function for optimized query
    const { data, error } = await supabase.rpc('get_student_by_id', { student_id: studentId });

    if (error) throw error;

    const student = data && data.length > 0 ? data[0] : null;
    if (student) {
      studentCache.set(cacheKey, student);
    }

    return student;
  } catch (error) {
    console.error('Student lookup error:', error);
    // Fallback to direct query
    const { data } = await supabase
      .from('students')
      .select('id, email, name, profile, createdAt')
      .eq('id', studentId)
      .single();

    if (data) {
      studentCache.set(cacheKey, data);
    }
    return data;
  }
};

/**
 * Batch query multiple students (reduces round trips)
 */
export const getStudentsBatch = async (studentIds) => {
  const uncachedIds = [];
  const results = [];

  // Check cache for each ID
  for (const id of studentIds) {
    const cached = studentCache.get(`student:${id}`);
    if (cached) {
      results.push(cached);
    } else {
      uncachedIds.push(id);
    }
  }

  // Fetch uncached in single query
  if (uncachedIds.length > 0) {
    const { data, error } = await supabase
      .from('students')
      .select('id, email, name, profile, createdAt')
      .in('id', uncachedIds);

    if (!error && data) {
      data.forEach((student) => {
        studentCache.set(`student:${student.id}`, student);
        results.push(student);
      });
    }
  }

  return results;
};

/**
 * Optimized subscription query with caching
 */
export const getActiveSubscriptionOptimized = async (userId) => {
  const cacheKey = `subscription:${userId}`;

  const cached = subscriptionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('student_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    subscriptionCache.set(cacheKey, data);
  }

  return data;
};

/**
 * Prefetch data for common patterns
 */
export const prefetchUserData = async (userId) => {
  // Prefetch in parallel
  const promises = [getStudentByIdOptimized(userId), getActiveSubscriptionOptimized(userId)];

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error('Prefetch error:', error);
  }
};

/**
 * Optimized email check with minimal fields
 */
export const quickEmailCheck = async (email) => {
  const cacheKey = `email:${email.toLowerCase()}`;

  const cached = emailCheckCache.get(cacheKey);
  if (cached !== null) {
    return { exists: cached.exists, name: cached.name };
  }

  // Only fetch email field for speed
  const { data } = await supabase
    .from('students')
    .select('email, name')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  const result = {
    exists: !!data,
    name: data?.name || null,
  };

  emailCheckCache.set(cacheKey, result);
  return result;
};

/**
 * Invalidate caches when data changes
 */
export const invalidateCache = {
  student: (id) => studentCache.invalidate(`student:${id}`),
  email: (email) => emailCheckCache.invalidate(`email:${email.toLowerCase()}`),
  subscription: (userId) => subscriptionCache.invalidate(`subscription:${userId}`),
  all: () => {
    studentCache.invalidate();
    emailCheckCache.invalidate();
    subscriptionCache.invalidate();
  },
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => ({
  students: studentCache.size(),
  emails: emailCheckCache.size(),
  subscriptions: subscriptionCache.size(),
});

/**
 * Optimized query builder with automatic caching
 */
export class OptimizedQuery {
  constructor(table) {
    this.table = table;
    this.selectFields = '*';
    this.filters = [];
    this.cacheKey = null;
    this.cacheTTL = 5 * 60 * 1000;
  }

  select(fields) {
    this.selectFields = fields;
    return this;
  }

  filter(column, operator, value) {
    this.filters.push({ column, operator, value });
    return this;
  }

  cache(key, ttl) {
    this.cacheKey = key;
    if (ttl) this.cacheTTL = ttl;
    return this;
  }

  async execute() {
    // Check cache if enabled
    if (this.cacheKey) {
      const cached = studentCache.get(this.cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Build query
    let query = supabase.from(this.table).select(this.selectFields);

    this.filters.forEach(({ column, operator, value }) => {
      query = query[operator](column, value);
    });

    const { data, error } = await query;

    if (error) throw error;

    // Cache if enabled
    if (this.cacheKey && data) {
      studentCache.set(this.cacheKey, data);
    }

    return data;
  }
}

// Export optimized query builder
export const optimizedQuery = (table) => new OptimizedQuery(table);
