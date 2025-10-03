import { CacheConfig } from '../types'

interface CacheItem<T> {
  value: T
  timestamp: number
  ttl: number
}

/**
 * Cache manager for NOORMME
 */
export class CacheManager {
  private cache = new Map<string, CacheItem<any>>()
  private hits = 0
  private misses = 0

  constructor(private config: CacheConfig = {}) {}

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      this.misses++
      return null
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    this.hits++
    return item.value
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl || 300000 // 5 minutes default
    }

    this.cache.set(key, item)

    // Implement LRU eviction if cache is full
    if (this.cache.size > (this.config.maxSize || 1000)) {
      this.evictOldest()
    }
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0
    }
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.hits + this.misses
    return total > 0 ? this.hits / total : 0
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: CacheConfig): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Close cache manager
   */
  async close(): Promise<void> {
    this.clear()
  }

  /**
   * Evict oldest items from cache
   */
  private evictOldest(): void {
    if (this.config.strategy === 'fifo') {
      // FIFO: Remove first item
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    } else {
      // LRU: Remove least recently used item
      let oldestKey = ''
      let oldestTime = Date.now()

      for (const [key, item] of this.cache.entries()) {
        if (item.timestamp < oldestTime) {
          oldestTime = item.timestamp
          oldestKey = key
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
  }

  /**
   * Clean expired items
   */
  cleanExpired(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get all cache values
   */
  values(): any[] {
    return Array.from(this.cache.values()).map(item => item.value)
  }

  /**
   * Get all cache entries
   */
  entries(): Array<[string, any]> {
    return Array.from(this.cache.entries()).map(([key, item]) => [key, item.value])
  }
}
