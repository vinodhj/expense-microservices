import { GraphQLError } from "graphql";
import { SessionUserType } from "@src/services";
import { Role } from "./graphql";
import { generateHmacSignature } from "@vinodhj/expense-shared-utils";

// Constants
const MAX_REQUEST_AGE_MS = 5 * 60 * 1000; // 5 minutes

export class SecurityMiddleware {
  validateProjectToken(headers: Headers, expectedToken: string): void {
    const projectToken = this.getHeader(headers, "X-Project-Token");
    if (!projectToken || projectToken !== expectedToken) {
      console.warn("Unauthorized access attempt: Invalid project token");
      throw new GraphQLError("Unauthorized access", {
        extensions: { code: "UNAUTHORIZED", status: 401 },
      });
    }
  }

  extractAccessToken(headers: Headers): string {
    const authorizationHeader = this.getHeader(headers, "Authorization");
    if (!authorizationHeader) {
      console.warn("Unauthorized ");
      throw new GraphQLError("Authentication failed", {
        extensions: {
          code: "UNAUTHORIZED",
          status: 401,
          error: { message: "Invalid token" },
        },
      });
    }
    return authorizationHeader.replace(/bearer\s+/i, "").trim();
  }

  extractSessionUser(headers: Headers): SessionUserType {
    // Extract user info from gateway headers for session
    const userId = this.getHeader(headers, "X-User-Id");
    const userRole = this.getHeader(headers, "X-User-Role");
    const userEmail = this.getHeader(headers, "X-User-Email");
    const userName = this.getHeader(headers, "X-User-Name");

    if (!userId || !userRole || !userEmail || !userName) {
      throw new GraphQLError("Unauthorized access", {
        extensions: { code: "UNAUTHORIZED", status: 401 },
      });
    }

    return {
      id: userId,
      role: userRole === "ADMIN" ? Role.Admin : Role.User,
      email: userEmail,
      name: userName,
    };
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

  async verifySecurityHeaders(headers: Headers, env: Env): Promise<{ nonceKey: string; noncetimestamp: string }> {
    const noncetimestamp = this.getHeader(headers, "X-Gateway-Timestamp");
    const nonce = this.getHeader(headers, "X-Gateway-Nonce");
    const signature = this.getHeader(headers, "X-Gateway-Signature");
    const authorization = this.getHeader(headers, "Authorization");
    const userId = this.getHeader(headers, "X-User-Id");
    const userRole = this.getHeader(headers, "X-User-Role");
    const is_schema_federation = this.getHeader(headers, "X-Schema-Federation");
    const timestamp = noncetimestamp;
    const nonceKey = `nonce:${nonce}`;

    // 1. Check if all required headers are present
    if (!timestamp || !signature || !nonce) {
      throw new GraphQLError("Missing required security headers", {
        extensions: { code: "GATEWAY_UNAUTHORIZED", status: 401 },
      });
    }

    if (env.ENVIRONMENT === "DEV") {
      return { nonceKey, noncetimestamp };
    }

    // Validate timestamp format
    const requestTime = parseInt(timestamp, 10);
    if (isNaN(requestTime)) {
      throw new GraphQLError("Invalid request format", {
        extensions: { code: "INVALID_REQUEST", status: 400 },
      });
    }

    // 2. Nonce validation has been implemented in the graphql plugin to prevent replay attacks

    // 3. Verify request is recent
    const now = Date.now();
    const timeDifference = Math.abs(now - requestTime);
    if (timeDifference > MAX_REQUEST_AGE_MS) {
      throw new GraphQLError(`Request expired: timestamp too old (${timeDifference}ms difference)`, {
        extensions: { code: "REQUEST_TIMEOUT", status: 408, timeDifference },
      });
    }

    // 4. Verify signature
    const matchesGatewaySignature = is_schema_federation === "true" && this.constantTimeCompare(signature, env.GATEWAY_SIGNATURE);

    // This is to allow the gateway to build the supergraph or codegen without needing to sign requests in dev
    if (matchesGatewaySignature) {
      console.warn("Skipping signature verification for gateway request to allow gateway to build supergraph or codegen schema generation");
    } else {
      const signaturePayload = authorization ? `${userId ?? ""}:${userRole ?? ""}:${timestamp}:${nonce}` : `public:${timestamp}:${nonce}`;
      const expectedSignature = await generateHmacSignature(env.GATEWAY_SECRET, signaturePayload);
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
