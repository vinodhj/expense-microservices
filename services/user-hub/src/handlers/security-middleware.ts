import { GraphQLError } from "graphql";
import crypto from "crypto";
import { KvStorageServiceAPI } from "@src/services/kv-storage-service";

// Constants
const MAX_REQUEST_AGE_MS = 5 * 60 * 1000; // 5 minutes

export class SecurityMiddleware {
  validateProjectToken(projectToken: string | null, expectedToken: string): void {
    if (!projectToken || projectToken !== expectedToken) {
      console.warn("Unauthorized access attempt: Invalid project token");
      throw new GraphQLError("Unauthorized access", {
        extensions: { code: "UNAUTHORIZED", status: 401 },
      });
    }
  }

  // Constant-time string comparison to prevent timing attacks
  constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  async verifySecurityHeaders(
    headers: Headers,
    env: Env,
    kvStorageAPI: KvStorageServiceAPI,
  ): Promise<{ nonceKey: string; noncetimestamp: string }> {
    const noncetimestamp = this.getHeader(headers, "X-Gateway-Timestamp");
    const nonce = this.getHeader(headers, "X-Gateway-Nonce");
    const signature = this.getHeader(headers, "X-Gateway-Signature");
    const authorization = this.getHeader(headers, "Authorization");
    const userId = this.getHeader(headers, "X-User-Id");
    const userRole = this.getHeader(headers, "X-User-Role");
    const timestamp = noncetimestamp;

    // 1. Check if all required headers are present
    if (!timestamp || !signature || !nonce) {
      throw new GraphQLError("Missing required security headers", {
        extensions: { code: "GATEWAY_UNAUTHORIZED", status: 401 },
      });
    }

    // Validate timestamp format
    const requestTime = parseInt(timestamp, 10);
    if (isNaN(requestTime)) {
      throw new GraphQLError("Invalid request format", {
        extensions: { code: "INVALID_REQUEST", status: 400 },
      });
    }

    // 2. Check if nonce was used before
    const nonceKey = `nonce:${nonce}`;
    const usedNonce = await kvStorageAPI.nonceExists(nonceKey);
    if (usedNonce) {
      // Add logging for potential replay attacks
      console.warn(`Potential replay attack detected: Duplicate nonce ${nonce} used`);
      throw new GraphQLError("Duplicate request - nonce already used", {
        extensions: { code: "REPLAY_ATTACK", status: 401 },
      });
    }

    // 3. Verify request is recent
    const now = Date.now();
    const timeDifference = Math.abs(now - requestTime);
    if (timeDifference > MAX_REQUEST_AGE_MS) {
      throw new GraphQLError(`Request expired: timestamp too old (${timeDifference}ms difference)`, {
        extensions: { code: "REQUEST_TIMEOUT", status: 408, timeDifference },
      });
    }

    // 4. Verify signature
    const isDev = env.ENVIRONMENT === "dev";
    const matchesGatewaySignature = isDev && this.constantTimeCompare(signature, env.GATEWAY_SIGNATURE);

    // This is to allow the gateway to build the supergraph or codegen without needing to sign requests in dev
    if (matchesGatewaySignature) {
      console.warn("Skipping signature verification in dev environment to allow gateway to build supergraph or codegen schema generation");
    } else {
      const payload = authorization ? `${userId ?? ""}:${userRole ?? ""}:${timestamp}:${nonce}` : `public:${timestamp}:${nonce}`;
      const expectedSignature = crypto.createHmac("sha256", env.GATEWAY_SECRET).update(payload).digest("hex");

      // Use constant-time comparison
      if (!this.constantTimeCompare(signature, expectedSignature)) {
        console.warn(`Invalid signature detected for user: ${userId ?? "anonymous"}`);
        throw new GraphQLError("Invalid signature from gateway", {
          extensions: { code: "INVALID_SIGNATURE", status: 401 },
        });
      }
    }

    return { nonceKey, noncetimestamp };
  }

  // Helper method for header extraction
  private getHeader(headers: Headers, key: string): string | null {
    return headers.get(key) ?? headers.get(key.toLowerCase());
  }
}
