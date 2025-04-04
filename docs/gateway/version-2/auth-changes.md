# Gateway v2 Authentication Documentation

## 1. Overview

Gateway v2 introduces significant enhancements to the authentication system with improved token verification, caching strategies, and fault tolerance. Key improvements include:

- **Token caching**: In-memory cache to reduce Redis lookups and improve performance
- **Token versioning**: Redis-backed token version control for security and session management
- **Batch processing**: KV Queue for efficient error logging and reduced I/O operations
- **Enhanced error handling**: Detailed error reporting and standardized error codes
- **Fault tolerance**: Circuit breaker pattern to handle Redis failures gracefully

## 2. Authentication Architecture

```mermaid
flowchart TD
    A[Client Request] --> B[Gateway]
    B --> C{Has Auth Token?}
    C -->|Yes| D[Token Verification Service]
    C -->|No| E[Public Access Handler]

    D --> F[JWT Verifier]
    F --> G[Token Cache]
    F --> H[Version Validator]

    H --> I[Redis Service]

    D -->|Valid| J[User Context Builder]
    D -->|Invalid| K[Error Handler]

    K --> L[KV Queue Service]

    E --> M[Public Operation Validator]
    J --> N[Operation Validator]

    M -->|Public Operation| O[Service Router]
    N -->|Authorized| O
    N -->|Unauthorized| P[Auth Error Response]

    O --> Q[GraphQL Services]
    Q --> R[Response Handler]
    R --> S[Client Response]
    P --> S
```

The architecture consists of interconnected components that work together to authenticate requests and authorize operations. The JWT verification service integrates with a token cache and version validator to efficiently process authentication requests.

## 3. Key Components

### 3.1. Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth as Authentication Service
    participant Cache as Token Cache
    participant Redis
    participant Services as GraphQL Services

    Client->>Gateway: Request with/without Auth Token

    alt Has Auth Token
        Gateway->>Auth: Verify Token
        Auth->>Cache: Check Cache

        alt Token in Cache
            Cache-->>Auth: Return Cached User
        else Token not in Cache
            Auth->>Auth: Decode JWT
            Auth->>Redis: Verify Token Version

            alt Token Valid
                Redis-->>Auth: Version Valid
                Auth->>Cache: Store in Cache
                Auth-->>Gateway: Return User
            else Token Invalid
                Redis-->>Auth: Version Invalid
                Auth-->>Gateway: Auth Error
                Gateway-->>Client: 401 UNAUTHORIZED
            end
        end
    else No Auth Token
        Gateway->>Gateway: Generate Public Signature
        Gateway->>Auth: Validate Public Access

        alt Public Operation
            Auth-->>Gateway: Allow Access
            Gateway->>Services: Forward Request
            Services-->>Gateway: Response
            Gateway-->>Client: Response
        else Protected Operation
            Auth-->>Gateway: Deny Access
            Gateway-->>Client: 401 UNAUTHORIZED
        end
    end
```

The authentication flow begins when a request is received by the Gateway. The system checks for an authorization token and processes it accordingly. With a token, the system verifies its validity using caching and version control. Without a token, the system checks if the operation is public, allowing unauthenticated access only to operations marked with the `@public` directive.

### 3.2. Token Verification Process

```mermaid
flowchart TD
    A[Receive Token] --> B{Check Cache}
    B -->|Found| C[Return Cached User]
    B -->|Not Found| D[Decode JWT]
    D --> E{Check Expiration}
    E -->|Expired| F[Throw Token Expired Error]
    E -->|Valid| G[Verify Token Version]
    G --> H{Version Valid?}
    H -->|Yes| I[Cache Token]
    H -->|No| J[Throw Version Error]
    I --> K[Return User]

    J --> L[Log Invalid Token]
    F --> L
    L --> M[Return Auth Error]
