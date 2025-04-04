# GraphQL Gateway Implementation Documentation

## Overview

This document explains the architecture and implementation details of our modular GraphQL gateway. The gateway serves as a unified entry point for GraphQL operations, handling authentication, request routing, and resource management.

## Architecture

The gateway is designed with modularity in mind, separating concerns into distinct components:

- **Request Handling** (`index.ts`): Manages the main request flow, CORS handling, and error responses
- **Gateway Initialization** (`gateway.ts`): Configures and creates the gateway runtime
- **Authentication** (`auth-functions.ts`): Handles user resolution and request validation
- **Service Routing** (`service-router.ts`): Routes requests to appropriate backend services

```mermaid
graph TD
    Client[Client] --> Gateway[Hive Gateway on Cloudflare Workers]
    Gateway --> Auth[Authentication Logic]
    Gateway --> Schema[Pre-generated Supergraph Schema]
    Gateway --> Service1[Service 1]
    Gateway --> Service2[Service 2]
    Gateway --> ServiceN[Service N...]

    Service1 --> SubgraphLib1["@apollo/subgraph"]
    Service2 --> SubgraphLib2["@apollo/subgraph"]
    ServiceN --> SubgraphLibN["@apollo/subgraph"]

    Service1 --> YogaLib1[GraphQL Yoga]
    Service2 --> YogaLib2[GraphQL Yoga]
    ServiceN --> YogaLibN[GraphQL Yoga]

    subgraph "Build Time"
        Services[Services Schemas] --> MeshCompose[Mesh Compose]
        MeshCompose --> SupergraphFile[supergraph.graphql]
    end

    SupergraphFile --> Schema
```

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

### 2. Authentication Logic Implementation

We use a custom authentication checker to determine if an operation accesses only fields with the `@public` directive.

The implementation follows these steps:

- Extract the document, schema, and operation name from execution arguments
- Find the operation definition within the document
- Determine the root type based on the operation type (query, mutation)
- Recursively check if the requested fields have the @public directive
- Return true if the operation only accesses public fields, false otherwise

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as Hive Gateway
    participant AuthLogic as Authentication Logic
    participant Services as GraphQL Services

    Client->>Gateway: GraphQL Operation
    Gateway->>AuthLogic: Check if public operation

    alt Public Operation (@public directive)
        AuthLogic->>Gateway: Allow without authentication
        Gateway->>Services: Forward operation
        Services->>Gateway: Response
        Gateway->>Client: Response
    else Protected Operation
        AuthLogic->>Gateway: Require authentication

        alt Authenticated
            Gateway->>Services: Forward operation with auth context
            Services->>Gateway: Response
            Gateway->>Client: Response
        else Not Authenticated
            Gateway->>Client: Authentication Error
        end
    end
```

### Authentication Functions

The gateway uses two main authentication functions:

```mermaid
flowchart TB
    A[Request] --> B[resolveUserFn]
    B -->|No Token| C["Generate Public Signature<br/>return null"]
    B -->|Has Token| D["Verify JWT Token"]
    D -->|Valid| E["Add User to Context<br/>Generate Signature"]
    D -->|Invalid| F["Throw GraphQLError<br/>(401 UNAUTHORIZED)"]

    C --> G[validateUser]
    E --> G
    G -->|Public Operation| H["Allow (no auth required)"]
    G -->|Protected & User null| I["Throw GraphQLError<br/>(401 UNAUTHORIZED)"]
    G -->|Protected & User valid| J["Allow Operation"]
```

#### Key authentication functions:

The resolver function processes the incoming request by:

- Generating a timestamp and nonce for security purposes
- Checking for an Authorization header
- For unauthenticated requests, generating a public operation signature
- For authenticated requests, verifying the JWT token and extracting user information
- Adding signature and user data to the context for downstream services

The validator function determines if the request should proceed by:

- Checking if the operation is public using the @public directive
- Allowing public operations to proceed without authentication
- For protected operations, ensuring the user is authenticated
- Throwing an error for protected operations without valid authentication

```typescript
// Example of authentication functions (simplified)
const resolveUserFn: ResolveUserFn<User> = async (context: any) => {
  return user;
};

const validateUser: ValidateUserFn<any> = ({ user, executionArgs }) => {
  // Check if operation is public using the @public directive
  if (isPublicOperation(executionArgs)) {
    return; // Allow public operations
  }

  // For non-public operations, validate authentication
  if (user === null) {
    throw new GraphQLError("Authentication failed for non-public operation", {
      extensions: { code: "UNAUTHORIZED", status: 401 },
    });
  }
};
```

## Gateway Authentication Process

```mermaid
flowchart TB
    A[Request Received] --> B[resolveUserFn]
    B --> C{Has Auth Token?}
    C -->|Yes| D[Verify JWT Token]
    C -->|No| E[Generate Public Signature]
    D -->|Valid| F[Add User to Context]
    D -->|Invalid| G[Throw Auth Error]
    E --> H[validateUser]
    F --> H
    H --> I{Is Public Operation?}
    I -->|Yes| J[Allow Request]
    I -->|No| K{User Authenticated?}
    K -->|Yes| L[Allow Request]
    K -->|No| M[Throw Auth Error]
    J --> N[Forward to Services]
    L --> N
    N --> O[Return Response]
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
