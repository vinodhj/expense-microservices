export class RedisCircuitBreaker {
  private state: "closed" | "open" | "half-open" = "closed";
  private failureCount: number = 0;
  private lastFailureTime: number | null = null;
  private readonly failureThreshold: number;
  private readonly retryInterval: number;

  constructor(failureThreshold = 5, retryInterval = 30000) {
    this.failureThreshold = failureThreshold;
    this.retryInterval = retryInterval;
  }

  async execute<T>(operation: () => Promise<T>, fallback: () => T): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - (this.lastFailureTime ?? 0) > this.retryInterval) {
        this.state = "half-open";
        console.log("Circuit in half-open state, allowing trial");
      } else {
        console.warn("Circuit open, using fallback");
        return fallback();
      }
    }

    try {
      console.log("Executing operation");
      const result = await operation();
      this.#handleSuccess();
      return result;
    } catch (error) {
      console.error("Operation failed:", error);
      this.#handleFailure();
      return fallback();
    }
  }

  #handleSuccess() {
    this.failureCount = 0;
    if (this.state === "half-open") {
      this.state = "closed";
      console.log("Circuit closed after successful trial");
    }
  }

  #handleFailure() {
    this.failureCount++;
    if (this.state === "half-open" || this.failureCount >= this.failureThreshold) {
      this.state = "open";
      this.lastFailureTime = Date.now();
      console.error(`Circuit opened due to failures: ${this.failureCount}`);
    }
  }
}