```

The token verification process implements a multi-stage validation approach:

1. **Cache check**: Verify if token is already in the in-memory cache
2. **JWT decode and validation**: Decode and check token signature and expiration
3. **Version validation**: Compare token version with stored version in Redis
4. **Result caching**: Store valid tokens in memory for future requests

**Key Code: Token Verification**

```typescript
export const jwtVerifyToken = async ({
  token,
  secret,
  kvStorage,
  redis,
  ENVIRONMENT,
}: {
  token: string;
  secret: string;
  kvStorage: KVNamespace;
  redis: Redis;
  ENVIRONMENT: string;
}): Promise<TokenPayload> => {
  try {
    // Check cache first
    const cacheKey = `${token}:${ENVIRONMENT}`;
    const cachedResult = tokenCache.get(cacheKey);
    if (cachedResult && cachedResult.expiry > Date.now()) {
      return cachedResult.payload;
    }

    // Verify JWT token
    const payload = jwt.verify(token, secret) as TokenPayload;

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new GraphQLError("Token expired", {
        extensions: { code: "TOKEN_EXPIRED" },
      });
    }

    // Verify token version
    await verifyTokenVersion(payload, redis, ENVIRONMENT);

    // Cache successful result
    tokenCache.set(cacheKey, {
      payload,
      expiry: Date.now() + CACHE_TTL,
    });

    return payload;
  } catch (error) {
    console.error("Error verifying token:", error);
    handleTokenError(error, token, kvStorage, ENVIRONMENT);
  }
};
```

### 3.3. Error Handling System

```mermaid
flowchart TD
    A[Auth Error Detected] --> B[Create Error Object]
    B --> C[Determine Error Type]
    C -->|Token Expired| D[TOKEN_EXPIRED Error]
    C -->|Version Mismatch| E[REVOKE_TOKEN_ERROR]
    C -->|Invalid Signature| F[UNAUTHORIZED Error]
    C -->|Other| G[Generic Auth Error]

    D --> H[Queue Error Log]
    E --> H
    F --> H
    G --> H

    H --> I[KV Queue]
    I -->|Queue Full| J[Process Batch]
    I -->|Not Full| K[Store for Later]

    J --> L[KV Storage]
    K --> M[Return Error to Client]
```

The error handling system provides standardized error reporting with efficient logging:

- Categorizes errors by type (expired, revoked, invalid)
- Uses batch processing for efficient KV storage operations
- Returns standardized GraphQL errors with appropriate status codes

**Key Code: Error Handling**

```typescript
function handleTokenError(error: unknown, token: string, kvStorage: KVNamespace, environment: string): never {
  // Get or create queue for this KV namespace
  if (!kvQueuesMap.has(kvStorage)) {
    kvQueuesMap.set(kvStorage, new KvQueue(kvStorage));
  }
  const queue = kvQueuesMap.get(kvStorage)!;

  // Queue the KV write with useful diagnostic information
  const logKey = `invalid-token:${environment}:${new Date().toISOString()}`;
  const logValue = JSON.stringify({
    token,
    error: error,
    timestamp: new Date().toISOString(),
  });

  queue.push(logKey, logValue, { expirationTtl: 7 * 24 * 60 * 60 });

  // Throw standardized GraphQL error
  const isGraphQLError = error instanceof GraphQLError;
  throw new GraphQLError(isGraphQLError ? error.message : "Invalid token", {
    extensions: {
      code: isGraphQLError && error.extensions?.code ? error.extensions.code : "UNAUTHORIZED",
      error: isGraphQLError && error.extensions?.error ? error.extensions.error : error,
    },
  });
}
```

## 4. Key Features

### 4.1. Token Caching Mechanism

```mermaid
flowchart LR
    A[Request Token] --> B{In Cache?}
    B -->|Yes| C[Is Expired?]
    C -->|No| D[Return Cached Token]
    C -->|Yes| E[Remove from Cache]
    B -->|No| F[Verify Token]
    E --> F
    F -->|Valid| G[Store in Cache]
    G --> H[Return Verified Token]
    F -->|Invalid| I[Return Error]
```

The token caching system reduces load on Redis and improves performance by:

- Storing validated tokens in memory with TTL (Time-To-Live)
- Using a composite cache key with token and environment
- Maintaining cache consistency with token expiration checks

Benefits include:

- Reduced latency for repeated requests from the same user
- Lower Redis query load
- Improved system scalability

### 4.2. Token Version Control

```mermaid
sequenceDiagram
    participant T as Token
    participant R as Redis
    participant A as Auth Service

    T->>A: Present Token with Version N
    A->>R: Get Current Version for User
    R->>A: Return Version M

    alt N equals M
        A->>A: Token Version Valid
    else N not equals M
        A->>A: Token Revoked
        A->>T: Throw REVOKE_TOKEN_ERROR
    end
