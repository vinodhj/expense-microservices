export class InMemoryCache<T> {
  private readonly cache: Map<string, { data: T; timestamp: number }>;
  private readonly ttl: number; // Time to live in milliseconds

  constructor(ttlInSeconds = 300) {
    this.cache = new Map();
    this.ttl = ttlInSeconds * 1000; // milliseconds
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if the cache entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get all keys that match a pattern (useful for invalidation)
  getKeysByPattern(pattern: string): string[] {
    const keys: string[] = [];
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keys.push(key);
      }
    }

    return keys;
  }

  // Invalidate all keys matching a pattern
  invalidateByPattern(pattern: string): void {
    const keysToDelete = this.getKeysByPattern(pattern);

    for (const key of keysToDelete) {
      this.delete(key);
    }
  }

  // Clean up all expired entries
  cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Create cache instances for each entity type
export const trackerCache = new InMemoryCache<any>(15 * 60); // 15 minutes TTL
