export class RateLimiter {
  state: DurableObjectState;

  // Rate limiter config
  static readonly REQUESTS_PER_MINUTE = 50;
  static readonly MILLISECONDS_PER_REQUEST = Math.floor(60000 / RateLimiter.REQUESTS_PER_MINUTE); // ~1200ms per request for 50 RPM
  static readonly PENALTY_DURATION_MS = 40000; // 40-second penalty in ms

  // Internal state
  private nextAllowedTime: number;
  private blocked: boolean;
  private blockedUntil: number;

  constructor(state: DurableObjectState, _env: any) {
    this.state = state;
    this.nextAllowedTime = 0;
    this.blocked = false;
    this.blockedUntil = 0;
  }

  // Initialize state from storage - call this before any other operations
  private async initState(): Promise<void> {
    const storedData = (await this.state.storage.get(["rateLimitState"])) as {
      nextAllowedTime?: number;
      blocked?: boolean;
      blockedUntil?: number;
    } | null;

    if (storedData) {
      this.nextAllowedTime = storedData.nextAllowedTime ?? 0;
      this.blocked = storedData.blocked ?? false;
      this.blockedUntil = storedData.blockedUntil ?? 0;
    }
  }

  async fetch(_request: Request): Promise<Response> {
    // Initialize state first
    await this.initState();

    const now = Date.now();

    // Check if client is blocked from previous violations
    if (this.blocked) {
      if (now < this.blockedUntil) {
        const retryAfter = Math.ceil((this.blockedUntil - now) / 1000);
        return this.createRateLimitResponse(retryAfter, 0);
      } else {
        // Block duration expired
        this.blocked = false;
        this.blockedUntil = 0;
      }
    }

    // Check and update rate limit
    const currentNextAllowed = this.nextAllowedTime;

    // Update the next allowed time
    this.nextAllowedTime = Math.max(now, this.nextAllowedTime);
    this.nextAllowedTime += RateLimiter.MILLISECONDS_PER_REQUEST;

    // Calculate wait time (how long until next request is allowed)
    const waitTime = Math.max(0, currentNextAllowed - now);

    // Calculate remaining window time and requests
    const windowTime = Math.max(0, Math.ceil((this.nextAllowedTime - now) / 1000));

    // Check if rate exceeded by too much (wait time > allowed window)
    // This means the client is sending requests much faster than allowed
    if (waitTime > RateLimiter.MILLISECONDS_PER_REQUEST * 3) {
      // Apply penalty - block for the penalty duration
      this.blocked = true;
      this.blockedUntil = now + RateLimiter.PENALTY_DURATION_MS;

      // Save state - using an object instead of array for storage
      await this.state.storage.put("rateLimitState", {
        nextAllowedTime: this.nextAllowedTime,
        blocked: this.blocked,
        blockedUntil: this.blockedUntil,
      });

      const retryAfter = Math.ceil(RateLimiter.PENALTY_DURATION_MS / 1000);
      return this.createRateLimitResponse(retryAfter, 0);
    }

    // Save state - using an object instead of array for storage
    await this.state.storage.put("rateLimitState", {
      nextAllowedTime: this.nextAllowedTime,
      blocked: this.blocked,
      blockedUntil: this.blockedUntil,
    });

    // Calculate remaining requests in the window
    const remaining = RateLimiter.REQUESTS_PER_MINUTE - Math.ceil(waitTime / RateLimiter.MILLISECONDS_PER_REQUEST);

    // Request is allowed - return rate limit info
    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: Math.max(0, remaining),
        reset: windowTime,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": RateLimiter.REQUESTS_PER_MINUTE.toString(),
          "X-RateLimit-Remaining": Math.max(0, remaining).toString(),
          "X-RateLimit-Reset": windowTime.toString(),
        },
      },
    );
  }

  // Helper function to create consistent rate limit responses
  private createRateLimitResponse(retryAfter: number, remaining: number): Response {
    return new Response(
      JSON.stringify({
        errors: [{ message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.` }],
        extensions: { code: "RATE_LIMIT_EXCEEDED" },
        data: null,
      }),
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-RateLimit-Limit": RateLimiter.REQUESTS_PER_MINUTE.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": retryAfter.toString(),
        },
      },
    );
  }
}