```

The token version control system provides advanced security features:

- Allows immediate token revocation without changing JWT secrets
- Enables forced logout of specific users or all users
- Creates an audit trail of version changes

**Key Code: Token Version Verification**

```typescript
export async function verifyTokenVersion(payload: TokenPayload, redis: Redis, environment: string): Promise<void> {
  // Fetch current token version from Redis
  const currentVersionStr = await redis.get(`user:${environment}:${payload.email}:tokenVersion`);
  const storedVersion = currentVersionStr ? parseInt(currentVersionStr as string) : 0;

  // Compare token version with stored version
  if (payload.tokenVersion !== storedVersion) {
    throw new GraphQLError("For security reasons, your session is no longer valid. Please sign in again", {
      extensions: {
        code: "REVOKE_TOKEN_ERROR",
        error: `Token has been revoked. payload_version: ${payload.tokenVersion}, stored_version: ${storedVersion}`,
      },
    });
  }
}
```

### 4.3. Public vs Protected Operations

```mermaid
flowchart TD
    A[GraphQL Operation] --> B[Extract Operation]
    B --> C[Find Operation Definition]
    C --> D[Determine Root Type]
    D --> E[Check Fields]

    E --> F{Has @public Directive?}
    F -->|All Fields Public| G[Public Operation]
    F -->|Some Fields Protected| H[Protected Operation]

    G --> I[Allow Unauthenticated Access]
    H --> J{User Authenticated?}
    J -->|Yes| K[Allow Access]
    J -->|No| L[Deny Access]
```

The operation validator intelligently determines if an operation requires authentication:

1. Extracts the GraphQL operation from execution arguments
2. Analyzes fields and directives to determine access requirements
3. Allows unauthenticated access to operations with `@public` directive
4. Enforces authentication for protected operations

By default, all operations require authentication unless explicitly marked as public.

### 4.4. KV Queue for Logging

```mermaid
flowchart LR
    A[Log Event] --> B[Add to Queue]
    B --> C{Queue Size >= Threshold?}
    C -->|Yes| D[Process Batch]
    C -->|No| E[Maintain in Queue]
    D --> F[Write to KV Store]
    E --> G[Wait for More Events]
    G -.-> C
```

The KV Queue implements efficient batch processing for KV storage operations:

- Reduces KV write operations by batching multiple entries
- Improves performance for high-volume error logging
- Provides configurable queue size threshold

**Key Code: KV Queue Implementation**

```typescript
export class KvQueue {
  private queue: KvQueueItem[] = [];
  private readonly maxQueueSize: number;
  private readonly kvStorage: KVNamespace;

  constructor(kvStorage: KVNamespace, maxQueueSize = 50) {
    this.kvStorage = kvStorage;
    this.maxQueueSize = maxQueueSize;
  }

  push(key: string, value: string, options?: { expirationTtl?: number }) {
    this.queue.push({ key, value, options });

    if (this.queue.length >= this.maxQueueSize) {
      this.process();
    }
  }

  async process() {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    await Promise.allSettled(batch.map((item) => this.kvStorage.put(item.key, item.value, item.options)));
  }
}
```

## 5. Gateway Authentication Process

```mermaid
flowchart TB
    A[Request Received] --> B[resolveUserFn]
    B --> C{Has Auth Token?}
    C -->|Yes| D[Verify JWT Token]
    C -->|No| E[Generate Public Signature]

    D -->|Valid| F[Add User to Context]
    D -->|Invalid| G[Log Error]
    G --> H[Throw Auth Error]

    E --> I[validateUser]
    F --> I

    I --> J{Is Public Operation?}
    J -->|Yes| K[Allow Request]
    J -->|No| L{User Authenticated?}
    L -->|Yes| M[Allow Request]
    L -->|No| N[Throw Auth Error]

    K --> O[Forward to Services]
    M --> O
    O --> P[Return Response]
```

The gateway authentication process involves two critical functions:

1. **resolveUserFn**: Extracts and validates user credentials

   - Generates security timestamp and nonce
   - Verifies JWT tokens and adds user to context
   - Creates appropriate signatures for downstream services

2. **validateUser**: Authorizes access to operations
   - Checks if operation has @public directive
   - Enforces authentication for protected operations
   - Returns appropriate error responses

**Key Code: Authentication Functions**

```typescript
const resolveUserFn: ResolveUserFn<any> = async (context: any) => {
  // Generate security timestamp and nonce
  const timestamp = Date.now().toString();
  const nonce = crypto.getRandomValues(new Uint8Array(16)).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");

  context.gateway_timestamp = timestamp;
  context.gateway_nonce = nonce;

  // Check for auth token
  const accessToken = context.headers?.Authorization;
  if (!accessToken) {
    // Handle public access
    const signaturePayload = `public:${timestamp}:${nonce}`;
    const signature = await generateHmacSignature(env.GATEWAY_SECRET, signaturePayload);
    context.gateway_signature = signature;
    return null;
  }

  try {
    // Verify token with enhanced verification
    const jwtToken = await jwtVerifyToken({
      token: accessToken,
      secret: env.JWT_SECRET,
      kvStorage: env.EXPENSE_AUTH_EVENTS_KV,
      redis,
      ENVIRONMENT: env.ENVIRONMENT,
    });

    // Add user to context
    const user = {
      id: jwtToken.id,
      role: jwtToken.role,
      email: jwtToken.email,
      name: jwtToken.name,
    };
    context.current_session_user = user;

    // Generate signature with user data
    const signaturePayload = `${jwtToken.id}:${jwtToken.role}:${timestamp}:${nonce}`;
    const signature = await generateHmacSignature(env.GATEWAY_SECRET, signaturePayload);
    context.gateway_signature = signature;

    return user;
  } catch (error) {
    console.error("Token verification failed:", error);
    // Handle error and throw standardized GraphQLError
    throw new GraphQLError("Invalid token", {
      extensions: {
        status: 401,
        code: "UNAUTHORIZED",
      },
    });
  }
};

