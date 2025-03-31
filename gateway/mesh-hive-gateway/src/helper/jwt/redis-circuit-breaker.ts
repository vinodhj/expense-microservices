export class RedisCircuitBreaker {
  private failureCount: number = 0;
  private circuitOpen: boolean = false;
  private lastRetry: number = Date.now();
  private readonly failureThreshold: number;
  private readonly retryInterval: number;

  constructor(failureThreshold = 5, retryInterval = 30000) {
    this.failureThreshold = failureThreshold;
    this.retryInterval = retryInterval;
  }

  async execute<T>(operation: () => Promise<T>, fallback: () => T): Promise<T> {
    if (this.circuitOpen) {
      if (Date.now() - this.lastRetry > this.retryInterval) {
        this.circuitOpen = false;
        this.lastRetry = Date.now();
      } else {
        return fallback();
      }
    }

    try {
      const result = await operation();
      this.failureCount = 0; // Reset on success
      return result;
    } catch (error) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.circuitOpen = true;
      }
      return fallback();
    }
  }
}
