# GraphQL Gateway Implementation Documentation

## Overview

This document explains the architecture and implementation details of our modular GraphQL gateway. The gateway serves as a unified entry point for GraphQL operations, handling authentication, request routing, and resource management.

## Architecture

The gateway is designed with modularity in mind, separating concerns into distinct components:

- **Request Handling** (`index.ts`): Manages the main request flow, CORS handling, and error responses
- **Gateway Initialization** (`gateway.ts`): Configures and creates the gateway runtime
- **Authentication** (`auth-functions.ts`): Handles user resolution and request validation
- **Service Routing** (`service-router.ts`): Routes requests to appropriate backend services

## Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant Services

    Client->>Gateway: GraphQL Request
    alt is OPTIONS request
        Gateway->>Client: CORS Preflight Response
    else
        Gateway->>Gateway: Initialize Gateway Runtime
        Gateway->>Auth: Resolve User

        alt has Authorization header
            Auth->>Auth: Verify JWT Token
            Auth->>Auth: Generate Signature
            Auth->>Gateway: Return User Object
        else
            Auth->>Auth: Generate Public Signature
            Auth->>Gateway: Return null
        end

        Gateway->>Auth: Validate Request

        alt public operation
            Auth->>Gateway: Allow Request
        else if authenticated user
            Auth->>Gateway: Allow Request
        else
            Auth->>Gateway: Throw Authentication Error
            Gateway->>Client: 401 Unauthorized
        end

        Gateway->>Services: Forward Request
        Services->>Gateway: Service Response

        Gateway->>Gateway: Schedule Resource Disposal
        Gateway->>Client: Return Response with CORS Headers
    end
```

## Resource Management

The gateway implements proper resource management using the ECMAScript standard `Symbol.asyncDispose`. This ensures connections, caches, and other resources are properly released after a request is handled.

### Disposal Process

```mermaid
sequenceDiagram
    participant Client
    participant Worker
    participant Gateway
    participant Resources

    Client->>Worker: GraphQL Request
    Worker->>Gateway: Initialize Gateway
    Gateway->>Resources: Allocate Resources
    Gateway->>Worker: Process Request
    Worker->>Client: Send Response

    Note over Worker,Resources: Client has received response

    Worker->>Gateway: Schedule Disposal (waitUntil)
    Gateway->>Resources: Release Resources
    Note over Worker,Resources: Cleanup happens in background
```

### Implementation Details

The gateway uses Cloudflare Worker's `ctx.waitUntil()` method to handle asynchronous resource disposal without blocking the client response. This approach ensures:

1. Fast response times as clients don't wait for cleanup
2. Proper resource management to prevent memory leaks
3. Efficient use of connection pools and other limited resources

## Code Structure

### Main Request Handler (`index.ts`)

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") return handleCorsPreflight();

    try {
      // Initialize the gateway runtime
      const gateway = initializeGateway(env);

      // Process the request
      const response = await gateway(request);

      // Schedule disposal of the gateway (non-blocking)
      disposeGateway(gateway, ctx);

      return addCorsHeaders(response);
    } catch (error) {
      // Error handling...
    }
  },
};
```

### Gateway Disposal

```typescript
const disposeGateway = (gateway: any, ctx: ExecutionContext) => {
  const disposeMethod = gateway[Symbol.asyncDispose];
  if (typeof disposeMethod === "function") {
    const disposePromise = disposeMethod.call(gateway);
    ctx.waitUntil(Promise.resolve(disposePromise));
  }
};
```

## Best Practices

1. **Always dispose after use**: Schedule gateway disposal after processing the request, never before
2. **Use non-blocking disposal**: Leverage `ctx.waitUntil()` to handle cleanup in the background
3. **Separate concerns**: Keep authentication, routing, and request handling in separate modules
4. **Error handling**: Provide meaningful error responses with appropriate status codes

## Troubleshooting

Common issues:

1. **Gateway disposed before use**: If you see errors about using a disposed gateway, check that disposal is scheduled after the request is processed
2. **Authentication failures**: Verify JWT configuration and token validity
3. **Service routing issues**: Ensure service URLs are configured correctly
