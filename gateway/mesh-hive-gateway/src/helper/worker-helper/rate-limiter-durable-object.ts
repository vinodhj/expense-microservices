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
    try {
      // Get stored values from the Durable Object's storage
      const storedData = await this.state.storage.get(["nextAllowedTime", "blocked", "blockedUntil"]);

      // console.log("[RateLimiter] Retrieved data:", Object.fromEntries(storedData.entries()));

      // Update our in-memory state with stored values or defaults
      this.nextAllowedTime = (storedData.get("nextAllowedTime") as number) || 0;
      this.blocked = Boolean(storedData.get("blocked"));
      this.blockedUntil = (storedData.get("blockedUntil") as number) || 0;
    } catch (error) {
      console.error("[RateLimiter] Error initializing state:", error);
      // Default values if read fails
      this.nextAllowedTime = 0;
      this.blocked = false;
      this.blockedUntil = 0;
    }
  }

  // Save state to storage
  private async saveState(): Promise<void> {
    try {
      // Try directly with individual keys first
      await this.state.storage.put({
        nextAllowedTime: this.nextAllowedTime,
        blocked: this.blocked,
        blockedUntil: this.blockedUntil,
      });
    } catch (error) {
      console.error("[RateLimiter] Error saving state:", error);

      // Fallback to legacy format if there's an error
      try {
        console.log("[RateLimiter] Attempting legacy storage format");
        await this.state.storage.put("rateLimitState", {
          nextAllowedTime: this.nextAllowedTime,
          blocked: this.blocked,
          blockedUntil: this.blockedUntil,
        });
        console.log("[RateLimiter] Legacy storage format succeeded");
      } catch (fallbackError) {
        console.error("[RateLimiter] Legacy storage also failed:", fallbackError);
      }
    }
  }

  async fetch(request: Request): Promise<Response> {
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
    if (waitTime > RateLimiter.MILLISECONDS_PER_REQUEST * 3) {
      console.log("[RateLimiter] Rate exceeded too much, applying penalty");
      // Apply penalty - block for the penalty duration
      this.blocked = true;
      this.blockedUntil = now + RateLimiter.PENALTY_DURATION_MS;

      // Save state
      await this.saveState();

      const retryAfter = Math.ceil(RateLimiter.PENALTY_DURATION_MS / 1000);
      return this.createRateLimitResponse(retryAfter, 0);
    }

    // Save state
    await this.saveState();

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