const validateUser: ValidateUserFn<any> = ({ user, executionArgs }) => {
  // Allow public operations without authentication
  if (isPublicOperation(executionArgs)) {
    return;
  }

  // Require authentication for protected operations
  if (user === null) {
    throw new GraphQLError("Authentication failed for non-public operation", {
      extensions: {
        code: "UNAUTHORIZED",
        status: 401,
        error: { message: "Invalid token" },
      },
    });
  }
};
```

## 6. Fault Tolerance Features

### 6.1. Circuit Breaker Pattern

```mermaid
stateDiagram-v2
    [*] --> Closed

    Closed --> Open: Failure Threshold Exceeded
    Open --> HalfOpen: After Timeout Period
    HalfOpen --> Closed: Success Threshold Met
    HalfOpen --> Open: Failure Detected

    state Closed {
        [*] --> Normal
        Normal --> TrackingFailures: Failure Detected
        TrackingFailures --> Normal: Success
    }
```

The circuit breaker pattern prevents cascading failures by:

- Monitoring Redis connection failures
- Temporarily bypassing Redis checks when the circuit is open
- Gradually recovering through a half-open state
- Providing fallback mechanisms for token validation

This ensures system resilience even when Redis is temporarily unavailable or experiencing issues.

### 6.2. Request Signature Generation

```mermaid
flowchart TD
    A[Generate Timestamp] --> B[Generate Random Nonce]

    B --> C{Has User?}
    C -->|Yes| D["Create User Signature<br>user:role:timestamp:nonce"]
    C -->|No| E["Create Public Signature<br>public:timestamp:nonce"]

    D --> F[Generate HMAC]
    E --> F

    F --> G[Add to Request Context]
```

Request signatures provide additional security by:

- Including timestamp to prevent replay attacks
- Using cryptographic nonce for request uniqueness
- Including user information in authenticated requests
- Generating HMAC signatures with gateway secret

Signatures are added to the request context and can be verified by downstream services.

## 7. Best Practices

```mermaid
mindmap
    root((Gateway Auth<br>Best Practices))
        Token Management
            Cache tokens for performance
            Implement token versioning
            Set appropriate expiration
        Error Handling
            Use batch processing for logs
            Provide meaningful error messages
            Include proper error codes
        Security
            Implement signature verification
            Validate token versions
            Use nonce for request security
        Performance
            Use local memory cache
            Implement batch writes
            Use circuit breakers
```

### Token Management

- Use token versioning to allow immediate revocation
- Set appropriate token expiration times
- Implement caching with reasonable TTL values

### Error Handling

- Provide meaningful error messages to clients
- Log detailed error information for debugging
- Use batch processing for efficient logging

### Security Best Practices

- Implement nonce and timestamp in signatures
- Use environment-specific keys for multi-environment deployments
- Always validate token versions

### Performance Optimization

- Use memory caching for frequently accessed tokens
- Batch KV storage operations when possible
- Implement circuit breakers for external dependencies

## 8. Implementation Considerations

### 8.1. Environment Configuration

Required environment variables:

- `JWT_SECRET`: Secret key for JWT token verification
- `GATEWAY_SECRET`: Secret for generating request signatures
- `ENVIRONMENT`: Current environment identifier (dev/staging/prod)
- Redis connection configuration for token version storage

### 8.2. Key Performance Indicators

Monitor these key metrics:

- Authentication response time
- Cache hit ratio for token cache
- Error rates by type (expired, revoked, invalid)
- KV queue processing time

### 8.3. Monitoring Recommendations

For effective monitoring:

- Track invalid token attempts by IP and user
- Monitor Redis performance and connection status
- Watch circuit breaker status and trips
- Log token revocation events
